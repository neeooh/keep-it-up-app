/**
 * EditCommitmentScreen — edit an existing commitment.
 *
 * Pre-populates all fields from the current commitment and groups them into
 * clear sections: Commitment, Schedule, and Challenge. The Schedule section
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
import type { DayOfWeek, Frequency, Commitment } from '../domain/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
  commitmentId: string | null
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

export function EditCommitmentScreen({ navigate, commitmentId }: Props) {
  const { state, updateCommitment, deleteCommitment } = useAppStore()

  const commitment = commitmentId
    ? state.commitments.find((r) => r.id === commitmentId)
    : null

  // Form state — initialised from the commitment
  const [name, setName] = useState(commitment?.name ?? '')
  const [scheduledDays, setScheduledDays] = useState<DayOfWeek[]>(
    commitment?.activities[0]?.scheduledDays ?? [],
  )
  const [preferredTime, setPreferredTime] = useState(
    commitment?.activities[0]?.preferredTime ?? '',
  )
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [challengeRestarted, setChallengeRestarted] = useState(false)
  const [motivation, setMotivation] = useState(commitment?.motivation ?? '')

  // Not-found state
  if (!commitment) {
    return (
      <div
        data-testid="screen-edit-commitment"
        className="flex flex-col items-center justify-center min-h-full p-6 text-center"
      >
        <h1 className="text-xl font-semibold text-foreground">
          Commitment not found
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
    if (!commitment) return

    const updated: Commitment = {
      ...commitment,
      name: name.trim() || commitment?.name,
      motivation: motivation.trim() || undefined,
      activities: commitment?.activities.map((a) => ({
        ...a,
        frequency,
        scheduledDays: scheduledDays.length > 0 ? scheduledDays : undefined,
        preferredTime: preferredTime || undefined,
      })),
    }
    updateCommitment(updated)
    navigate('dashboard')
  }

  function handleDelete() {
    if (!commitment) return
    deleteCommitment(commitment.id)
    // Navigate to dashboard or welcome if no commitments remain
    if (state.commitments.length <= 1) {
      navigate('add-commitment')
    } else {
      navigate('dashboard')
    }
  }

  function handleCancel() {
    navigate('dashboard')
  }

  return (
    <div data-testid="screen-edit-commitment" className="flex flex-col min-h-full">
      <PageHeader title="Edit commitment" backAction={handleCancel} />

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-6">
        {/* a. Commitment */}
        <section>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="commitment-name">Name</Label>
            <Input
              id="commitment-name"
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
            <textarea
              data-testid="edit-motivation-custom-input"
              placeholder="Why this matters to me..."
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
        {commitment.challengeDurationDays && (
          <section>
            <SectionHeader title="Challenge" />
            {challengeRestarted ? (
              <p
                data-testid="restart-confirmation"
                className="text-sm text-success"
              >
                Challenge restarted — {commitment.challengeDurationDays} days from
                today.
              </p>
            ) : (
              <Button
                data-testid="restart-challenge-button"
                variant="outline"
                onClick={() => {
                  const updated: Commitment = {
                    ...commitment,
                    challengeStartDate: new Date().toISOString().slice(0, 10),
                  }
                  updateCommitment(updated)
                  setChallengeRestarted(true)
                }}
                className="w-full"
              >
                <RotateCcw size={16} className="mr-2" aria-hidden="true" />
                Restart {commitment.challengeDurationDays}-day challenge
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
          data-testid="delete-commitment-button"
          onClick={() => setShowDeleteDialog(true)}
          className="w-full mt-4 text-xs text-muted-foreground/50 hover:text-destructive transition-colors py-1"
        >
          Delete this commitment
        </button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent data-testid="delete-dialog">
          <DialogHeader>
            <DialogTitle>Delete commitment?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes "{commitment?.name}" and its schedule. Your completed
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
