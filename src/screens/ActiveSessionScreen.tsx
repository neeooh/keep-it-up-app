/**
 * ActiveSessionScreen — session recording.
 *
 * Adapts to the routine's activity types:
 * - Strength (sets/reps/weight): set-by-set entry with pre-fill from last session
 * - Metric (distance, duration, quantity): simple number inputs
 * - AVOID: "Did you stay on track?" binary
 *
 * Spec reference: mvp_product_spec.md section 14.
 */

import { useState, useMemo } from 'react'
import { ChevronLeft, Plus, Trash2, Check, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent } from '../components/ui/card'
import { useAppStore } from '../store/useAppStore'
import { sessionsForRoutine } from '../domain/calculations'
import type { Navigate } from '../App'
import type {
  Activity,
  ActivityResult,
  MeasurementType,
  SetResult,
} from '../domain/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
  routineId: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function metricLabel(type: MeasurementType): string {
  switch (type) {
    case 'duration': return 'Duration'
    case 'distance': return 'Distance'
    case 'quantity': return 'Quantity'
    case 'sets': return 'Sets'
    case 'reps': return 'Reps'
    case 'weight': return 'Weight'
  }
}

function metricUnit(type: MeasurementType): string {
  switch (type) {
    case 'duration': return 'min'
    case 'distance': return 'km'
    case 'quantity': return ''
    case 'sets': return ''
    case 'reps': return ''
    case 'weight': return 'kg'
  }
}

function isStrengthActivity(activity: Activity): boolean {
  return activity.measurements.some((m) => m.type === 'sets')
}

// ─── State types ──────────────────────────────────────────────────────────────

interface SetEntry {
  id: string
  weight: string
  reps: string
}

interface ActivityState {
  activityId: string
  measurements: Record<string, string>
  sets: SetEntry[]
  stayedOnTrack: boolean | null
}

// ─── Pre-fill from last session ───────────────────────────────────────────────

function prefillSets(
  activity: Activity,
  lastResult: ActivityResult | undefined,
): SetEntry[] {
  if (lastResult?.sets && lastResult.sets.length > 0) {
    return lastResult.sets.map((s) => ({
      id: crypto.randomUUID(),
      weight: s.weight?.toString() ?? '',
      reps: s.reps?.toString() ?? '',
    }))
  }
  // Default: 3 empty sets
  const targetSets = activity.measurements.find((m) => m.type === 'sets')?.target ?? 3
  return Array.from({ length: targetSets }, () => ({
    id: crypto.randomUUID(),
    weight: '',
    reps: '',
  }))
}

// ─── Validation ───────────────────────────────────────────────────────────────

function isActivityComplete(activity: Activity, state: ActivityState): boolean {
  if (activity.direction === 'AVOID') {
    return state.stayedOnTrack !== null
  }

  if (isStrengthActivity(activity)) {
    return state.sets.some(
      (s) => s.weight.trim() !== '' || s.reps.trim() !== '',
    )
  }

  // Metric: at least one measurement has a value
  const metricTypes = activity.measurements
    .filter((m) => m.type !== 'sets' && m.type !== 'reps' && m.type !== 'weight')
    .map((m) => m.type)
  return metricTypes.some((t) => (state.measurements[t] ?? '').trim() !== '')
}

// ─── Strength input ───────────────────────────────────────────────────────────

function StrengthInput({
  activity: _activity,
  state,
  onChange,
}: {
  activity: Activity
  state: ActivityState
  onChange: (updated: ActivityState) => void
}) {
  function updateSet(index: number, field: 'weight' | 'reps', value: string) {
    const next = [...state.sets]
    next[index] = { ...next[index]!, [field]: value }
    onChange({ ...state, sets: next })
  }

  function addSet() {
    onChange({
      ...state,
      sets: [
        ...state.sets,
        { id: crypto.randomUUID(), weight: '', reps: '' },
      ],
    })
  }

  function removeSet(index: number) {
    onChange({
      ...state,
      sets: state.sets.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {state.sets.map((set, index) => (
        <div
          key={set.id}
          data-testid={`set-row-${index}`}
          className="flex items-center gap-2"
        >
          <span className="text-xs text-muted-foreground w-12">
            Set {index + 1}
          </span>
          <Input
            data-testid={`set-weight-${index}`}
            type="number"
            inputMode="decimal"
            placeholder="kg"
            value={set.weight}
            onChange={(e) => updateSet(index, 'weight', e.target.value)}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground">×</span>
          <Input
            data-testid={`set-reps-${index}`}
            type="number"
            inputMode="numeric"
            placeholder="reps"
            value={set.reps}
            onChange={(e) => updateSet(index, 'reps', e.target.value)}
            className="w-20"
          />
          {state.sets.length > 1 && (
            <button
              type="button"
              aria-label={`Remove set ${index + 1}`}
              onClick={() => removeSet(index)}
              className="p-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="add-set-button"
        onClick={addSet}
      >
        <Plus size={14} className="mr-1" aria-hidden="true" />
        Add set
      </Button>
    </div>
  )
}

// ─── Metric input ─────────────────────────────────────────────────────────────

function MetricInput({
  activity,
  state,
  onChange,
}: {
  activity: Activity
  state: ActivityState
  onChange: (updated: ActivityState) => void
}) {
  const fields = activity.measurements.filter(
    (m) => m.type !== 'sets' && m.type !== 'reps' && m.type !== 'weight',
  )

  return (
    <div className="flex flex-col gap-3">
      {fields.map((m) => {
        const unit = m.unit ?? metricUnit(m.type)
        return (
          <div key={m.type} className="flex flex-col gap-1.5">
            <Label htmlFor={`metric-${state.activityId}-${m.type}`}>
              {metricLabel(m.type)}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id={`metric-${state.activityId}-${m.type}`}
                data-testid={`metric-${m.type}`}
                type="number"
                inputMode="decimal"
                placeholder={m.target?.toString() ?? ''}
                value={state.measurements[m.type] ?? ''}
                onChange={(e) =>
                  onChange({
                    ...state,
                    measurements: {
                      ...state.measurements,
                      [m.type]: e.target.value,
                    },
                  })
                }
                className="w-28"
              />
              {unit && (
                <span className="text-sm text-muted-foreground">{unit}</span>
              )}
            </div>
            {m.target != null && (
              <p className="text-xs text-muted-foreground">
                Target: {m.target} {unit}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── AVOID input ──────────────────────────────────────────────────────────────

function AvoidInput({
  state,
  onChange,
}: {
  state: ActivityState
  onChange: (updated: ActivityState) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground">Did you stay on track?</p>
      <div className="flex gap-3">
        <Button
          type="button"
          data-testid="avoid-yes"
          variant={state.stayedOnTrack === true ? 'default' : 'outline'}
          onClick={() => onChange({ ...state, stayedOnTrack: true })}
          className="flex-1"
        >
          <Check size={16} className="mr-2" aria-hidden="true" />
          Yes, I am on track
        </Button>
        <Button
          type="button"
          data-testid="avoid-no"
          variant={state.stayedOnTrack === false ? 'default' : 'outline'}
          onClick={() => onChange({ ...state, stayedOnTrack: false })}
          className="flex-1"
        >
          <X size={16} className="mr-2" aria-hidden="true" />
          No
        </Button>
      </div>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ActiveSessionScreen({ navigate, routineId }: Props) {
  const { state, addSession } = useAppStore()

  const routine = routineId
    ? state.routines.find((r) => r.id === routineId)
    : null

  // Pre-fill from last session
  const lastSessionResults = useMemo(() => {
    if (!routine) return new Map<string, ActivityResult>()
    const prev = sessionsForRoutine(state.sessions, routine.id)
    if (prev.length === 0) return new Map<string, ActivityResult>()
    const last = prev[prev.length - 1]!
    const map = new Map<string, ActivityResult>()
    for (const r of last.results) {
      map.set(r.activityId, r)
    }
    return map
  }, [routine, state.sessions])

  const [activityStates, setActivityStates] = useState<ActivityState[]>(() => {
    if (!routine) return []
    return routine.activities.map((activity) => {
      const lastResult = lastSessionResults.get(activity.id)
      return {
        activityId: activity.id,
        measurements: {},
        sets: isStrengthActivity(activity)
          ? prefillSets(activity, lastResult)
          : [],
        stayedOnTrack: null,
      }
    })
  })

  // Error state: routine not found
  if (!routine) {
    return (
      <div
        data-testid="screen-active-session"
        className="flex flex-col items-center justify-center min-h-full p-6 text-center"
      >
        <h1 className="text-xl font-semibold text-foreground">
          Routine not found
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          This routine may have been deleted.
        </p>
        <Button
          data-testid="back-to-dashboard"
          onClick={() => navigate('dashboard')}
          className="mt-4"
        >
          Back to dashboard
        </Button>
      </div>
    )
  }

  function updateActivity(index: number, updated: ActivityState) {
    setActivityStates((prev) =>
      prev.map((s, i) => (i === index ? updated : s)),
    )
  }

  const allComplete = routine.activities.every((activity, index) =>
    isActivityComplete(activity, activityStates[index]!),
  )

  function handleComplete() {
    if (!allComplete || !routine) return

    const results: ActivityResult[] = routine.activities.map(
      (activity, index) => {
        const s = activityStates[index]!

        if (activity.direction === 'AVOID') {
          return {
            activityId: activity.id,
            measurements: {},
            stayedOnTrack: s.stayedOnTrack!,
          }
        }

        if (isStrengthActivity(activity)) {
          const sets: SetResult[] = s.sets
            .filter((set) => set.weight.trim() !== '' || set.reps.trim() !== '')
            .map((set) => ({
              weight: set.weight ? Number(set.weight) : undefined,
              reps: set.reps ? Number(set.reps) : undefined,
            }))
          return {
            activityId: activity.id,
            measurements: {},
            sets,
          }
        }

        // Metric
        const measurements: Partial<Record<MeasurementType, number>> = {}
        for (const [key, val] of Object.entries(s.measurements)) {
          if (val && val.trim() !== '') {
            measurements[key as MeasurementType] = Number(val)
          }
        }
        return {
          activityId: activity.id,
          measurements,
        }
      },
    )

    addSession({
      id: crypto.randomUUID(),
      routineId: routine.id,
      completedAt: new Date().toISOString(),
      results,
    })

    navigate('dashboard')
  }

  return (
    <div data-testid="screen-active-session" className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-4">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate('dashboard')}
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {routine.name}
        </h1>
      </div>

      {/* Activity forms */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-4">
        {routine.activities.map((activity, index) => (
          <Card key={activity.id} data-testid={`activity-card-${activity.id}`}>
            <CardContent className="pt-4">
              <h2 className="text-base font-semibold text-foreground mb-3">
                {activity.name}
              </h2>

              {activity.direction === 'AVOID' && (
                <AvoidInput
                  state={activityStates[index]!}
                  onChange={(updated) => updateActivity(index, updated)}
                />
              )}

              {activity.direction === 'DO' && isStrengthActivity(activity) && (
                <StrengthInput
                  activity={activity}
                  state={activityStates[index]!}
                  onChange={(updated) => updateActivity(index, updated)}
                />
              )}

              {activity.direction === 'DO' && !isStrengthActivity(activity) && (
                <MetricInput
                  activity={activity}
                  state={activityStates[index]!}
                  onChange={(updated) => updateActivity(index, updated)}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Complete button */}
      <div className="px-4 py-4 border-t border-border">
        <Button
          type="button"
          data-testid="complete-session-button"
          onClick={handleComplete}
          disabled={!allComplete}
          className="w-full"
        >
          Complete
        </Button>
      </div>
    </div>
  )
}
