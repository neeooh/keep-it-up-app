/**
 * EditRoutineScreen — edit an existing routine.
 *
 * Pre-populates all fields from the current routine and groups them into
 * clear sections: Routine, Schedule, Time, Challenge, and a visually
 * separated Danger zone. Supports save, delete (with confirmation), and
 * cancel.
 *
 * Spec reference: mvp_product_spec.md — reachable from weekly review
 * and dashboard.
 */

import { useState } from 'react'
import { Check, Trash2, RotateCcw } from 'lucide-react'
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
  routineId: string | null
}

// ─── Frequency options ────────────────────────────────────────────────────────

interface FrequencyOption {
  value: Frequency
  label: string
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 'daily', label: 'Every day' },
  { value: '3x_week', label: '3× per week' },
  { value: '2x_week', label: '2× per week' },
  { value: '1x_week', label: 'Once a week' },
  { value: 'flexible', label: "I'll decide each time" },
]

const DAY_OPTIONS: { value: DayOfWeek; short: string }[] = [
  { value: 1, short: 'Mon' },
  { value: 2, short: 'Tue' },
  { value: 3, short: 'Wed' },
  { value: 4, short: 'Thu' },
  { value: 5, short: 'Fri' },
  { value: 6, short: 'Sat' },
  { value: 7, short: 'Sun' },
]

const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Anytime']

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
  const [frequency, setFrequency] = useState<Frequency>(
    routine?.activities[0]?.frequency ?? '3x_week',
  )
  const [scheduledDays, setScheduledDays] = useState<DayOfWeek[]>(
    routine?.activities[0]?.scheduledDays ?? [],
  )
  const [preferredTime, setPreferredTime] = useState(
    routine?.activities[0]?.preferredTime ?? '',
  )
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [challengeRestarted, setChallengeRestarted] = useState(false)

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

  function toggleDay(day: DayOfWeek) {
    setScheduledDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b),
    )
  }

  function handleSave() {
    if (!routine) return

    const updated: Routine = {
      ...routine,
      name: name.trim() || routine.name,
      activities: routine.activities.map((a) => ({
        ...a,
        name: name.trim() || a.name,
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
        </section>

        {/* b. Schedule */}
        <section>
          <SectionHeader title="Schedule" />

          {/* Frequency */}
          <p className="text-sm font-medium text-foreground mb-2">Frequency</p>
          <div
            className="flex flex-col gap-2"
            role="radiogroup"
            aria-label="Frequency"
          >
            {FREQUENCY_OPTIONS.map(({ value, label }) => {
              const isSelected = frequency === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-testid={`edit-frequency-${value}`}
                  onClick={() => setFrequency(value)}
                  className={[
                    'flex items-center justify-between w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                    isSelected
                      ? 'border-brand bg-brand-light text-foreground font-medium'
                      : 'border-border bg-card hover:bg-surface-muted',
                  ].join(' ')}
                >
                  <span>{label}</span>
                  {isSelected && (
                    <Check size={16} aria-hidden="true" className="text-brand" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Scheduled days */}
          <p className="text-sm font-medium text-foreground mt-4 mb-2">
            Preferred days (optional)
          </p>
          <div className="flex gap-2 flex-wrap">
            {DAY_OPTIONS.map(({ value, short }) => {
              const isSelected = scheduledDays.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={isSelected}
                  data-testid={`edit-day-${value}`}
                  onClick={() => toggleDay(value)}
                  className={[
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors min-w-[3rem]',
                    isSelected ? SELECTED_PILL : UNSELECTED_PILL,
                  ].join(' ')}
                >
                  {short}
                </button>
              )
            })}
          </div>
        </section>

        {/* c. Time */}
        <section>
          <SectionHeader title="Time" />
          <p className="text-sm font-medium text-foreground mb-2">
            Preferred time (optional)
          </p>
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
                    'inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    isSelected ? SELECTED_PILL : UNSELECTED_PILL,
                  ].join(' ')}
                >
                  {isSelected && <Check size={14} aria-hidden="true" />}
                  {time}
                </button>
              )
            })}
          </div>
        </section>

        {/* d. Challenge */}
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

        {/* e. Danger zone */}
        <section className="mt-8">
          <SectionHeader title="Danger zone" />
          <Button
            data-testid="delete-routine-button"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="w-full"
          >
            <Trash2 size={16} className="mr-2" aria-hidden="true" />
            Delete routine
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            This removes the routine and its future schedule. Past history
            remains.
          </p>
        </section>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-border flex flex-col gap-2">
        <Button
          data-testid="save-button"
          onClick={handleSave}
          className="w-full"
        >
          Save changes
        </Button>
        <Button
          data-testid="cancel-button"
          variant="ghost"
          onClick={handleCancel}
          className="w-full text-muted-foreground"
        >
          Cancel
        </Button>
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
