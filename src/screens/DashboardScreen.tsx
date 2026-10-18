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

import { Plus, MoreHorizontal, Check, TrendingUp, TrendingDown, Settings } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/PageHeader'
import { SectionHeader } from '../components/SectionHeader'
import { EmptyState } from '../components/EmptyState'
import { ActivityIcon } from '../components/ActivityIcon'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAppStore } from '../store/useAppStore'
import { usePreferences } from '../hooks/usePreferences'
import { useNotification } from '../hooks/useNotification'
import { sessionsForRoutine, calculateVolume } from '../domain/calculations'
import type { Navigate } from '../App'
import type { Activity, DayOfWeek, MeasurementType, Routine, Session } from '../domain/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
  onStartSession: (routineId: string, date?: string) => void
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

function tomorrow(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 1)
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

// ─── Today's cards (grouped by routine) ───────────────────────────────────────

interface TodayCard {
  routine: Routine
  /** Activities scheduled for today within this routine. */
  activities: Activity[]
  completedToday: boolean
  /** Original index for stable tie-breaking. */
  index: number
}

/**
 * Build one card per routine scheduled for today, sorted by:
 * 0. Incomplete routines above completed ones
 * 1. Preferred time (Morning, Afternoon, Evening, Any time)
 * 2. Estimated duration ascending (shorter first)
 * 3. Original creation order as tie-breaker
 *
 * A routine with multiple activities (e.g. strength exercises) becomes
 * one card with sub-items — not multiple cards.
 */
function buildTodayCards(
  routines: Routine[],
  sessions: Session[],
  todayStr: string,
): TodayCard[] {
  const todayDow = isoDayOfWeek(todayStr)

  const cards: TodayCard[] = routines
    .map((routine, index) => {
      const scheduledActivities = routine.activities.filter((a) => {
        if (!a.scheduledDays || a.scheduledDays.length === 0) return true
        return a.scheduledDays.includes(todayDow)
      })

      if (scheduledActivities.length === 0) return null

      const completedToday = sessionsForRoutine(sessions, routine.id).some(
        (s) => s.completedAt.slice(0, 10) === todayStr,
      )

      return { routine, activities: scheduledActivities, completedToday, index }
    })
    .filter((card): card is TodayCard => card !== null)

  cards.sort((a, b) => {
    // 0. Incomplete above completed
    if (a.completedToday !== b.completedToday) return a.completedToday ? 1 : -1

    // 1. Preferred time (use the first activity's preferredTime)
    const timeDiff = timeOrder(a.activities[0]?.preferredTime) - timeOrder(b.activities[0]?.preferredTime)
    if (timeDiff !== 0) return timeDiff

    // 2. Estimated duration ascending
    const durA = a.activities[0] ? estimatedDuration(a.activities[0]) : null
    const durB = b.activities[0] ? estimatedDuration(b.activities[0]) : null
    if (durA !== null && durB !== null && durA !== durB) return durA - durB
    if (durA !== null && durB === null) return -1
    if (durA === null && durB !== null) return 1

    // 3. Stable original order
    return a.index - b.index
  })

  return cards
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
  if (sessions.length === 0) return false

  const y = yesterday()
  const yDow = isoDayOfWeek(y)

  return routines.some((routine) => {
    if (routine.createdAt.slice(0, 10) >= y) return false

    const scheduledYesterday = routine.activities.some((a) => {
      if (a.frequency === 'daily') return true
      if (!a.scheduledDays || a.scheduledDays.length === 0) return false
      return a.scheduledDays.includes(yDow)
    })

    if (!scheduledYesterday) return false

    const didYesterday = sessionsForRoutine(sessions, routine.id).some(
      (s) => s.completedAt.slice(0, 10) === y,
    )
    return !didYesterday
  })
}

// ─── Tomorrow preview ─────────────────────────────────────────────────────────

function buildTomorrowNames(routines: Routine[]): string[] {
  const tomorrowStr = tomorrow()
  const tomorrowDow = isoDayOfWeek(tomorrowStr)

  return routines
    .filter((routine) => {
      return routine.activities.some((a) => {
        if (a.frequency === 'daily') return true
        if (a.scheduledDays && a.scheduledDays.length > 0) {
          return a.scheduledDays.includes(tomorrowDow)
        }
        return false // no scheduled days + non-daily = cannot predict
      })
    })
    .map((r) => r.name)
}

// ─── Format duration ──────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `~${h}h`
  return `~${h}h ${m}m`
}

// ─── Metric helpers ───────────────────────────────────────────────────────────

function metricUnit(type: MeasurementType): string {
  switch (type) {
    case 'weight': return 'kg'
    case 'distance': return 'km'
    case 'duration': return 'min'
    case 'quantity': return ''
    case 'sets': return 'sets'
    case 'reps': return 'reps'
  }
}

/**
 * Get the primary target string for an activity.
 * Priority: distance > quantity > duration > weight.
 * Returns null if no target is set.
 */
function primaryTarget(activity: Activity): string | null {
  const priority: MeasurementType[] = ['distance', 'quantity', 'duration', 'weight']

  for (const type of priority) {
    const m = activity.measurements.find((m) => m.type === type)
    if (m?.target !== undefined) {
      const unit = m.unit ?? metricUnit(type)
      switch (type) {
        case 'distance': return `${m.target} ${unit} target`
        case 'quantity': return `${m.target}${unit ? ` ${unit}` : ''} target`
        case 'duration': return `${m.target} ${unit} target`
        case 'weight': return `${m.target} ${unit} target`
      }
    }
  }
  return null
}

// ─── Completed activity result helpers ────────────────────────────────────────

interface CompletedResult {
  /** Formatted measurement strings, e.g. ["5.2 km", "31 min"] */
  measurements: string[]
  /** Delta vs previous session, if one exists. Null otherwise. */
  delta: { percent: number; label: string } | null
}

/**
 * Extract the most recent session result for an activity on a given day
 * and compare it with the most recent prior session for the same routine.
 */
function getCompletedResult(
  sessions: Session[],
  routine: Routine,
  activity: Activity,
  todayStr: string,
): CompletedResult | null {
  const routineSessions = sessionsForRoutine(sessions, routine.id)
  // Find today's session
  const todaySession = [...routineSessions]
    .reverse()
    .find((s) => s.completedAt.slice(0, 10) === todayStr)
  if (!todaySession) return null

  const todayResult = todaySession.results.find((r) => r.activityId === activity.id)
  if (!todayResult) return null

  // Build measurements display
  const measurements: string[] = []

  // Sets-based (strength)
  if (todayResult.sets && todayResult.sets.length > 0) {
    const vol = calculateVolume(todaySession, activity.id)
    if (vol > 0) measurements.push(`${vol} kg volume`)
    measurements.push(`${todayResult.sets.length} sets`)
  }

  // Scalar measurements
  for (const [type, value] of Object.entries(todayResult.measurements)) {
    if (value !== undefined) {
      const unit = metricUnit(type as MeasurementType)
      measurements.push(`${value}${unit ? ` ${unit}` : ''}`)
    }
  }

  // AVOID activity
  if (todayResult.stayedOnTrack !== undefined) {
    measurements.push(todayResult.stayedOnTrack ? 'On track' : 'Slipped')
  }

  // Find previous session (before today) for comparison
  const prevSession = [...routineSessions]
    .reverse()
    .find((s) => s.completedAt.slice(0, 10) !== todayStr)

  let delta: CompletedResult['delta'] = null
  if (prevSession) {
    const prevResult = prevSession.results.find((r) => r.activityId === activity.id)
    if (prevResult) {
      // Compare volume for strength activities
      if (
        todayResult.sets && todayResult.sets.length > 0 &&
        prevResult.sets && prevResult.sets.length > 0
      ) {
        const todayVol = calculateVolume(todaySession, activity.id)
        const prevVol = calculateVolume(prevSession, activity.id)
        if (prevVol > 0) {
          const pct = Math.round(((todayVol - prevVol) / prevVol) * 100)
          if (pct !== 0) delta = { percent: pct, label: 'volume' }
        }
      } else {
        // Compare the first shared scalar metric
        for (const [type, todayVal] of Object.entries(todayResult.measurements)) {
          const prevVal = prevResult.measurements[type as MeasurementType]
          if (todayVal !== undefined && prevVal !== undefined && prevVal > 0) {
            const pct = Math.round(((todayVal - prevVal) / prevVal) * 100)
            if (pct !== 0) {
              delta = { percent: pct, label: type }
              break
            }
          }
        }
      }
    }
  }

  return { measurements, delta }
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

// ─── Time-of-day grouping ─────────────────────────────────────────────────────

interface TimeGroup {
  label: string
  cards: TodayCard[]
}

/**
 * Group today's cards by preferred time. Returns groups in display order:
 * Morning, Afternoon, Evening, Anytime.
 *
 * If ALL cards have the same preferred time (or all have none), return
 * a single group with no label — preserving the current flat-list look.
 */
function groupByTime(cards: TodayCard[]): TimeGroup[] {
  const groups: Record<string, TodayCard[]> = {
    Morning: [],
    Afternoon: [],
    Evening: [],
    Anytime: [],
  }

  for (const card of cards) {
    const time = card.activities[0]?.preferredTime
    if (time && time in groups) {
      groups[time]!.push(card)
    } else {
      groups['Anytime']!.push(card)
    }
  }

  const nonEmpty = Object.entries(groups)
    .filter(([_, cards]) => cards.length > 0)
    .map(([label, cards]) => ({ label, cards }))

  // If only one group exists, return it without a label
  // (preserves flat-list look when all activities share the same time or none)
  if (nonEmpty.length <= 1) {
    return nonEmpty.map(g => ({ ...g, label: '' }))
  }

  return nonEmpty
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function greeting(userName?: string): string {
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  if (userName) return `${timeGreeting}, ${userName}`
  return timeGreeting
}

// ─── Streak / days-active helpers ─────────────────────────────────────────────

/**
 * Count consecutive calendar days (ending today or yesterday) that have
 * at least one session. Returns 0 if no recent sessions.
 */
function dayStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0

  const dates = new Set<string>()
  for (const s of sessions) {
    dates.add(s.completedAt.slice(0, 10))
  }

  const d = new Date()
  let streak = 0

  const todayStr = d.toISOString().slice(0, 10)
  if (!dates.has(todayStr)) {
    d.setDate(d.getDate() - 1)
    if (!dates.has(d.toISOString().slice(0, 10))) return 0
  }

  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().slice(0, 10)
    if (dates.has(dateStr)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * Count days since the first session was logged.
 */
function daysActive(sessions: Session[]): number {
  if (sessions.length === 0) return 0
  const sorted = [...sessions].sort((a, b) => a.completedAt.localeCompare(b.completedAt))
  const first = new Date(sorted[0]!.completedAt)
  const now = new Date()
  return Math.max(1, Math.floor((now.getTime() - first.getTime()) / 86_400_000) + 1)
}

// ─── Circular progress ring ───────────────────────────────────────────────────

function CircularProgress({
  completed,
  total,
  allDone,
}: {
  completed: number
  total: number
  allDone: boolean
}) {
  const size = 96
  const strokeWidth = 7
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? completed / total : 0
  const offset = circumference * (1 - progress)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={allDone ? 'var(--success)' : 'var(--brand)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {allDone ? (
          <Check size={28} className="text-success" aria-hidden="true" />
        ) : (
          <span className="text-lg font-bold text-foreground">
            {completed}/{total}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardScreen({ navigate, onStartSession }: Props) {
  const { state } = useAppStore()
  const { routines, sessions } = state
  const { preferences } = usePreferences()
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
  const todayCards = buildTodayCards(routines, sessions, todayStr)

  const totalCards = todayCards.length
  const completedCount = todayCards.filter((c) => c.completedToday).length
  const allComplete = totalCards > 0 && completedCount === totalCards
  const hasSessions = sessions.length > 0

  const missedYesterday = shouldShowMissedYesterday(routines, sessions, allComplete)
  const tomorrowNames = buildTomorrowNames(routines)

  if (totalCards === 0) {
    return (
      <div data-testid="screen-dashboard" className="flex flex-col min-h-full">
        <PageHeader
          title={formatToday()}
          rightAction={
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                data-testid="settings-button"
                aria-label="Settings"
                onClick={() => navigate('settings')}
              >
                <Settings size={20} aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                data-testid="add-routine-button"
                aria-label="Add routine"
                onClick={() => navigate('welcome')}
              >
                <Plus size={20} aria-hidden="true" />
              </Button>
            </div>
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
        title={formatToday()}
        rightAction={
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              data-testid="settings-button"
              aria-label="Settings"
              onClick={() => navigate('settings')}
            >
              <Settings size={20} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              data-testid="add-routine-button"
              aria-label="Add routine"
              onClick={() => navigate('welcome')}
            >
              <Plus size={20} aria-hidden="true" />
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-6">
        {missedYesterday && (
          <div
            data-testid="missed-yesterday"
            className="rounded-xl bg-brand-light px-4 py-3 text-sm text-foreground"
          >
            <p>Missed yesterday? You can still log it.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {routines
                .filter((routine) => {
                  const y = yesterday()
                  const yDow = isoDayOfWeek(y)
                  if (routine.createdAt.slice(0, 10) >= y) return false
                  return routine.activities.some((a) => {
                    if (a.frequency === 'daily') return true
                    if (a.scheduledDays && a.scheduledDays.length > 0) return a.scheduledDays.includes(yDow)
                    return false
                  })
                })
                .filter((routine) => {
                  const y = yesterday()
                  return !sessionsForRoutine(sessions, routine.id).some(
                    (s) => s.completedAt.slice(0, 10) === y
                  )
                })
                .map((routine) => (
                  <Button
                    key={routine.id}
                    variant="outline"
                    size="sm"
                    data-testid={`log-yesterday-${routine.id}`}
                    onClick={() => onStartSession(routine.id, yesterday())}
                    className="text-xs"
                  >
                    Log {routine.name}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* Hero summary: ring + text side by side */}
        <div data-testid="daily-summary" className="flex items-center gap-4">
          <CircularProgress
            completed={completedCount}
            total={totalCards}
            allDone={allComplete}
          />
          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
            <p className="text-xl font-semibold text-foreground">
              {hasSessions ? greeting(preferences.userName || undefined) : 'Ready for your first session?'}
            </p>
            <p data-testid="completion-text" className="text-base text-muted-foreground">
              {allComplete ? 'All done for today' : `${completedCount} of ${totalCards} completed`}
            </p>
            {sessions.length > 0 && (
              <p data-testid="streak-counter" className="text-base text-muted-foreground">
                {(() => {
                  const streak = dayStreak(sessions)
                  if (streak >= 2) return `🔥 ${streak}-day streak`
                  const active = daysActive(sessions)
                  return `Active for ${active} ${active === 1 ? 'day' : 'days'}`
                })()}
              </p>
            )}
          </div>
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
          {groupByTime(todayCards).map((group) => (
            <div key={group.label || 'all'} className="mb-4 last:mb-0">
              {group.label && (
                <p
                  data-testid={`time-group-${group.label.toLowerCase()}`}
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-3 first:mt-0"
                >
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-3">
                {group.cards.map(({ activities: cardActivities, routine, completedToday }) => {
                  const primaryActivity = cardActivities[0]!
                  const hasMultipleActivities = cardActivities.length > 1

                  if (completedToday) {
                    const result = getCompletedResult(sessions, routine, primaryActivity, todayStr)
                    return (
                      <div
                        key={routine.id}
                        data-testid={`activity-card-${primaryActivity.id}`}
                        className="rounded-xl border border-success/30 bg-success-muted/30 p-4"
                      >
                        <div className="flex items-start gap-2">
                          <ActivityIcon name={routine.name} size={32} className="mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{routine.name}</p>
                              <span
                                data-testid={`completed-badge-${primaryActivity.id}`}
                                className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success"
                              >
                                <Check size={12} aria-hidden="true" />
                                Done
                              </span>
                            </div>
                            {hasMultipleActivities && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {cardActivities.map((a) => a.name).join(', ')}
                              </p>
                            )}
                            {result && result.measurements.length > 0 && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {result.measurements.join(' \u00b7 ')}
                              </p>
                            )}
                            {result?.delta && (
                              <div
                                data-testid={`activity-delta-${primaryActivity.id}`}
                                className={`flex items-center gap-1 mt-1.5 text-sm font-medium ${
                                  result.delta.percent > 0 ? 'text-success' : 'text-destructive'
                                }`}
                              >
                                {result.delta.percent > 0
                                  ? <TrendingUp size={14} aria-hidden="true" />
                                  : <TrendingDown size={14} aria-hidden="true" />
                                }
                                <span>
                                  {result.delta.percent > 0 ? '+' : ''}{result.delta.percent}%{' '}
                                  {result.delta.label} vs last session
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          data-testid={`log-session-button-${routine.id}`}
                          onClick={() => onStartSession(routine.id)}
                          className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Log again
                        </button>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={routine.id}
                      role="button"
                      tabIndex={0}
                      data-testid={`activity-card-${primaryActivity.id}`}
                      onClick={() => onStartSession(routine.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStartSession(routine.id) } }}
                      className="rounded-xl border border-border bg-card ring-1 ring-foreground/5 p-4 w-full text-left cursor-pointer hover:bg-surface-muted active:bg-surface-muted/80 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <ActivityIcon name={routine.name} size={32} className="mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">{routine.name}</p>
                          {hasMultipleActivities ? (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {cardActivities.map((a) => a.name).join(', ')}
                            </p>
                          ) : (
                            (() => {
                              if (primaryActivity.direction === 'AVOID') return null
                              const target = primaryTarget(primaryActivity)
                              if (!target) return null
                              return (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {target}
                                </p>
                              )
                            })()
                          )}
                        </div>
                        <div
                          className="relative shrink-0 -mr-2 -mt-1"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation() }}
                        >
                          <button
                            type="button"
                            data-testid={`remind-button-${routine.id}`}
                            aria-label={`Options for ${routine.name}`}
                            onClick={() => setOpenSnooze(openSnooze === routine.id ? null : routine.id)}
                            className="flex items-center justify-center size-11 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
                          >
                            <MoreHorizontal size={18} aria-hidden="true" />
                          </button>
                          {openSnooze === routine.id && (
                            <div
                              data-testid={`remind-menu-${routine.id}`}
                              className="absolute right-0 top-full mt-1 z-10 w-44 rounded-lg border border-border bg-card p-1 shadow-lg ring-1 ring-foreground/5"
                            >
                              <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Remind me</p>
                              {SNOOZE_OPTIONS.map((opt) => (
                                <button
                                  key={opt.label}
                                  type="button"
                                  data-testid={`remind-option-${opt.minutes}`}
                                  onClick={() => handleSnooze(routine.name, routine.id, opt.minutes)}
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
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {tomorrowNames.length > 0 && (
          <div data-testid="tomorrow-preview">
            <SectionHeader title="Tomorrow" />
            <p className="text-sm text-muted-foreground">
              {tomorrowNames.join(', ')} · {tomorrowNames.length} {tomorrowNames.length === 1 ? 'activity' : 'activities'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
