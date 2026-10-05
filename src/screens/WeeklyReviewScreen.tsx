/**
 * WeeklyReviewScreen — weekly review and plan adjustment.
 *
 * Shows consistency, progress highlights, momentum stat, deterministic
 * reflection, and adjustment options (keep / reduce / change schedule / edit).
 *
 * Spec reference: mvp_product_spec.md section 17.
 */

import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { useAppStore } from '../store/useAppStore'
import {
  calculateWeeklySummary,
  calculateProgress,
} from '../domain/calculations'
import type { Navigate } from '../App'
import type {
  DayOfWeek,
  Frequency,
  MeasurementType,
  Routine,
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

// ─── Frequency helpers ────────────────────────────────────────────────────────

function frequencyLabel(f: Frequency): string {
  switch (f) {
    case 'daily': return 'Every day'
    case '3x_week': return '3× per week'
    case '2x_week': return '2× per week'
    case '1x_week': return 'Once a week'
    case 'flexible': return 'Flexible'
  }
}

function stepDownFrequency(f: Frequency): Frequency {
  switch (f) {
    case 'daily': return '3x_week'
    case '3x_week': return '2x_week'
    case '2x_week': return '1x_week'
    case '1x_week': return '1x_week'
    case 'flexible': return 'flexible'
  }
}

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

// ─── Reflection logic ─────────────────────────────────────────────────────────

function generateReflection(summary: WeeklySummary): string {
  if (summary.entries.length === 0) {
    return 'Start logging sessions to see your weekly review.'
  }

  const overallRate = summary.overallConsistency

  if (overallRate >= 80) {
    return 'You are doing well this week. Keep the momentum going.'
  }

  if (overallRate >= 50) {
    const missedEntries = summary.entries.filter(
      (e) => e.planned > 0 && e.completed < e.planned,
    )
    if (missedEntries.length > 0) {
      const names = missedEntries.map((e) => e.routineName).join(', ')
      return `Good effort this week. You missed some sessions for ${names}. Consider whether your schedule needs adjusting.`
    }
    return 'Solid progress this week. You completed most of your planned sessions.'
  }

  // Under 50%
  return 'You missed several planned sessions this week. A lower frequency target may be more realistic and help you build consistency.'
}

function shouldSuggestReduce(summary: WeeklySummary): boolean {
  return summary.overallConsistency < 50 && summary.entries.some((e) => e.planned > 0)
}

// ─── Schedule change inline ───────────────────────────────────────────────────

const DAY_OPTIONS: { value: DayOfWeek; short: string }[] = [
  { value: 1, short: 'Mon' },
  { value: 2, short: 'Tue' },
  { value: 3, short: 'Wed' },
  { value: 4, short: 'Thu' },
  { value: 5, short: 'Fri' },
  { value: 6, short: 'Sat' },
  { value: 7, short: 'Sun' },
]

function ScheduleEditor({
  routine,
  onSave,
  onCancel,
}: {
  routine: Routine
  onSave: (days: DayOfWeek[]) => void
  onCancel: () => void
}) {
  const currentDays = routine.activities[0]?.scheduledDays ?? []
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(currentDays)

  function toggleDay(day: DayOfWeek) {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b),
    )
  }

  return (
    <div data-testid="schedule-editor" className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Pick your preferred days</p>
      <div className="flex gap-2 flex-wrap">
        {DAY_OPTIONS.map(({ value, short }) => {
          const isSelected = selectedDays.includes(value)
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              data-testid={`schedule-day-${value}`}
              onClick={() => toggleDay(value)}
              className={[
                'rounded-xl border px-3 py-2 text-sm font-medium transition-colors min-w-[3rem]',
                isSelected
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card text-foreground hover:bg-muted',
              ].join(' ')}
            >
              {short}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2">
        <Button
          data-testid="schedule-save"
          onClick={() => onSave(selectedDays)}
          size="sm"
        >
          Save schedule
        </Button>
        <Button
          data-testid="schedule-cancel"
          variant="ghost"
          onClick={onCancel}
          size="sm"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function WeeklyReviewScreen({ navigate, onEditRoutine }: Props) {
  const { state, updateRoutine } = useAppStore()
  const { routines, sessions } = state
  const [showScheduleFor, setShowScheduleFor] = useState<string | null>(null)
  const [reducedRoutineId, setReducedRoutineId] = useState<string | null>(null)

  const weekStart = startOfISOWeek(new Date())
  const summary = calculateWeeklySummary(sessions, routines, weekStart)

  // Progress highlights
  const progressEntries = routines.flatMap((r) =>
    r.activities.flatMap((a) => calculateProgress(sessions, a)),
  )

  // Single routine mode for adjust actions
  const primaryRoutine = routines[0]

  function handleReduceFrequency(routine: Routine) {
    const currentFreq = routine.activities[0]?.frequency ?? '3x_week'
    const newFreq = stepDownFrequency(currentFreq)
    if (newFreq === currentFreq) return

    const updated: Routine = {
      ...routine,
      activities: routine.activities.map((a) => ({
        ...a,
        frequency: newFreq,
      })),
    }
    updateRoutine(updated)
    setReducedRoutineId(routine.id)
  }

  function handleScheduleSave(routine: Routine, days: DayOfWeek[]) {
    const updated: Routine = {
      ...routine,
      activities: routine.activities.map((a) => ({
        ...a,
        scheduledDays: days.length > 0 ? days : undefined,
      })),
    }
    updateRoutine(updated)
    setShowScheduleFor(null)
  }

  return (
    <div data-testid="screen-weekly-review" className="flex flex-col min-h-full">
      <div className="px-4 pt-8 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Your week
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-5">
        {/* Consistency */}
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Consistency</p>
            {summary.entries.map((entry) => (
              <div key={entry.routineId} className="mt-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-foreground">{entry.routineName}</span>
                  <span className="text-muted-foreground">
                    {entry.completed} / {entry.planned}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-baseline gap-2 mt-3">
              <span
                data-testid="review-consistency"
                className="text-3xl font-bold text-foreground"
              >
                {summary.overallConsistency}%
              </span>
            </div>
            <Progress value={summary.overallConsistency} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* Progress highlights */}
        {progressEntries.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground mb-2">Progress</p>
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
                              ? 'text-green-600 ml-1'
                              : 'text-red-500 ml-1'
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
            </CardContent>
          </Card>
        )}

        {/* Momentum */}
        {summary.recentPlanned > 0 && (
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Momentum</p>
              <p
                data-testid="review-momentum"
                className="text-sm text-foreground mt-1"
              >
                {summary.recentCompleted} of your last {summary.recentPlanned}{' '}
                planned sessions completed.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Reflection */}
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Reflection</p>
            <p
              data-testid="review-reflection"
              className="text-sm text-foreground mt-1"
            >
              {generateReflection(summary)}
            </p>
            {shouldSuggestReduce(summary) && (
              <p
                data-testid="reduce-suggestion"
                className="text-xs text-muted-foreground mt-2 italic"
              >
                Consider reducing your frequency to build consistency first.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Adjust your plan */}
        {primaryRoutine && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              Adjust your plan
            </h2>
            <Card>
              <CardContent className="pt-4 flex flex-col gap-2">
                {/* Reduced confirmation */}
                {reducedRoutineId === primaryRoutine.id && (
                  <p
                    data-testid="reduced-confirmation"
                    className="text-xs text-green-600 mb-1"
                  >
                    Frequency reduced to{' '}
                    {frequencyLabel(primaryRoutine.activities[0]?.frequency ?? 'flexible')}
                  </p>
                )}

                {/* Schedule editor */}
                {showScheduleFor === primaryRoutine.id ? (
                  <ScheduleEditor
                    routine={primaryRoutine}
                    onSave={(days) => handleScheduleSave(primaryRoutine, days)}
                    onCancel={() => setShowScheduleFor(null)}
                  />
                ) : (
                  <>
                    <Button
                      data-testid="keep-routine-button"
                      variant="outline"
                      onClick={() => navigate('dashboard')}
                      className="w-full"
                    >
                      Keep routine
                    </Button>
                    <Button
                      data-testid="reduce-frequency-button"
                      variant="outline"
                      onClick={() => handleReduceFrequency(primaryRoutine)}
                      className="w-full"
                    >
                      Reduce frequency
                    </Button>
                    <Button
                      data-testid="change-schedule-button"
                      variant="outline"
                      onClick={() => setShowScheduleFor(primaryRoutine.id)}
                      className="w-full"
                    >
                      Change schedule
                    </Button>
                    <Button
                      data-testid="edit-routine-button"
                      variant="outline"
                      onClick={() => onEditRoutine(primaryRoutine.id)}
                      className="w-full"
                    >
                      Edit routine
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
