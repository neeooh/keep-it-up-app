/**
 * DashboardScreen — the main home screen.
 *
 * Shows overall consistency %, this-week summary, "Your Plan for Today"
 * listing all routines with per-routine Log Session buttons and edit
 * icons, and progress deltas. Handles the empty state when no routines
 * exist.
 *
 * Spec reference: mvp_product_spec.md section 13.
 */

import { Plus, Play, TrendingUp, TrendingDown, Minus, Pencil } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { useAppStore } from '../store/useAppStore'
import {
  calculateConsistency,
  calculateCompletionRate,
  calculateProgress,
  sessionsForRoutine,
  calculateVolume,
} from '../domain/calculations'
import type { Navigate } from '../App'
import type { Routine, Session, MeasurementType } from '../domain/types'

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

function startOfISOWeek(d: Date): string {
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() + diff)
  return monday.toISOString().slice(0, 10)
}

function weeksAgo(weeks: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - weeks * 7)
  return d.toISOString().slice(0, 10)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
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

/** Find the most interesting metric highlight from the last session. */
function lastSessionHighlight(
  sessions: Session[],
  routine: Routine,
): { label: string; value: string } | null {
  const routineSessions = sessionsForRoutine(sessions, routine.id)
  if (routineSessions.length === 0) return null

  const last = routineSessions[routineSessions.length - 1]!

  // Try weight-based volume first
  for (const activity of routine.activities) {
    const hasWeight = activity.measurements.some((m) => m.type === 'weight')
    if (hasWeight) {
      const vol = calculateVolume(last, activity.id)
      if (vol > 0) {
        return { label: activity.name, value: `${vol} kg total` }
      }
    }
  }

  // Try any scalar measurement
  for (const result of last.results) {
    const activity = routine.activities.find((a) => a.id === result.activityId)
    for (const [type, value] of Object.entries(result.measurements)) {
      if (value !== undefined) {
        const unit = metricUnit(type as MeasurementType)
        return {
          label: activity?.name ?? 'Activity',
          value: `${value}${unit ? ` ${unit}` : ''}`,
        }
      }
    }

    // AVOID activity
    if (result.stayedOnTrack !== undefined) {
      return {
        label: activity?.name ?? 'Activity',
        value: result.stayedOnTrack ? 'On track' : 'Slipped',
      }
    }
  }

  return null
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ navigate }: { navigate: Navigate }) {
  return (
    <div
      data-testid="dashboard-empty"
      className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
    >
      <h2 className="text-xl font-semibold text-foreground">No routines yet</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        Create your first routine to start tracking your consistency.
      </p>
      <Button
        data-testid="create-routine-button"
        onClick={() => navigate('welcome')}
        className="mt-6"
      >
        <Plus size={16} className="mr-2" aria-hidden="true" />
        Create a routine
      </Button>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardScreen({ navigate, onStartSession, onEditRoutine }: Props) {
  const { state } = useAppStore()
  const { routines, sessions } = state

  if (routines.length === 0) {
    return (
      <div data-testid="screen-dashboard" className="flex flex-col min-h-full">
        <EmptyState navigate={navigate} />
      </div>
    )
  }

  const now = new Date()
  const weekStart = startOfISOWeek(now)
  const fourWeeksAgo = weeksAgo(4)
  const todayStr = today()

  // Overall consistency (4 weeks)
  const consistencies = routines.map((r) =>
    calculateConsistency(sessions, r, { start: fourWeeksAgo, end: todayStr }),
  )
  const overallConsistency =
    consistencies.length > 0
      ? Math.round(consistencies.reduce((a, b) => a + b, 0) / consistencies.length)
      : 0

  // Previous 4-week window for delta
  const eightWeeksAgo = weeksAgo(8)
  const prevConsistencies = routines.map((r) =>
    calculateConsistency(sessions, r, { start: eightWeeksAgo, end: fourWeeksAgo }),
  )
  const prevOverall =
    prevConsistencies.length > 0
      ? Math.round(prevConsistencies.reduce((a, b) => a + b, 0) / prevConsistencies.length)
      : 0
  const consistencyDelta = overallConsistency - prevOverall
  const hasPreviousData = sessions.some((s) => s.completedAt.slice(0, 10) < fourWeeksAgo)

  // This week per routine
  const weekEntries = routines.map((r) => ({
    routine: r,
    ...calculateCompletionRate(sessions, r, weekStart),
  }))

  // Per-routine details for "Your Plan for Today"
  const routineDetails = routines.map((r) => {
    const highlight = lastSessionHighlight(sessions, r)
    const rSessions = sessionsForRoutine(sessions, r.id)
    const lastDate =
      rSessions.length > 0
        ? formatDate(rSessions[rSessions.length - 1]!.completedAt)
        : null
    return { routine: r, highlight, lastSessionDate: lastDate }
  })

  // Progress deltas
  const progressEntries = routines.flatMap((r) =>
    r.activities.flatMap((a) => calculateProgress(sessions, a)),
  )

  return (
    <div data-testid="screen-dashboard" className="flex flex-col min-h-full">
      <div className="px-4 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {sessions.length === 0 ? 'Let\u2019s get started' : 'Your momentum'}
          </h1>
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
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-5">
        {/* Overall consistency */}
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Overall consistency</p>
            {sessions.length === 0 ? (
              <>
                <p
                  data-testid="day-one-message"
                  className="text-lg font-semibold text-foreground mt-2"
                >
                  Ready for your first session?
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your consistency score starts after your first workout.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    data-testid="overall-consistency"
                    className="text-4xl font-bold text-foreground"
                  >
                    {overallConsistency}%
                  </span>
                  {hasPreviousData && consistencyDelta !== 0 && (
                    <span
                      data-testid="consistency-delta"
                      className={`text-sm font-medium ${consistencyDelta > 0 ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {consistencyDelta > 0 ? '+' : ''}
                      {consistencyDelta}% vs last month
                    </span>
                  )}
                </div>
                <Progress value={overallConsistency} className="mt-3 h-2" />
              </>
            )}
          </CardContent>
        </Card>

        {/* This week */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">This week</h2>
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-2">
                {weekEntries.map(({ routine, completed, planned }) => (
                  <div
                    key={routine.id}
                    data-testid={`week-entry-${routine.id}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-foreground truncate mr-4">{routine.name}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {completed} / {planned}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your Plan for Today — all routines */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Your Plan for Today</h2>
          <div className="flex flex-col gap-3">
            {routineDetails.map(({ routine, highlight, lastSessionDate }) => (
              <Card key={routine.id} data-testid={`plan-card-${routine.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{routine.name}</p>
                    <button
                      type="button"
                      data-testid={`edit-routine-button-${routine.id}`}
                      aria-label={`Edit ${routine.name}`}
                      onClick={() => onEditRoutine(routine.id)}
                      className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                  </div>
                  {lastSessionDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last session: {lastSessionDate}
                    </p>
                  )}
                  {highlight && (
                    <p
                      data-testid={`session-highlight-${routine.id}`}
                      className="text-sm text-muted-foreground mt-1"
                    >
                      {highlight.label} · {highlight.value}
                    </p>
                  )}
                  <Button
                    data-testid={`log-session-button-${routine.id}`}
                    onClick={() => onStartSession(routine.id)}
                    className="w-full mt-4"
                  >
                    <Play size={16} className="mr-2" aria-hidden="true" />
                    Log session
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Progress deltas */}
        {progressEntries.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Progress</h2>
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col gap-3">
                  {progressEntries.map((entry) => {
                    const Icon =
                      entry.deltaPercent > 0
                        ? TrendingUp
                        : entry.deltaPercent < 0
                          ? TrendingDown
                          : Minus
                    const colorClass =
                      entry.deltaPercent > 0
                        ? 'text-green-600'
                        : entry.deltaPercent < 0
                          ? 'text-red-500'
                          : 'text-muted-foreground'
                    return (
                      <div
                        key={`${entry.activityId}-${entry.metric}`}
                        data-testid="progress-entry"
                        className="flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {entry.activityName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.firstValue} → {entry.latestValue}{' '}
                            {metricUnit(entry.metric)}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 ${colorClass}`}>
                          <Icon size={14} aria-hidden="true" />
                          <span className="text-sm font-medium">
                            {entry.deltaPercent > 0 ? '+' : ''}
                            {entry.deltaPercent}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
