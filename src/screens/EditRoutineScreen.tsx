/**
 * EditRoutineScreen — edit an existing routine.
 *
 * Pre-populates all fields from the current routine and groups them into
 * clear sections: Routine, Schedule, and Challenge. The Schedule section
 * uses a unified day picker with preset shortcuts. Days are the source of
 * truth; frequency is derived from the day count.
 *
 * Spec reference: mvp_product_spec.md — reachable from weekly review
 * and dashboard.
 */

import { useState } from 'react'
import { Check, RotateCcw, Heart } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { PageHeader } from '../components/PageHeader'
import { SectionHeader } from '../components/SectionHeader'
import { useAppStore } from '../store/useAppStore'
import type { Navigate } from '../App'
import type { DayOfWeek, Frequency, Routine } from '../domain/types'
import { emotionalPlaceholder } from '../domain/templates'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
  routineId: string | null
}

// ─── Preset definitions ───────────────────────────────────────────────────────

interface Preset {
  label: string
  days: DayOfWeek[]
}

const PRESETS: Preset[] = [
  { label: 'Every day', days: [1, 2, 3, 4, 5, 6, 7] },
  { label: '3×/week', days: [1, 3, 5] },
  { label: '2×/week', days: [2, 4] },
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Weekend', days: [6, 7] },
]

const DAY_BUTTONS: { value: DayOfWeek; letter: string }[] = [
  { value: 1, letter: 'Mon' },
  { value: 2, letter: 'Tue' },
  { value: 3, letter: 'Wed' },
  { value: 4, letter: 'Thu' },
  { value: 5, letter: 'Fri' },
  { value: 6, letter: 'Sat' },
  { value: 7, letter: 'Sun' },
]

const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Anytime']

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive frequency from the number of selected days. */
function deriveFrequency(dayCount: number): Frequency {
  if (dayCount === 0) return 'flexible'
  if (dayCount === 1) return '1x_week'
  if (dayCount === 2) return '2x_week'
  if (dayCount === 3) return '3x_week'
  if (dayCount <= 5) return '3x_week'
  // 6 or 7
  return 'daily'
}

/** Check whether a preset matches the current day selection.
 *  - "Every day": exactly 7 days selected.
 *  - "Weekdays": exactly Mon-Fri selected.
 *  - "Flexible": exactly 0 days selected.
 *  - "3×/week", "2×/week": any selection with that day count.
 */
function presetMatches(preset: Preset, selectedDays: DayOfWeek[]): boolean {
  const sorted = [...selectedDays].sort((a, b) => a - b)

  // "Weekdays" must be exactly Mon-Fri
  if (preset.label === 'Weekdays') {
    return sorted.length === 5 && sorted.every((d, i) => d === [1, 2, 3, 4, 5][i])
  }

  // "Weekend" must be exactly Sat-Sun
  if (preset.label === 'Weekend') {
    return sorted.length === 2 && sorted[0] === 6 && sorted[1] === 7
  }

  // "Every day" must be exactly 7
  if (preset.label === 'Every day') {
    return sorted.length === 7
  }

  // Frequency presets match by count
  return sorted.length === preset.days.length
}

// ─── Shared selectable-button styles ──────────────────────────────────────────

const SELECTED_PILL =
  'bg-brand text-brand-foreground border-brand'
const UNSELECTED_PILL =
  'border-border bg-card text-foreground hover:bg-surface-muted'

// ─── Screen ───────────────────────────────────────────────────────────────────

export function EditRoutineScreen({ navigate, routineId }: Props) {
  const { state, updateRoutine, deleteRoutine } = useAppStore()

  const routine = routineId
    ? state.routines.find((r) => r.id === routineId)
    : null

  // Form state — initialised from the routine
  const [name, setName] = useState(routine?.name ?? '')
  const [scheduledDays, setScheduledDays] = useState<DayOfWeek[]>(
    routine?.activities[0]?.scheduledDays ?? [],
  )
  const [preferredTime, setPreferredTime] = useState(
    routine?.activities[0]?.preferredTime ?? '',
  )
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [challengeRestarted, setChallengeRestarted] = useState(false)
  const [motivation, setMotivation] = useState(routine?.motivation ?? '')

  // Not-found state
  if (!routine) {
    return (
      <div
        data-testid="screen-edit-routine"
        className="flex flex-col items-center justify-center min-h-full p-6 text-center"
      >
        <h1 className="text-xl font-semibold text-foreground">
          Routine not found
        </h1>
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

  // Derived frequency from current day selection
  const frequency = deriveFrequency(scheduledDays.length)

  function toggleDay(day: DayOfWeek) {
    setScheduledDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b),
    )
  }

  function applyPreset(preset: Preset) {
    setScheduledDays([...preset.days])
  }

  function handleSave() {
    if (!routine) return

    const updated: Routine = {
      ...routine,
      name: name.trim() || routine.name,
      motivation: motivation.trim() || undefined,
      activities: routine.activities.map((a) => ({
        ...a,
        frequency,
        scheduledDays: scheduledDays.length > 0 ? scheduledDays : undefined,
        preferredTime: preferredTime || undefined,
      })),
    }
    updateRoutine(updated)
    navigate('dashboard')
  }

  function handleDelete() {
    if (!routine) return
    deleteRoutine(routine.id)
    // Navigate to dashboard or welcome if no routines remain
    if (state.routines.length <= 1) {
      navigate('welcome')
    } else {
      navigate('dashboard')
    }
  }

  function handleCancel() {
    navigate('dashboard')
  }

  return (
    <div data-testid="screen-edit-routine" className="flex flex-col min-h-full">
      <PageHeader title="Edit routine" backAction={handleCancel} />

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-6">
        {/* a. Routine */}
        <section>
          <SectionHeader title="Routine" />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="routine-name">Routine name</Label>
            <Input
              id="routine-name"
              data-testid="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-brand shrink-0" aria-hidden="true" />
              <Label>What is really driving you?</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Optional. Shows up when you log a session.
            </p>
            <textarea
              data-testid="edit-motivation-custom-input"
              placeholder={emotionalPlaceholder(undefined, routine?.name)}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              maxLength={300}
              rows={2}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 placeholder:italic resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </section>

        {/* b. Schedule — unified day picker with presets */}
        <section>
          <SectionHeader title="Schedule" />

          {/* Preset pills */}
          <div className="flex gap-2 flex-wrap" data-testid="preset-pills">
            {PRESETS.map((preset) => {
              const isActive = presetMatches(preset, scheduledDays)
              return (
                <button
                  key={preset.label}
                  type="button"
                  data-testid={`edit-preset-${preset.label.toLowerCase().replace(/[×\/\s]+/g, '-')}`}
                  onClick={() => applyPreset(preset)}
                  className={[
                    'inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    isActive ? SELECTED_PILL : UNSELECTED_PILL,
                  ].join(' ')}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          {/* Day toggle buttons */}
          <p className="text-xs font-medium text-muted-foreground mt-3 mb-2">Days</p>
          <div className="flex gap-2">
            {DAY_BUTTONS.map(({ value, letter }) => {
              const isSelected = scheduledDays.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={isSelected}
                  data-testid={`edit-day-${value}`}
                  onClick={() => toggleDay(value)}
                  className={[
                    'flex-1 flex items-center justify-center rounded-lg border h-9 text-xs font-medium transition-colors',
                    isSelected ? SELECTED_PILL : UNSELECTED_PILL,
                  ].join(' ')}
                >
                  {letter}
                </button>
              )
            })}
          </div>

          {/* Time of day */}
          <p className="text-xs font-medium text-muted-foreground mt-4 mb-2">Time of day</p>
          <div className="flex gap-2 flex-wrap">
            {TIME_OPTIONS.map((time) => {
              const isSelected = preferredTime === time
              return (
                <button
                  key={time}
                  type="button"
                  aria-pressed={isSelected}
                  data-testid={`edit-time-${time.toLowerCase()}`}
                  onClick={() => setPreferredTime(isSelected ? '' : time)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    isSelected ? SELECTED_PILL : UNSELECTED_PILL,
                  ].join(' ')}
                >
                  {isSelected && <Check size={12} aria-hidden="true" />}
                  {time}
                </button>
              )
            })}
          </div>
        </section>

        {/* c. Challenge */}
        {routine.challengeDurationDays && (
          <section>
            <SectionHeader title="Challenge" />
            {challengeRestarted ? (
              <p
                data-testid="restart-confirmation"
                className="text-sm text-success"
              >
                Challenge restarted — {routine.challengeDurationDays} days from
                today.
              </p>
            ) : (
              <Button
                data-testid="restart-challenge-button"
                variant="outline"
                onClick={() => {
                  const updated: Routine = {
                    ...routine,
                    challengeStartDate: new Date().toISOString().slice(0, 10),
                  }
                  updateRoutine(updated)
                  setChallengeRestarted(true)
                }}
                className="w-full"
              >
                <RotateCcw size={16} className="mr-2" aria-hidden="true" />
                Restart {routine.challengeDurationDays}-day challenge
              </Button>
            )}
          </section>
        )}

      </div>

      {/* Save */}
      <div className="px-5 py-4 border-t border-border">
        <Button
          data-testid="save-button"
          onClick={handleSave}
          className="w-full"
        >
          Save changes
        </Button>
        <button
          type="button"
          data-testid="delete-routine-button"
          onClick={() => setShowDeleteDialog(true)}
          className="w-full mt-4 text-xs text-muted-foreground/50 hover:text-destructive transition-colors py-1"
        >
          Delete this routine
        </button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent data-testid="delete-dialog">
          <DialogHeader>
            <DialogTitle>Delete routine?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes "{routine.name}" and its schedule. Your completed
            session history remains.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              data-testid="delete-cancel"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-testid="delete-confirm"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
