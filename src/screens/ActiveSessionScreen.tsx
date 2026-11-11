/**
 * ActiveSessionScreen — session recording.
 *
 * Adapts to the commitment's activity types:
 * - Strength (sets/reps/weight): set-by-set entry with pre-fill from last session
 * - Metric (distance, duration, quantity): simple number inputs
 * - AVOID: "Did you stay on track today?" binary with supportive feedback
 *
 * Spec reference: mvp_product_spec.md section 14.
 */

import { useState, useMemo } from 'react'
import { Plus, Trash2, Check, X, PartyPopper } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { PageHeader } from '../components/PageHeader'
import { ActivityIcon } from '../components/ActivityIcon'
import { useAppStore } from '../store/useAppStore'
import { sessionsForCommitment } from '../domain/calculations'
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
  commitmentId: string | null
  /** Optional ISO date (YYYY-MM-DD) to log for. Defaults to today. */
  sessionDate?: string
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
  const targetSets = activity.measurements.find((m) => m.type === 'sets')?.target ?? 3
  const targetReps = activity.measurements.find((m) => m.type === 'reps')?.target
  const targetWeight = activity.measurements.find((m) => m.type === 'weight')?.target
  return Array.from({ length: targetSets }, () => ({
    id: crypto.randomUUID(),
    weight: targetWeight ? targetWeight.toString() : '',
    reps: targetReps ? targetReps.toString() : '',
  }))
}

function prefillMeasurements(
  activity: Activity,
  lastResult: ActivityResult | undefined,
): Record<string, string> {
  const measurements: Record<string, string> = {}
  for (const m of activity.measurements) {
    if (m.type === 'sets' || m.type === 'reps' || m.type === 'weight') continue
    const lastValue = lastResult?.measurements[m.type]
    if (lastValue !== undefined) {
      measurements[m.type] = lastValue.toString()
    } else if (m.target !== undefined) {
      measurements[m.type] = m.target.toString()
    }
  }
  return measurements
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
  const metricTypes = activity.measurements
    .filter((m) => m.type !== 'sets' && m.type !== 'reps' && m.type !== 'weight')
    .map((m) => m.type)
  return metricTypes.some((t) => (state.measurements[t] ?? '').trim() !== '')
}

// ─── Strength input ───────────────────────────────────────────────────────────

function StrengthInput({
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
          className="flex items-center gap-3"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-sm font-semibold text-foreground">
            {index + 1}
          </span>
          <Input
            data-testid={`set-weight-${index}`}
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="kg"
            aria-label={`Set ${index + 1} weight`}
            value={set.weight}
            onChange={(e) => updateSet(index, 'weight', e.target.value)}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">×</span>
          <Input
            data-testid={`set-reps-${index}`}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="reps"
            aria-label={`Set ${index + 1} reps`}
            value={set.reps}
            onChange={(e) => updateSet(index, 'reps', e.target.value)}
            className="w-24"
          />
          {state.sets.length > 1 && (
            <button
              type="button"
              aria-label={`Remove set ${index + 1}`}
              onClick={() => removeSet(index)}
              className="ml-auto flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-surface-muted transition-colors"
            >
              <Trash2 size={16} aria-hidden="true" />
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
        className="self-start"
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
                min={0}
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
                className="w-32"
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
  const choice = state.stayedOnTrack

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-lg font-semibold text-foreground">
        Did you stay on track today?
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          data-testid="avoid-yes"
          aria-pressed={choice === true}
          onClick={() => onChange({ ...state, stayedOnTrack: true })}
          className={[
            'flex flex-1 min-h-[60px] items-center justify-center gap-2 rounded-xl px-4 py-4 text-base font-semibold transition-colors',
            choice === true
              ? 'bg-brand text-brand-foreground'
              : 'bg-brand/10 text-brand hover:bg-brand/20',
          ].join(' ')}
        >
          <Check size={22} aria-hidden="true" />
          Yes, I did
        </button>
        <button
          type="button"
          data-testid="avoid-no"
          aria-pressed={choice === false}
          onClick={() => onChange({ ...state, stayedOnTrack: false })}
          className={[
            'flex flex-1 min-h-[60px] items-center justify-center gap-2 rounded-xl px-4 py-4 text-base font-semibold transition-colors',
            choice === false
              ? 'bg-muted text-foreground ring-1 ring-border'
              : 'bg-surface-muted text-muted-foreground hover:bg-muted',
          ].join(' ')}
        >
          <X size={22} aria-hidden="true" />
          No
        </button>
      </div>

      {choice === true && (
        <p
          data-testid="avoid-feedback-yes"
          className="text-center text-sm font-medium text-success"
        >
          Great work! One more day on track.
        </p>
      )}
      {choice === false && (
        <p
          data-testid="avoid-feedback-no"
          className="text-center text-sm text-muted-foreground"
        >
          Tomorrow is a new day. What matters is that you keep going.
        </p>
      )}
    </div>
  )
}

// ─── Session progress indicator ───────────────────────────────────────────────

function SessionProgress({
  activities,
  activityStates,
}: {
  activities: Activity[]
  activityStates: ActivityState[]
}) {
  if (activities.length <= 1) return null
  const completedCount = activities.filter((a, i) =>
    isActivityComplete(a, activityStates[i]!),
  ).length

  return (
    <div data-testid="session-progress" className="px-5 pb-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {completedCount} of {activities.length} done
      </p>
      <div className="flex gap-1.5" aria-hidden="true">
        {activities.map((activity, i) => {
          const done = isActivityComplete(activity, activityStates[i]!)
          return (
            <div
              key={activity.id}
              className={[
                'h-1.5 flex-1 rounded-full transition-colors',
                done ? 'bg-brand' : 'bg-border',
              ].join(' ')}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Date selector helpers ────────────────────────────────────────────────────

function lastSevenDays(): { label: string; value: string }[] {
  const days: { label: string; value: string }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const value = d.toISOString().slice(0, 10)
    let label: string
    if (i === 0) label = 'Today'
    else if (i === 1) label = 'Yesterday'
    else label = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    days.push({ label, value })
  }
  return days
}

// ─── Success overlay ──────────────────────────────────────────────────────────

function SuccessOverlay({ motivation }: { motivation?: string }) {
  return (
    <div
      data-testid="success-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 animate-in fade-in duration-200"
    >
      <div className="flex flex-col items-center gap-3 animate-in zoom-in-50 duration-300">
        <div className="flex items-center justify-center size-16 rounded-full bg-success/10">
          <PartyPopper size={32} className="text-success" aria-hidden="true" />
        </div>
        <p className="text-xl font-semibold text-foreground">Session logged!</p>
        {motivation && (
          <p className="text-sm text-muted-foreground italic text-center max-w-xs mt-1">
            "{motivation}"
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ActiveSessionScreen({ navigate, commitmentId, sessionDate }: Props) {
  const { state, addSession } = useAppStore()
  const [selectedDate, setSelectedDate] = useState(sessionDate ?? new Date().toISOString().slice(0, 10))
  const [showSuccess, setShowSuccess] = useState(false)
  const dateOptions = useMemo(() => lastSevenDays(), [])

  const commitment = commitmentId
    ? state.commitments.find((r) => r.id === commitmentId)
    : null

  // Pre-fill from last session
  const lastSessionResults = useMemo(() => {
    if (!commitment) return new Map<string, ActivityResult>()
    const prev = sessionsForCommitment(state.sessions, commitment.id)
    if (prev.length === 0) return new Map<string, ActivityResult>()
    const last = prev[prev.length - 1]!
    const map = new Map<string, ActivityResult>()
    for (const r of last.results) {
      map.set(r.activityId, r)
    }
    return map
  }, [commitment, state.sessions])

  // Detect whether pre-fill is active (strength activities with previous data)
  const lastSessionDate = useMemo(() => {
    if (!commitment) return null
    const prev = sessionsForCommitment(state.sessions, commitment.id)
    if (prev.length === 0) return null
    const last = prev[prev.length - 1]!
    const hasStrength = commitment.activities.some(isStrengthActivity)
    if (!hasStrength) return null
    return new Date(last.completedAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })
  }, [commitment, state.sessions])

  const [activityStates, setActivityStates] = useState<ActivityState[]>(() => {
    if (!commitment) return []
    return commitment.activities.map((activity) => {
      const lastResult = lastSessionResults.get(activity.id)
      return {
        activityId: activity.id,
        measurements: prefillMeasurements(activity, lastResult),
        sets: isStrengthActivity(activity)
          ? prefillSets(activity, lastResult)
          : [],
        stayedOnTrack: null,
      }
    })
  })

  // Error state: commitment not found
  if (!commitment) {
    return (
      <div
        data-testid="screen-active-session"
        className="flex flex-col items-center justify-center min-h-full p-6 text-center"
      >
        <h1 className="text-xl font-semibold text-foreground">
          Commitment not found
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          This commitment may have been deleted.
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

  const allComplete = commitment.activities.every((activity, index) =>
    isActivityComplete(activity, activityStates[index]!),
  )

  function handleComplete() {
    if (!allComplete || !commitment) return

    const results: ActivityResult[] = commitment.activities.map(
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
      },
    )

    addSession({
      id: crypto.randomUUID(),
      commitmentId: commitment.id,
      completedAt: selectedDate === new Date().toISOString().slice(0, 10)
        ? new Date().toISOString()
        : `${selectedDate}T12:00:00.000Z`,
      results,
    })

    // Show success overlay briefly, then navigate
    setShowSuccess(true)
    setTimeout(() => navigate('dashboard'), 1200)
  }

  // Pre-fill hint
  const hasPrefill = !!lastSessionDate

  return (
    <div data-testid="screen-active-session" className="flex flex-col min-h-full">
      {showSuccess && <SuccessOverlay motivation={commitment.motivation} />}

      {/* Header */}
      <PageHeader title={commitment.name} backAction={() => navigate('dashboard')} />

      {/* Date selector — compact inline */}
      <div data-testid="date-selector" className="px-5 pb-2">
        <select
          id="session-date"
          data-testid="session-date-select"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {dateOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Session progress indicator — fills as activities are completed */}
      <SessionProgress
        activities={commitment.activities}
        activityStates={activityStates}
      />

      {/* Pre-fill hint — inline, minimal */}
      {hasPrefill && (
        <div className="px-5 pb-2">
          <p className="text-xs text-muted-foreground">
            Pre-filled from {lastSessionDate}
          </p>
        </div>
      )}

      {/* Activity forms */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {commitment.activities.map((activity, index) => (
          <div
            key={activity.id}
            data-testid={`activity-card-${activity.id}`}
            className="border-b border-border/50 py-5 first:pt-2 last:border-0"
          >
            <div className="flex items-center gap-2 mb-1">
              <ActivityIcon name={activity.name} size={20} />
              <h2 className="text-base font-semibold text-foreground">
                {activity.name}
              </h2>
            </div>
            {activity.description && (
              <p className="text-xs text-muted-foreground italic mb-3">{activity.description}</p>
            )}
            {!activity.description && <div className="mb-3" />}

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
          </div>
        ))}
      </div>

      {/* Complete button */}
      <div className="px-5 py-4 border-t border-border">
        <Button
          type="button"
          data-testid="complete-session-button"
          onClick={handleComplete}
          disabled={!allComplete}
          className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
        >
          <Check size={16} className="mr-1.5" aria-hidden="true" />
          Done!
        </Button>
      </div>
    </div>
  )
}
