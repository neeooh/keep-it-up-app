/**
 * ConfigureActivityScreen — onboarding screen 3.
 *
 * Adapts its measurement fields to the selected template:
 * - Running:   distance + duration
 * - Strength:  multi-exercise builder (sets × reps × weight per exercise)
 * - Duration-only (reading, meditation, walking…): duration
 * - AVOID:     minimal — just confirm the habit name
 * - Custom:    all measurement fields
 *
 * Spec reference: mvp_product_spec.md section 8.
 */

import { useState } from 'react'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import type { Navigate } from '../../App'
import type { Direction, MeasurementConfig, MeasurementType } from '../../domain/types'
import { findTemplate } from '../../domain/templates'

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
  templateId: string | null
  direction: Direction | null
  /** Called before navigating to the next screen so App can persist the values. */
  onActivityChange?: (name: string, measurements: MeasurementConfig[]) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Human-readable label for a measurement type. */
function measurementLabel(type: MeasurementType): string {
  switch (type) {
    case 'duration': return 'Duration'
    case 'distance': return 'Distance'
    case 'quantity': return 'Quantity'
    case 'sets':     return 'Sets'
    case 'reps':     return 'Reps'
    case 'weight':   return 'Weight'
  }
}

/** Default unit label for a measurement type (when the template provides none). */
function defaultUnit(type: MeasurementType): string {
  switch (type) {
    case 'duration': return 'min'
    case 'distance': return 'km'
    case 'quantity': return 'units'
    case 'sets':     return ''
    case 'reps':     return ''
    case 'weight':   return 'kg'
  }
}

/** Returns true for templates whose measurements include sets/reps/weight. */
function isStrengthTemplate(templateId: string | null): boolean {
  if (!templateId) return false
  const template = findTemplate(templateId)
  if (!template) return false
  return template.defaultMeasurements.some((m) => m.type === 'sets')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MeasurementFieldProps {
  config: MeasurementConfig
  value: string
  onChange: (value: string) => void
}

function MeasurementField({ config, value, onChange }: MeasurementFieldProps) {
  const unit = config.unit ?? defaultUnit(config.type)
  const id = `measurement-${config.type}`

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{measurementLabel(config.type)}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          data-testid={`field-${config.type}`}
          type="number"
          inputMode="decimal"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.target?.toString() ?? ''}
          className="w-28"
        />
        {unit && (
          <span className="text-sm text-muted-foreground">{unit}</span>
        )}
      </div>
    </div>
  )
}

// ─── Exercise row for strength builder ────────────────────────────────────────

interface ExerciseRow {
  id: string
  name: string
  sets: string
  reps: string
}

interface ExerciseRowProps {
  row: ExerciseRow
  index: number
  onChange: (updated: ExerciseRow) => void
  onRemove: () => void
  canRemove: boolean
}

function ExerciseRowField({ row, index, onChange, onRemove, canRemove }: ExerciseRowProps) {
  return (
    <div
      data-testid={`exercise-row-${index}`}
      className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <Input
          data-testid={`exercise-name-${index}`}
          placeholder="Exercise name"
          value={row.name}
          onChange={(e) => onChange({ ...row, name: e.target.value })}
          className="flex-1"
        />
        {canRemove && (
          <button
            type="button"
            aria-label={`Remove exercise ${index + 1}`}
            onClick={onRemove}
            className="rounded-md p-1.5 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <Label htmlFor={`sets-${index}`} className="text-xs">Sets</Label>
          <Input
            id={`sets-${index}`}
            data-testid={`exercise-sets-${index}`}
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="3"
            value={row.sets}
            onChange={(e) => onChange({ ...row, sets: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <Label htmlFor={`reps-${index}`} className="text-xs">Reps</Label>
          <Input
            id={`reps-${index}`}
            data-testid={`exercise-reps-${index}`}
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="10"
            value={row.reps}
            onChange={(e) => onChange({ ...row, reps: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ConfigureActivityScreen({ navigate, templateId, direction, onActivityChange }: Props) {
  const template = templateId ? findTemplate(templateId) : null
  const resolvedDirection = direction ?? template?.direction ?? 'DO'

  // Activity name
  const [activityName, setActivityName] = useState(template?.defaultName ?? '')

  // Scalar measurement values (non-strength templates)
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>(
    () => {
      const init: Record<string, string> = {}
      for (const m of template?.defaultMeasurements ?? []) {
        init[m.type] = m.target?.toString() ?? ''
      }
      return init
    },
  )

  // Strength exercise rows
  const [exercises, setExercises] = useState<ExerciseRow[]>([
    { id: crypto.randomUUID(), name: '', sets: '3', reps: '10' },
  ])

  // All measurement types (for custom template)
  const allMeasurementTypes: MeasurementType[] = [
    'duration', 'distance', 'quantity', 'sets', 'reps', 'weight',
  ]

  const isStrength = isStrengthTemplate(templateId)
  const isAvoid = resolvedDirection === 'AVOID'
  const isCustom = !template || template.isCustom

  // Which measurements to show (non-strength, non-custom, non-avoid)
  const visibleMeasurements: MeasurementConfig[] = isCustom
    ? allMeasurementTypes.map((type) => ({ type }))
    : (template?.defaultMeasurements ?? []).filter((m) => m.type !== 'sets' && m.type !== 'reps' && m.type !== 'weight')

  function handleContinue() {
    // Collect the current measurement values as MeasurementConfig[]
    const collectedMeasurements: MeasurementConfig[] = visibleMeasurements.map((m) => ({
      ...m,
      target: measurementValues[m.type]
        ? Number(measurementValues[m.type])
        : m.target,
    }))
    onActivityChange?.(activityName, collectedMeasurements)
    navigate('set-frequency')
  }

  function addExercise() {
    setExercises((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', sets: '3', reps: '10' },
    ])
  }

  function updateExercise(index: number, updated: ExerciseRow) {
    setExercises((prev) => prev.map((e, i) => (i === index ? updated : e)))
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  /** Heading text per spec section 8 */
  function heading(): string {
    if (isStrength) return 'What does your workout include?'
    if (isAvoid) return `About "${activityName || template?.defaultName || 'your habit'}"`
    if (template) return `How do you want to measure ${template.defaultName.toLowerCase()}?`
    return 'How do you want to measure it?'
  }

  return (
    <div data-testid="screen-configure-activity" className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-6">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate('choose-direction')}
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {heading()}
        </h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-6">

        {/* Activity name — always shown */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activity-name">Activity name</Label>
          <Input
            id="activity-name"
            data-testid="field-activity-name"
            placeholder="e.g. Morning run"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
          />
        </div>

        {/* AVOID: just the name is enough */}
        {isAvoid && (
          <p className="text-sm text-muted-foreground">
            Record whether you stayed on track each day.
          </p>
        )}

        {/* Strength workout builder */}
        {isStrength && !isAvoid && (
          <div className="flex flex-col gap-3">
            {exercises.map((row, index) => (
              <ExerciseRowField
                key={row.id}
                row={row}
                index={index}
                onChange={(updated) => updateExercise(index, updated)}
                onRemove={() => removeExercise(index)}
                canRemove={exercises.length > 1}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              data-testid="add-exercise"
              onClick={addExercise}
              className="w-full"
            >
              <Plus size={16} className="mr-2" aria-hidden="true" />
              Add exercise
            </Button>
          </div>
        )}

        {/* Scalar measurement fields (non-strength) */}
        {!isStrength && !isAvoid && visibleMeasurements.map((m) => (
          <MeasurementField
            key={m.type}
            config={m}
            value={measurementValues[m.type] ?? ''}
            onChange={(v) =>
              setMeasurementValues((prev) => ({ ...prev, [m.type]: v }))
            }
          />
        ))}
      </div>

      {/* Continue */}
      <div className="px-4 py-4 border-t border-border">
        <Button
          type="button"
          data-testid="continue-button"
          onClick={handleContinue}
          className="w-full"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
