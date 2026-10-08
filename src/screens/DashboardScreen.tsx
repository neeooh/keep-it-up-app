/**
 * DashboardScreen — the Today screen.
 *
 * A focused daily action list that answers: "What do I need to do today,
 * and how much have I completed?"
 *
 * Shows the current date, a daily completion summary (X of Y completed),
 * a list of today's activities sorted by preferred time then duration,
 * and per-activity Start / Log another actions.
 *
 * Does NOT show: Momentum, This Week, Progress deltas, or any historical
 * analytics — those belong on Progress and Review.
 *
 * Spec reference: docs/uiux-audits/v1.1-ui-ux-audit.md sections 1-7.
 */

import { Plus, ClipboardCheck, Check, Pencil, Bell } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { PageHeader } from '../components/PageHeader'
import { SectionHeader } from '../components/SectionHeader'
import { EmptyState } from '../components/EmptyState'
import { useAppStore } from '../store/useAppStore'
import { useNotification } from '../hooks/useNotification'
import { sessionsForRoutine } from '../domain/calculations'
import type { Navigate } from '../App'
import type { Activity, DayOfWeek, Routine, Session } from '../domain/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
  onStartSession: (routineId: string) => void
  onEditRoutine: (routineId: string) => void
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterday(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** ISO day-of-week (1 = Mon … 7 = Sun) for a YYYY-MM-DD date. */
function isoDayOfWeek(dateStr: string): DayOfWeek {
  const [y, m, d] = dateStr.split('-').map(Number)
  const day = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay() // 0 = Sun
  return (day === 0 ? 7 : day) as DayOfWeek
}

/** Nicely formatted long date, e.g. "Thursday, 8 October". */
function formatToday(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// ─── Preferred-time sort order ────────────────────────────────────────────────

const TIME_ORDER: Record<string, number> = {
  Morning: 0,
  Afternoon: 1,
  Evening: 2,
}
const DEFAULT_TIME_ORDER = 3 // "Any time" sorts last

function timeOrder(preferredTime?: string): number {
  if (!preferredTime) return DEFAULT_TIME_ORDER
  return TIME_ORDER[preferredTime] ?? DEFAULT_TIME_ORDER
}

/** Get the estimated duration in minutes from an activity's measurements. */
function estimatedDuration(activity: Activity): number | null {
  const dur = activity.measurements.find((m) => m.type === 'duration')
  return dur?.target ?? null
}

// ─── Today's activities ───────────────────────────────────────────────────────

interface TodayActivity {
  activity: Activity
  routine: Routine
  completedToday: boolean
  /** Original index for stable tie-breaking. */
  index: number
}

/**
 * Build the list of activities scheduled for today, sorted by:
 * 1. Preferred time (Morning, Afternoon, Evening, Any time)
 * 2. Estimated duration ascending (shorter first)
 * 3. Original creation order as tie-breaker
 */
function buildTodayActivities(
  routines: Routine[],
  sessions: Session[],
  todayStr: string,
): TodayActivity[] {
  const todayDow = isoDayOfWeek(todayStr)
  let index = 0

  const activities: TodayActivity[] = routines.flatMap((routine) =>
    routine.activities
      .filter((a) => {
        if (!a.scheduledDays || a.scheduledDays.length === 0) return true
        return a.scheduledDays.includes(todayDow)
      })
      .map((activity) => {
        const completedToday = sessionsForRoutine(sessions, routine.id).some(
          (s) => s.completedAt.slice(0, 10) === todayStr,
        )
        return { activity, routine, completedToday, index: index++ }
      }),
  )

  activities.sort((a, b) => {
    const timeDiff = timeOrder(a.activity.preferredTime) - timeOrder(b.activity.preferredTime)
    if (timeDiff !== 0) return timeDiff

    const durA = estimatedDuration(a.activity)
    const durB = estimatedDuration(b.activity)
    if (durA !== null && durB !== null && durA !== durB) return durA - durB
    if (durA !== null && durB === null) return -1
    if (durA === null && durB !== null) return 1

    return a.index - b.index
  })

  return activities
}

/**
 * True when any routine was scheduled for yesterday but no session was
 * completed yesterday, AND today still has incomplete activities.
 */
function shouldShowMissedYesterday(
  routines: Routine[],
  sessions: Session[],
  allCompleteToday: boolean,
): boolean {
  if (allCompleteToday) return false

  const y = yesterday()
  const yDow = isoDayOfWeek(y)
  return routines.some((routine) => {
    const scheduledYesterday = routine.activities.some((a) => {
      if (!a.scheduledDays || a.scheduledDays.length === 0) return true
      return a.scheduledDays.includes(yDow)
    })
    if (!scheduledYesterday) return false
    const didYesterday = sessionsForRoutine(sessions, routine.id).some(
      (s) => s.completedAt.slice(0, 10) === y,
    )
    return !didYesterday
  })
}

// ─── Format duration ──────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `~${h}h`
  return `~${h}h ${m}m`
}

// ─── Snooze options ───────────────────────────────────────────────────────────

const SNOOZE_OPTIONS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '4 hours', minutes: 240 },
  { label: 'This evening', minutes: -1 }, // special: calculated at runtime
] as const

/** Calculate minutes until 18:00 today, minimum 15 minutes. */
function minutesUntilEvening(): number {
  const now = new Date()
  const evening = new Date(now)
  evening.setHours(18, 0, 0, 0)
  const diff = Math.round((evening.getTime() - now.getTime()) / 60_000)
  return Math.max(15, diff)
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardScreen({ navigate, onStartSession, onEditRoutine }: Props) {
  const { state } = useAppStore()
  const { routines, sessions } = state
  const { permission, requestPermission, scheduleReminder, confirmation } = useNotification()
  const [openSnooze, setOpenSnooze] = useState<string | null>(null)

  async function handleSnooze(activityName: string, activityId: string, minutes: number) {
    let perm = permission
    if (perm === 'default') {
      perm = await requestPermission()
    }
    if (perm === 'granted') {
      const delay = minutes === -1 ? minutesUntilEvening() : minutes
      scheduleReminder(activityName, delay)
    }
    setOpenSnooze(null)
  }

  if (routines.length === 0) {
    return (
      <div data-testid="screen-dashboard" className="flex flex-col min-h-full">
        <div data-testid="dashboard-empty" className="flex flex-1 flex-col">
          <EmptyState
            icon={<Plus size={32} aria-hidden="true" />}
            title="No routines yet"
            description="Create your first routine to start tracking."
            actionLabel="Create a routine"
            onAction={() => navigate('welcome')}
          />
          <button
            type="button"
            data-testid="create-routine-button"
            onClick={() => navigate('welcome')}
            className="sr-only"
          >
            Create a routine
          </button>
        </div>
      </div>
    )
  }

  const todayStr = today()
  const todayActivities = buildTodayActivities(routines, sessions, todayStr)

  const totalActivities = todayActivities.length
  const completedCount = todayActivities.filter((a) => a.completedToday).length
  const allComplete = totalActivities > 0 && completedCount === totalActivities
  const hasSessions = sessions.length > 0

  const missedYesterday = shouldShowMissedYesterday(routines, sessions, allComplete)

  if (totalActivities === 0) {
    return (
      <div data-testid="screen-dashboard" className="flex flex-col min-h-full">
        <PageHeader
          title={formatToday()}
          rightAction={
            <Button
              variant="ghost"
              size="icon"
              data-testid="add-routine-button"
              aria-label="Add routine"
              onClick={() => navigate('welcome')}
            >
              <Plus size={20} aria-hidden="true" />
            </Button>
          }
        />
        <div data-testid="today-empty" className="flex flex-1 flex-col">
          <EmptyState
            icon={<Plus size={32} aria-hidden="true" />}
            title="No activities planned for today"
            description="Enjoy the day, or add an activity to your plan."
            actionLabel="Add an activity"
            onAction={() => navigate('welcome')}
          />
        </div>
      </div>
    )
  }

  return (
    <div data-testid="screen-dashboard" className="flex flex-col min-h-full">
      <PageHeader
        title={hasSessions ? formatToday() : 'Ready for your first session?'}
        rightAction={
          <Button
            variant="ghost"
            size="icon"
            data-testid="add-routine-button"
            aria-label="Add routine"
            onClick={() => navigate('welcome')}
          >
            <Plus size={20} aria-hidden="true" />
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-6">
        {missedYesterday && (
          <div
            data-testid="missed-yesterday"
            className="rounded-xl bg-brand-light px-4 py-3 text-sm text-foreground"
          >
            Missed yesterday? No problem — today is ready.
          </div>
        )}

        <div data-testid="daily-summary">
          <p className="text-base font-medium text-foreground" data-testid="completion-text">
            {completedCount} of {totalActivities} completed
          </p>
          <Progress
            value={totalActivities > 0 ? (completedCount / totalActivities) * 100 : 0}
            data-testid="completion-bar"
            className="mt-2 h-2"
          />
        </div>

        {/* Snooze confirmation toast */}
        {confirmation && (
          <div
            data-testid="remind-confirmation"
            className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success"
          >
            {confirmation}
          </div>
        )}

        <div>
          <SectionHeader title="Today's activities" />
          <div className="flex flex-col gap-3">
            {todayActivities.map(({ activity, routine, completedToday }) => (
              <div
                key={`${routine.id}-${activity.id}`}
                data-testid={`activity-card-${activity.id}`}
                className={`rounded-xl border p-4 ${
                  completedToday
                    ? 'border-success/30 bg-success-muted/30'
                    : 'border-border bg-card ring-1 ring-foreground/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {completedToday && (
                        <div className="flex items-center justify-center size-5 rounded-full bg-success text-success-foreground shrink-0">
                          <Check size={12} aria-hidden="true" />
                        </div>
                      )}
                      <p className={`font-semibold ${completedToday ? 'text-foreground/70' : 'text-foreground'}`}>
                        {activity.name}
                      </p>
                    </div>
                    {completedToday ? (
                      <p className="text-sm text-success mt-0.5 ml-7">Completed</p>
                    ) : (
                      estimatedDuration(activity) !== null && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {formatDuration(estimatedDuration(activity)!)}
                        </p>
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    data-testid={`edit-routine-button-${routine.id}`}
                    aria-label={`Edit ${routine.name}`}
                    onClick={() => onEditRoutine(routine.id)}
                    className="flex items-center justify-center size-11 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors shrink-0 -mr-2 -mt-1"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                </div>

                {completedToday ? (
                  <Button
                    data-testid={`log-session-button-${routine.id}`}
                    variant="ghost"
                    onClick={() => onStartSession(routine.id)}
                    className="w-full mt-3 text-muted-foreground"
                  >
                    Log another
                  </Button>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <Button
                      data-testid={`log-session-button-${routine.id}`}
                      onClick={() => onStartSession(routine.id)}
                      className="flex-1"
                    >
                      <ClipboardCheck size={16} className="mr-2" aria-hidden="true" />
                      Log
                    </Button>
                    <div className="relative flex-1">
                      <Button
                        data-testid={`remind-button-${activity.id}`}
                        variant="outline"
                        onClick={() => setOpenSnooze(openSnooze === activity.id ? null : activity.id)}
                        className="w-full"
                      >
                        <Bell size={16} className="mr-2" aria-hidden="true" />
                        Remind
                      </Button>
                      {openSnooze === activity.id && (
                        <div
                          data-testid={`remind-menu-${activity.id}`}
                          className="absolute right-0 top-full mt-1 z-10 w-44 rounded-lg border border-border bg-card p-1 shadow-lg ring-1 ring-foreground/5"
                        >
                          {SNOOZE_OPTIONS.map((opt) => (
                            <button
                              key={opt.label}
                              type="button"
                              data-testid={`remind-option-${opt.minutes}`}
                              onClick={() => handleSnooze(activity.name, activity.id, opt.minutes)}
                              className="flex w-full items-center rounded-md px-3 py-2 text-sm text-foreground hover:bg-surface-muted transition-colors"
                            >
                              {opt.label}
                            </button>
                          ))}
                          {permission === 'denied' && (
                            <p className="px-3 py-2 text-xs text-destructive">
                              Notifications are blocked. Enable them in your browser settings.
                            </p>
                          )}
                          {permission === 'unsupported' && (
                            <p className="px-3 py-2 text-xs text-muted-foreground">
                              Notifications are not supported in this browser.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
