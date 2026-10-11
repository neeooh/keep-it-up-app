/**
 * PlanScreen — the user's routine management hub.
 *
 * Shows summary stats, a weekly schedule grid, and a list of all routines.
 * Each routine card taps into the Edit Routine screen.
 *
 * Answers: "What am I committed to, and how is it going at a glance?"
 */

import { Plus } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Progress as ProgressBar } from '../components/ui/progress'
import { PageHeader } from '../components/PageHeader'
import { SectionHeader } from '../components/SectionHeader'
import { EmptyState } from '../components/EmptyState'
import { ActivityIcon } from '../components/ActivityIcon'
import { useAppStore } from '../store/useAppStore'
import type { Navigate } from '../App'
import type { Frequency, Routine, DayOfWeek } from '../domain/types'

interface Props {
  navigate: Navigate
  onEditRoutine: (routineId: string) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS: { dow: DayOfWeek; short: string }[] = [
  { dow: 1, short: 'Mon' },
  { dow: 2, short: 'Tue' },
  { dow: 3, short: 'Wed' },
  { dow: 4, short: 'Thu' },
  { dow: 5, short: 'Fri' },
  { dow: 6, short: 'Sat' },
  { dow: 7, short: 'Sun' },
]

function sessionsPerWeek(frequency: Frequency): number {
  switch (frequency) {
    case 'daily': return 7
    case '3x_week': return 3
    case '2x_week': return 2
    case '1x_week': return 1
    case 'flexible': return 0
  }
}

function frequencyLabel(frequency: Frequency): string {
  switch (frequency) {
    case 'daily': return 'Every day'
    case '3x_week': return '3× per week'
    case '2x_week': return '2× per week'
    case '1x_week': return 'Once a week'
    case 'flexible': return 'Flexible'
  }
}

function formatDays(days: DayOfWeek[]): string {
  const map: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' }
  return days.map((d) => map[d]).join(', ')
}

/** Is the routine scheduled for a specific day? */
function isScheduledOn(routine: Routine, dow: DayOfWeek): boolean {
  const activity = routine.activities[0]
  if (!activity) return false
  if (activity.frequency === 'daily') return true
  if (activity.scheduledDays && activity.scheduledDays.length > 0) {
    return activity.scheduledDays.includes(dow)
  }
  return false
}

/** Does the routine have any assigned days (daily counts as assigned)? */
function hasAssignedDays(routine: Routine): boolean {
  const activity = routine.activities[0]
  if (!activity) return false
  if (activity.frequency === 'daily') return true
  return !!(activity.scheduledDays && activity.scheduledDays.length > 0)
}

/** Challenge progress for a routine, if it has an active challenge. */
function challengeProgress(routine: Routine): { elapsed: number; total: number } | null {
  if (!routine.challengeDurationDays || !routine.challengeStartDate) return null
  const start = new Date(routine.challengeStartDate + 'T00:00:00Z')
  const now = new Date()
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const diffMs = todayUTC.getTime() - start.getTime()
  const elapsed = Math.max(0, Math.min(routine.challengeDurationDays, Math.floor(diffMs / 86_400_000)))
  return { elapsed, total: routine.challengeDurationDays }
}

// ── Component ────────────────────────────────────────────────────────────────

export function PlanScreen({ navigate, onEditRoutine }: Props) {
  const { state } = useAppStore()
  const { routines } = state

  if (routines.length === 0) {
    return (
      <div data-testid="screen-plan" className="flex flex-col min-h-full">
        <PageHeader title="Plan" />
        <div data-testid="plan-empty" className="flex flex-1 flex-col">
          <EmptyState
            icon={<Plus size={32} aria-hidden="true" />}
            title="No routines yet"
            description="Create your first routine to build your plan."
            actionLabel="Create a routine"
            onAction={() => navigate('welcome')}
          />
        </div>
      </div>
    )
  }

  // Summary stats
  const totalRoutines = routines.length
  const totalWeeklySessions = routines.reduce((sum, r) => {
    const freq = r.activities[0]?.frequency ?? 'flexible'
    return sum + sessionsPerWeek(freq)
  }, 0)

  // Day totals for the grid (only count routines with assigned days)
  const dayTotals = DAY_LABELS.map(({ dow }) =>
    routines.filter((r) => hasAssignedDays(r) && isScheduledOn(r, dow)).length
  )

  return (
    <div data-testid="screen-plan" className="flex flex-col min-h-full">
      <PageHeader
        title="Plan"
        rightAction={
          <Button
            variant="ghost"
            size="icon"
            data-testid="plan-add-routine-button"
            aria-label="Add routine"
            onClick={() => navigate('welcome')}
          >
            <Plus size={20} aria-hidden="true" />
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-6">
        {/* Summary stats */}
        <div data-testid="plan-summary" className="flex items-center gap-4">
          <span className="text-base font-medium text-foreground">
            {totalRoutines} {totalRoutines === 1 ? 'routine' : 'routines'}
          </span>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-base font-medium text-foreground">
            {totalWeeklySessions} sessions/week
          </span>
        </div>

        {/* Weekly schedule grid */}
        <div>
          <SectionHeader title="Weekly schedule" />
          <div data-testid="weekly-grid" className="overflow-x-auto">
            <table className="w-full text-sm" role="grid" aria-label="Weekly schedule">
              <thead>
                <tr>
                  <th className="text-left font-medium text-muted-foreground pr-2 py-1 min-w-[6rem]" scope="col">
                    <span className="sr-only">Routine</span>
                  </th>
                  {DAY_LABELS.map(({ dow, short }) => (
                    <th
                      key={dow}
                      scope="col"
                      className="text-center font-medium text-muted-foreground px-1 py-1 w-[2.5rem]"
                    >
                      {short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routines.map((routine) => {
                  const assigned = hasAssignedDays(routine)
                  return (
                    <tr key={routine.id} data-testid={`grid-row-${routine.id}`}>
                      <td className="text-left text-foreground truncate pr-2 py-1.5 max-w-[6rem]">
                        {routine.name}
                      </td>
                      {assigned ? (
                        DAY_LABELS.map(({ dow }) => (
                          <td key={dow} className="text-center py-1.5">
                            {isScheduledOn(routine, dow) ? (
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand" aria-label="scheduled" />
                            ) : (
                              <span className="inline-block w-2.5 h-2.5" aria-hidden="true" />
                            )}
                          </td>
                        ))
                      ) : (
                        <td
                          colSpan={7}
                          className="text-center text-muted-foreground text-xs py-1.5"
                        >
                          any day
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td className="text-left text-muted-foreground text-xs pr-2 py-1.5">Total</td>
                  {dayTotals.map((count, i) => (
                    <td key={i} className="text-center text-muted-foreground text-xs py-1.5">
                      {count}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Routine list */}
        <div>
          <SectionHeader title="Routines" />
          <div className="flex flex-col gap-3">
            {routines.map((routine) => {
              const activity = routine.activities[0]
              const freq = activity ? frequencyLabel(activity.frequency) : 'Flexible'
              const days = activity?.scheduledDays && activity.scheduledDays.length > 0
                ? formatDays(activity.scheduledDays)
                : null
              const time = activity?.preferredTime ?? null
              const challenge = challengeProgress(routine)
              const hasMultipleActivities = routine.activities.length > 1

              return (
                <button
                  key={routine.id}
                  type="button"
                  data-testid={`plan-routine-${routine.id}`}
                  onClick={() => onEditRoutine(routine.id)}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left ring-1 ring-foreground/5 hover:bg-surface-muted transition-colors w-full"
                >
                  <ActivityIcon name={routine.name} size={32} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{routine.name}</p>
                    {hasMultipleActivities && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {routine.activities.map((a) => a.name).join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {[freq, days, time].filter(Boolean).join(' · ')}
                    </p>
                    {challenge && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          {routine.challengeDurationDays}-day challenge · Day {challenge.elapsed} of {challenge.total}
                        </p>
                        <ProgressBar
                          value={(challenge.elapsed / challenge.total) * 100}
                          className="h-1.5"
                        />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Add routine */}
        <Button
          data-testid="plan-add-routine-bottom"
          variant="outline"
          onClick={() => navigate('welcome')}
          className="w-full"
        >
          <Plus size={16} className="mr-2" aria-hidden="true" />
          Add routine
        </Button>
      </div>
    </div>
  )
}
