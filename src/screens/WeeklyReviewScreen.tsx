/**
 * WeeklyReviewScreen — reflective weekly review.
 *
 * Shows a completion summary, a positive insight, an optional struggle
 * note, a momentum stat, and two forward-looking actions (keep / adjust).
 * Schedule and frequency changes happen through the Edit Routine screen.
 *
 * Spec reference: mvp_product_spec.md section 17.
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

function startOfISOWeek(d: Date): string {
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() + diff)
  return monday.toISOString().slice(0, 10)
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

  const weekStart = startOfISOWeek(new Date())
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

  // A routine that hit 100% this week.
  const perfectRoutine = summary.entries.find(
    (e) => e.planned > 0 && e.completed >= e.planned,
  )

  // The weakest routine (for the struggle note) when it is clearly behind.
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
      <PageHeader title="Your week" />

      {sessions.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={32} aria-hidden="true" />}
          title="Your weekly review"
          description="Complete your first week of sessions and your review will appear here."
        />
      ) : (
      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-6">
        {/* a. Completion summary */}
        <section>
          <StatCard label="Consistency" value={`${consistency}%`} />
          <Progress
            value={consistency}
            data-testid="review-consistency-bar"
            className="mt-3 h-2"
          />
          {/* hidden accessible value kept for existing assertions */}
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

        {/* c. Where you struggled — only below 80% */}
        {consistency < 80 && planned > 0 && (
          <section>
            <SectionHeader title="Where you struggled" />
            <div className="flex flex-col gap-1.5">
              <p data-testid="review-struggled" className="text-sm text-foreground">
                You missed {missed} planned session{missed !== 1 ? 's' : ''} this week.
              </p>
              {hasClearWeakest && weakest && (
                <p className="text-sm text-foreground">
                  {weakest.routineName} was the hardest to keep up.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Progress detail (kept as a scannable list) */}
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

        {/* d. Momentum */}
        {summary.recentPlanned > 0 && (
          <section>
            <SectionHeader title="Momentum" />
            <p
              data-testid="review-momentum"
              className="text-sm text-foreground"
            >
              {summary.recentCompleted} of your last {summary.recentPlanned}{' '}
              planned sessions completed.
            </p>
          </section>
        )}

        {/* e. Next week */}
        {primaryRoutine && (
          <section>
            <SectionHeader title="Next week" />
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
      )}
    </div>
  )
}
