/**
 * EditSessionDialog — inline overlay for editing a logged session.
 *
 * Pre-fills form fields from the existing session data. The user can
 * adjust measurements, then save. Uses the same form patterns as
 * ActiveSessionScreen (strength sets, metric inputs, AVOID toggle).
 *
 * Opened from the History screen when the user taps Edit on an
 * expanded session entry.
 */

import { useState, useCallback } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import type {
  Activity,
  ActivityResult,
  MeasurementType,
  Routine,
  Session,
  SetResult,
} from '../domain/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session
  routine: Routine
  onSave: (updated: Session) => void
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

interface ActivityEditState {
  activityId: string
  measurements: Record<string, string>
  sets: SetEntry[]
  stayedOnTrack: boolean | null
}

// ─── Initialize state from existing session results ───────────────────────────

function initStateFromSession(
  routine: Routine,
  session: Session,
): ActivityEditState[] {
  return routine.activities.map((activity) => {
    const result = session.results.find((r) => r.activityId === activity.id)

    if (activity.direction === 'AVOID') {
      return {
        activityId: activity.id,
        measurements: {},
        sets: [],
        stayedOnTrack: result?.stayedOnTrack ?? null,
      }
    }

    if (isStrengthActivity(activity)) {
      const sets: SetEntry[] =
        result?.sets && result.sets.length > 0
          ? result.sets.map((s) => ({
              id: crypto.randomUUID(),
              weight: s.weight?.toString() ?? '',
              reps: s.reps?.toString() ?? '',
            }))
          : [{ id: crypto.randomUUID(), weight: '', reps: '' }]

      return {
        activityId: activity.id,
        measurements: {},
        sets,
        stayedOnTrack: null,
      }
    }

    // Metric activity
    const measurements: Record<string, string> = {}
    for (const m of activity.measurements) {
      if (m.type === 'sets' || m.type === 'reps' || m.type === 'weight') continue
      const val = result?.measurements[m.type]
      measurements[m.type] = val !== undefined ? val.toString() : ''
    }

    return {
      activityId: activity.id,
      measurements,
      sets: [],
      stayedOnTrack: null,
    }
  })
}

// ─── Build updated session from form state ────────────────────────────────────

function buildUpdatedSession(
  original: Session,
  routine: Routine,
  states: ActivityEditState[],
): Session {
  const results: ActivityResult[] = routine.activities.map((activity, index) => {
    const s = states[index]!

    if (activity.direction === 'AVOID') {
      return {
        activityId: activity.id,
        measurements: {},
        stayedOnTrack: s.stayedOnTrack ?? false,
      }
    }

    if (isStrengthActivity(activity)) {
      const sets: SetResult[] = s.sets
        .filter((set) => set.weight.trim() !== '' || set.reps.trim() !== '')
        .map((set) => ({
          weight: set.weight ? Math.max(0, Number(set.weight)) : undefined,
          reps: set.reps ? Math.max(0, Number(set.reps)) : undefined,
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
        measurements[key as MeasurementType] = Math.max(0, Number(val))
      }
    }
    return {
      activityId: activity.id,
      measurements,
    }
  })

  return { ...original, results }
}

// ─── Strength editor ──────────────────────────────────────────────────────────

function StrengthEditor({
  state,
  onChange,
}: {
  state: ActivityEditState
  onChange: (updated: ActivityEditState) => void
}) {
  function updateSet(index: number, field: 'weight' | 'reps', value: string) {
    const next = [...state.sets]
    next[index] = { ...next[index]!, [field]: value }
    onChange({ ...state, sets: next })
  }

  function addSet() {
    onChange({
      ...state,
      sets: [...state.sets, { id: crypto.randomUUID(), weight: '', reps: '' }],
    })
  }

  function removeSet(index: number) {
    onChange({ ...state, sets: state.sets.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex flex-col gap-2">
      {state.sets.map((set, index) => (
        <div key={set.id} className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-muted text-xs font-semibold text-foreground">
            {index + 1}
          </span>
          <Input
            data-testid={`edit-set-weight-${index}`}
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="kg"
            aria-label={`Set ${index + 1} weight`}
            value={set.weight}
            onChange={(e) => updateSet(index, 'weight', e.target.value)}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground">×</span>
          <Input
            data-testid={`edit-set-reps-${index}`}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="reps"
            aria-label={`Set ${index + 1} reps`}
            value={set.reps}
            onChange={(e) => updateSet(index, 'reps', e.target.value)}
            className="w-20"
          />
          {state.sets.length > 1 && (
            <button
              type="button"
              aria-label={`Remove set ${index + 1}`}
              onClick={() => removeSet(index)}
              className="ml-auto flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-surface-muted transition-colors"
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
        data-testid="edit-add-set-button"
        onClick={addSet}
        className="self-start"
      >
        <Plus size={14} className="mr-1" aria-hidden="true" />
        Add set
      </Button>
    </div>
  )
}

// ─── Metric editor ────────────────────────────────────────────────────────────

function MetricEditor({
  activity,
  state,
  onChange,
}: {
  activity: Activity
  state: ActivityEditState
  onChange: (updated: ActivityEditState) => void
}) {
  const fields = activity.measurements.filter(
    (m) => m.type !== 'sets' && m.type !== 'reps' && m.type !== 'weight',
  )

  return (
    <div className="flex flex-col gap-3">
      {fields.map((m) => {
        const unit = m.unit ?? metricUnit(m.type)
        return (
          <div key={m.type} className="flex flex-col gap-1">
            <Label htmlFor={`edit-metric-${state.activityId}-${m.type}`}>
              {metricLabel(m.type)}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id={`edit-metric-${state.activityId}-${m.type}`}
                data-testid={`edit-metric-${m.type}`}
                type="number"
                inputMode="decimal"
                min={0}
                value={state.measurements[m.type] ?? ''}
                onChange={(e) =>
                  onChange({
                    ...state,
                    measurements: { ...state.measurements, [m.type]: e.target.value },
                  })
                }
                className="w-28"
              />
              {unit && (
                <span className="text-sm text-muted-foreground">{unit}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── AVOID editor ─────────────────────────────────────────────────────────────

function AvoidEditor({
  state,
  onChange,
}: {
  state: ActivityEditState
  onChange: (updated: ActivityEditState) => void
}) {
  const choice = state.stayedOnTrack

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-foreground">Did you stay on track?</p>
      <div className="flex gap-2">
        <button
          type="button"
          data-testid="edit-avoid-yes"
          aria-pressed={choice === true}
          onClick={() => onChange({ ...state, stayedOnTrack: true })}
          className={[
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            choice === true
              ? 'bg-brand text-brand-foreground'
              : 'bg-brand/10 text-brand hover:bg-brand/20',
          ].join(' ')}
        >
          <Check size={16} aria-hidden="true" />
          Yes
        </button>
        <button
          type="button"
          data-testid="edit-avoid-no"
          aria-pressed={choice === false}
          onClick={() => onChange({ ...state, stayedOnTrack: false })}
          className={[
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            choice === false
              ? 'bg-muted text-foreground ring-1 ring-border'
              : 'bg-surface-muted text-muted-foreground hover:bg-muted',
          ].join(' ')}
        >
          <X size={16} aria-hidden="true" />
          No
        </button>
      </div>
    </div>
  )
}

// ─── Dialog component ─────────────────────────────────────────────────────────

export function EditSessionDialog({
  open,
  onOpenChange,
  session,
  routine,
  onSave,
}: Props) {
  const [states, setStates] = useState<ActivityEditState[]>(() =>
    initStateFromSession(routine, session),
  )

  // Re-initialize when a different session is opened.
  const [lastSessionId, setLastSessionId] = useState(session.id)
  if (session.id !== lastSessionId) {
    setStates(initStateFromSession(routine, session))
    setLastSessionId(session.id)
  }

  const updateActivity = useCallback((index: number, updated: ActivityEditState) => {
    setStates((prev) => prev.map((s, i) => (i === index ? updated : s)))
  }, [])

  function handleSave() {
    const updated = buildUpdatedSession(session, routine, states)
    onSave(updated)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="edit-session-dialog" className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit session</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {routine.activities.map((activity, index) => (
            <div key={activity.id} className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-foreground">{activity.name}</p>

              {activity.direction === 'AVOID' && (
                <AvoidEditor
                  state={states[index]!}
                  onChange={(updated) => updateActivity(index, updated)}
                />
              )}

              {activity.direction === 'DO' && isStrengthActivity(activity) && (
                <StrengthEditor
                  state={states[index]!}
                  onChange={(updated) => updateActivity(index, updated)}
                />
              )}

              {activity.direction === 'DO' && !isStrengthActivity(activity) && (
                <MetricEditor
                  activity={activity}
                  state={states[index]!}
                  onChange={(updated) => updateActivity(index, updated)}
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            data-testid="edit-session-save"
            onClick={handleSave}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
