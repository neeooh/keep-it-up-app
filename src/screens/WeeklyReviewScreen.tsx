/**
 * WeeklyReviewScreen — reflective weekly review.
 *
 * Reviews the most recently completed week (Monday–Sunday), not the
 * ongoing week.  This means the data is final — no misleading numbers
 * from future days that have not happened yet.
 *
 * When no completed week with sessions exists, shows a countdown to the
 * next Monday when the first review will be ready.
 *
 * Shows a completion summary, a positive insight, an optional struggle
 * note, a momentum stat, and two forward-looking actions (keep / adjust).
 * Schedule and frequency changes happen through the Edit Routine screen.
 */

import { CalendarCheck } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { PageHeader } from '../components/PageHeader'
import { SectionHeader } from '../components/SectionHeader'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { useAppStore } from '../store/useAppStore'
import {
  calculateWeeklySummary,
  calculateProgress,
  sessionsInRange,
} from '../domain/calculations'
import type { Navigate } from '../App'
import type {
  MeasurementType,
  Session,
  WeeklySummary,
} from '../domain/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
  onEditRoutine: (routineId: string) => void
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Return the Monday of the previous ISO week. */
function previousWeekStart(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const thisMonday = new Date(now)
  thisMonday.setUTCDate(now.getUTCDate() + diff)
  // Go back 7 days to get last week's Monday
  thisMonday.setUTCDate(thisMonday.getUTCDate() - 7)
  return thisMonday.toISOString().slice(0, 10)
}

/** Return the Sunday (YYYY-MM-DD) of a week given its Monday. */
function weekSunday(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const monday = new Date(Date.UTC(y!, m! - 1, d!))
  monday.setUTCDate(monday.getUTCDate() + 6)
  return monday.toISOString().slice(0, 10)
}

/** Format a date range as "5 Oct – 11 Oct". */
function formatWeekRange(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const monday = new Date(Date.UTC(y!, m! - 1, d!))
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  const fmt = (dt: Date) =>
    dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

/** Format a date as "Monday, 13 October". */
function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d!))
  return dt.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Return a human-readable countdown from now to next Monday.
 * e.g. "in 5 days", "in 1 day", "tomorrow".
 */
function countdownToNextMonday(): string {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun, 1=Mon, ...
  const daysUntil = day === 0 ? 1 : (8 - day)
  if (daysUntil === 1) return 'tomorrow'
  if (daysUntil === 0) return 'today'
  return `in ${daysUntil} days`
}

/** Return next Monday as YYYY-MM-DD. */
function nextMonday(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const daysUntil = day === 0 ? 1 : (8 - day)
  const next = new Date(now)
  next.setUTCDate(now.getUTCDate() + daysUntil)
  return next.toISOString().slice(0, 10)
}

function daysSinceFirstSession(sessions: Session[]): number {
  const oldest = sessions[0]
  if (!oldest) return 0
  return Math.floor(
    (Date.now() - new Date(oldest.completedAt).getTime()) / 86_400_000,
  )
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

function metricLabel(type: MeasurementType): string {
  switch (type) {
    case 'weight': return 'weight'
    case 'distance': return 'distance'
    case 'duration': return 'duration'
    case 'quantity': return 'count'
    case 'sets': return 'sets'
    case 'reps': return 'reps'
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function WeeklyReviewScreen({ navigate, onEditRoutine }: Props) {
  const { state } = useAppStore()
  const { routines, sessions } = state

  // Review the most recently completed week (last Monday–Sunday).
  const weekStart = previousWeekStart()
  const weekEnd = weekSunday(weekStart)

  // Check if any sessions exist in the reviewed week.
  const reviewedSessions = sessionsInRange(sessions, { start: weekStart, end: weekEnd })
  const hasReviewData = reviewedSessions.length > 0

  // ── Empty / countdown state ─────────────────────────────────────────────
  if (sessions.length === 0 || !hasReviewData) {
    const countdown = countdownToNextMonday()
    const nextMon = nextMonday()
    return (
      <div data-testid="screen-weekly-review" className="flex flex-col min-h-full">
        <PageHeader title="Your week" />
        <EmptyState
          icon={<CalendarCheck size={32} aria-hidden="true" />}
          title="Your weekly review"
          description={
            sessions.length === 0
              ? `Complete your first week of sessions. Your first review will be ready ${countdown}, on ${formatLongDate(nextMon)}.`
              : `No sessions were logged last week. Your next review will be ready ${countdown}, on ${formatLongDate(nextMon)}.`
          }
        />
        <span data-testid="review-countdown" className="sr-only">{countdown}</span>
      </div>
    )
  }

  const summary: WeeklySummary = calculateWeeklySummary(
    sessions,
    routines,
    weekStart,
  )

  const consistency = summary.overallConsistency
  const planned = summary.entries.reduce((sum, e) => sum + e.planned, 0)
  const completed = summary.entries.reduce((sum, e) => sum + e.completed, 0)
  const missed = Math.max(planned - completed, 0)

  // Progress highlights (positive deltas drive "what went well").
  const progressEntries = routines.flatMap((r) =>
    r.activities.flatMap((a) => calculateProgress(sessions, a)),
  )
  const positiveProgress = progressEntries.filter((e) => e.deltaPercent > 0)

  // A routine that hit 100% last week.
  const perfectRoutine = summary.entries.find(
    (e) => e.planned > 0 && e.completed >= e.planned,
  )

  // The weakest routine (for the constructive note) when clearly behind.
  const sortedByRate = [...summary.entries]
    .filter((e) => e.planned > 0)
    .sort((a, b) => a.consistencyRate - b.consistencyRate)
  const weakest = sortedByRate[0]
  const hasClearWeakest =
    sortedByRate.length > 1 &&
    weakest !== undefined &&
    weakest.consistencyRate < 0.5

  const activeDays = daysSinceFirstSession(sessions)

  const primaryRoutine = routines[0]

  // ─── "What went well" lines ──────────────────────────────────────────────
  const wentWell: string[] = []
  if (consistency >= 80) {
    wentWell.push(`Strong week. You completed ${completed} of ${planned} sessions.`)
  }
  if (perfectRoutine) {
    wentWell.push(`You hit every ${perfectRoutine.routineName} session.`)
  }
  for (const entry of positiveProgress.slice(0, 2)) {
    wentWell.push(
      `Your ${entry.activityName} improved — ${metricLabel(entry.metric)} went up.`,
    )
  }

  return (
    <div data-testid="screen-weekly-review" className="flex flex-col min-h-full">
      <PageHeader title="Your week" description={formatWeekRange(weekStart)} />

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-6">
        {/* a. Completion summary */}
        <section>
          <StatCard label="Consistency" value={`${consistency}%`} />
          <Progress
            value={consistency}
            data-testid="review-consistency-bar"
            className="mt-3 h-2"
          />
          <span data-testid="review-consistency" className="sr-only">
            {consistency}%
          </span>

          {summary.entries.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {summary.entries.map((entry) => (
                <div
                  key={entry.routineId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{entry.routineName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {entry.completed} / {entry.planned}
                    </span>
                    {entry.planned > 0 && entry.completed >= entry.planned && (
                      <StatusBadge variant="success" label="Done" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* b. What went well */}
        {wentWell.length > 0 && (
          <section>
            <SectionHeader title="What went well" />
            <div className="flex flex-col gap-1.5">
              {wentWell.map((line, i) => (
                <p
                  key={i}
                  data-testid={i === 0 ? 'review-went-well' : undefined}
                  className="text-sm text-foreground"
                >
                  {line}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* c. Last week — constructive missed-session framing */}
        {consistency < 80 && planned > 0 && (
          <section>
            <SectionHeader title="Last week" />
            <div className="flex flex-col gap-1.5">
              <p data-testid="review-struggled" className="text-sm text-foreground">
                {completed} of {planned} planned sessions completed.
                {missed > 0 && ` ${missed} missed.`}
              </p>
              {hasClearWeakest && weakest && (
                <p className="text-sm text-foreground">
                  {weakest.routineName} was the hardest to keep up.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Progress detail */}
        {progressEntries.length > 0 && (
          <section>
            <SectionHeader title="Progress" />
            <div className="flex flex-col gap-2">
              {progressEntries.slice(0, 3).map((entry) => (
                <div
                  key={`${entry.activityId}-${entry.metric}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{entry.activityName}</span>
                  <span className="text-muted-foreground">
                    {entry.firstValue} → {entry.latestValue}{' '}
                    {metricUnit(entry.metric)}
                    {entry.deltaPercent !== 0 && (
                      <span
                        className={
                          entry.deltaPercent > 0
                            ? 'text-success ml-1'
                            : 'text-destructive ml-1'
                        }
                      >
                        {entry.deltaPercent > 0 ? '+' : ''}
                        {entry.deltaPercent}%
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* d. Momentum — labelled period for context */}
        {summary.recentPlanned > 0 && (
          <section>
            <SectionHeader title="Momentum (last 6 weeks)" />
            <p
              data-testid="review-momentum"
              className="text-sm text-foreground"
            >
              {summary.recentCompleted} of {summary.recentPlanned}{' '}
              planned sessions completed.
            </p>
          </section>
        )}

        {/* e. This week */}
        {primaryRoutine && (
          <section>
            <SectionHeader title="This week" />
            {consistency < 50 && activeDays > 7 && (
              <p
                data-testid="reduce-suggestion"
                className="text-sm text-muted-foreground mb-3"
              >
                Your current target may be too ambitious. A lower frequency can
                help you build consistency.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button
                data-testid="keep-routine-button"
                onClick={() => navigate('dashboard')}
                className="w-full"
              >
                Keep my plan
              </Button>
              <Button
                data-testid="edit-routine-button"
                variant="outline"
                onClick={() => onEditRoutine(primaryRoutine.id)}
                className="w-full"
              >
                Adjust my plan
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
