/**
 * EditRoutineScreen — edit an existing routine.
 *
 * Pre-populates all fields from the current routine. Supports save,
 * delete (with confirmation dialog), and cancel.
 *
 * Spec reference: mvp_product_spec.md — reachable from weekly review
 * and dashboard.
 */

import { useState } from 'react'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent } from '../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
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
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-4">
        <button
          type="button"
          aria-label="Back"
          onClick={handleCancel}
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Edit routine
        </h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-5">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="routine-name">Routine name</Label>
          <Input
            id="routine-name"
            data-testid="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Frequency */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Frequency</p>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Frequency">
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
                    'flex items-center w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                    isSelected
                      ? 'border-foreground bg-card font-medium'
                      : 'border-border bg-card hover:bg-muted',
                  ].join(' ')}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Scheduled days */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
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
        </div>

        {/* Time preference */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="preferred-time">Preferred time (optional)</Label>
          <Input
            id="preferred-time"
            data-testid="edit-preferred-time"
            placeholder="e.g. Morning"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
          />
        </div>

        {/* Delete button */}
        <Card className="border-destructive/30">
          <CardContent className="pt-4">
            <Button
              data-testid="delete-routine-button"
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full text-destructive hover:text-destructive"
            >
              <Trash2 size={16} className="mr-2" aria-hidden="true" />
              Delete routine
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="px-4 py-4 border-t border-border flex flex-col gap-2">
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
            This will delete "{routine.name}" and all its session history.
            This action cannot be undone.
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
