/**
 * PlanScreen — the user's commitment management hub.
 *
 * Shows summary stats, a weekly schedule grid, and a list of all commitments.
 * Each commitment card taps into the Edit Commitment screen.
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
import { ThemeToggle } from '../components/ThemeToggle'
import { useAppStore } from '../store/useAppStore'
import { usePreferences } from '../hooks/usePreferences'
import { paths } from '../domain/templates'
import type { Navigate } from '../App'
import type { Frequency, Commitment, DayOfWeek } from '../domain/types'

interface Props {
  navigate: Navigate
  onEditCommitment: (commitmentId: string) => void
  onViewPath?: (presetId: string) => void
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
    case 'flexible': return "I'll decide each day"
  }
}

function formatDays(days: DayOfWeek[]): string {
  const map: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' }
  return days.map((d) => map[d]).join(', ')
}

/** Is the commitment scheduled for a specific day? */
function isScheduledOn(commitment: Commitment, dow: DayOfWeek): boolean {
  const activity = commitment.activities[0]
  if (!activity) return false
  if (activity.frequency === 'daily') return true
  if (activity.scheduledDays && activity.scheduledDays.length > 0) {
    return activity.scheduledDays.includes(dow)
  }
  return false
}

/** Does the commitment have any assigned days (daily counts as assigned)? */
function hasAssignedDays(commitment: Commitment): boolean {
  const activity = commitment.activities[0]
  if (!activity) return false
  if (activity.frequency === 'daily') return true
  return !!(activity.scheduledDays && activity.scheduledDays.length > 0)
}

/** Challenge progress for a commitment, if it has an active challenge. */
function challengeProgress(commitment: Commitment): { elapsed: number; total: number } | null {
  if (!commitment.challengeDurationDays || !commitment.challengeStartDate) return null
  const start = new Date(commitment.challengeStartDate + 'T00:00:00Z')
  const now = new Date()
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const diffMs = todayUTC.getTime() - start.getTime()
  const elapsed = Math.max(0, Math.min(commitment.challengeDurationDays, Math.floor(diffMs / 86_400_000)))
  return { elapsed, total: commitment.challengeDurationDays }
}

// ── Component ────────────────────────────────────────────────────────────────

export function PlanScreen({ navigate, onEditCommitment, onViewPath }: Props) {
  const { state } = useAppStore()
  const { commitments } = state
  const { preferences } = usePreferences()

  if (commitments.length === 0) {
    return (
      <div data-testid="screen-plan" className="flex flex-col min-h-full">
        <PageHeader title="Plan" rightAction={<ThemeToggle />} />
        <div data-testid="plan-empty" className="flex flex-1 flex-col">
          <EmptyState
            icon={<Plus size={32} aria-hidden="true" />}
            title="No commitments yet"
            description="Create your first commitment to build your plan."
            actionLabel="Create a commitment"
            onAction={() => navigate('welcome')}
          />
        </div>
      </div>
    )
  }

  // Summary stats
  const totalCommitments = commitments.length
  const totalWeeklySessions = commitments.reduce((sum, r) => {
    const freq = r.activities[0]?.frequency ?? 'flexible'
    return sum + sessionsPerWeek(freq)
  }, 0)

  // Day totals for the grid (only count commitments with assigned days)
  const dayTotals = DAY_LABELS.map(({ dow }) =>
    commitments.filter((r) => hasAssignedDays(r) && isScheduledOn(r, dow)).length
  )

  return (
    <div data-testid="screen-plan" className="flex flex-col min-h-full">
      <PageHeader
        title="Plan"
        rightAction={
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              data-testid="plan-add-commitment-button"
              aria-label="Add commitment"
              onClick={() => navigate('welcome')}
            >
              <Plus size={20} aria-hidden="true" />
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-6">
        {/* Your Path */}
        {preferences.chosenPath && (() => {
          const preset = paths.find((p) => p.id === preferences.chosenPath)
          if (!preset) return null
          return (
            <div>
              <SectionHeader title="Your path" />
              <button
                type="button"
                data-testid="plan-path-card"
                onClick={() => onViewPath?.(preset.id)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 w-full text-left hover:bg-surface-muted active:scale-[0.98] transition-colors cursor-pointer"
              >
                <span className="text-2xl" aria-hidden="true">{preset.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{preset.name}</p>
                  <p className="text-xs text-muted-foreground">{preset.tagline}</p>
                </div>
              </button>
            </div>
          )
        })()}

        {/* Summary stats */}
        <div data-testid="plan-summary" className="flex items-center gap-4">
          <span className="text-base font-medium text-foreground">
            {totalCommitments} {totalCommitments === 1 ? 'commitment' : 'commitments'}
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
                    <span className="sr-only">Commitment</span>
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
                {commitments.map((commitment) => {
                  const assigned = hasAssignedDays(commitment)
                  return (
                    <tr key={commitment.id} data-testid={`grid-row-${commitment.id}`}>
                      <td className="text-left text-foreground truncate pr-2 py-1.5 max-w-[6rem]">
                        {commitment.name}
                      </td>
                      {assigned ? (
                        DAY_LABELS.map(({ dow }) => (
                          <td key={dow} className="text-center py-1.5">
                            {isScheduledOn(commitment, dow) ? (
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

        {/* Commitment list */}
        <div>
          <SectionHeader title="Routines" />
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
            {commitments.map((commitment) => {
              const activity = commitment.activities[0]
              const freq = activity ? frequencyLabel(activity.frequency) : "I'll decide each day"
              const days = activity?.scheduledDays && activity.scheduledDays.length > 0
                ? formatDays(activity.scheduledDays)
                : null
              const time = activity?.preferredTime ?? null
              const challenge = challengeProgress(commitment)
              const hasMultipleActivities = commitment.activities.length > 1

              return (
                <button
                  key={commitment.id}
                  type="button"
                  data-testid={`plan-commitment-${commitment.id}`}
                  onClick={() => onEditCommitment(commitment.id)}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left ring-1 ring-foreground/5 hover:bg-surface-muted transition-colors w-full"
                >
                  <ActivityIcon name={commitment.name} size={32} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{commitment.name}</p>
                    {hasMultipleActivities && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {commitment.activities.map((a) => a.name).join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {[freq, days, time].filter(Boolean).join(' · ')}
                    </p>
                    {challenge && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          {commitment.challengeDurationDays}-day challenge · Day {challenge.elapsed} of {challenge.total}
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

        {/* Add commitment */}
        <Button
          data-testid="plan-add-commitment-bottom"
          variant="outline"
          onClick={() => navigate('welcome')}
          className="w-full"
        >
          <Plus size={16} className="mr-2" aria-hidden="true" />
          Add commitment
        </Button>
      </div>
    </div>
  )
}
