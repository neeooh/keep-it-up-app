/**
 * PlanReviewScreen — onboarding screen 4 of 4.
 *
 * Shows a concise summary of the assembled plan. Optional schedule and
 * challenge settings are now folded into collapsible sections here (the
 * standalone optional-schedule / optional-challenge screens were removed).
 * The user can set preferred days, a time preference, and a challenge
 * duration before creating the plan.
 *
 * Spec reference: mvp_product_spec.md section 12.
 */

import { useState } from 'react'
import { ChevronLeft, ChevronDown, AlertTriangle, Check, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { OnboardingProgress } from '../../components/OnboardingProgress'
import { ActivityIcon } from '../../components/ActivityIcon'
import { useAppStore } from '../../store/useAppStore'
import type { Navigate, OnboardingDraft } from '../../App'
import { findTemplate } from '../../domain/templates'
import type { ChallengeDuration, DayOfWeek, Frequency } from '../../domain/types'

interface Props {
  navigate: Navigate
  draft: OnboardingDraft
  onStart: () => void
  /** When true, "Edit plan" goes to choose-direction instead of configure-activity. */
  skippedConfigure?: boolean
  /** Current preferred days from the draft. */
  scheduledDays?: DayOfWeek[]
  /** Current preferred time label from the draft. */
  preferredTime?: string
  /** Current challenge duration from the draft, or null. */
  challengeDurationDays?: ChallengeDuration | null
  /** Update preferred days and time on the draft. */
  onScheduleChange?: (days: DayOfWeek[], time: string) => void
  /** Update the challenge duration on the draft. */
  onChallengeChange?: (days: ChallengeDuration | null) => void
  onClose?: () => void
}

function frequencyLabel(f: Frequency): string {
  switch (f) {
    case 'daily':    return 'Every day'
    case '3x_week':  return '3× per week'
    case '2x_week':  return '2× per week'
    case '1x_week':  return 'Once a week'
    case 'flexible': return 'Flexible'
  }
}

const DAY_NAMES: Record<number, string> = {
  1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun',
}

interface DayOption {
  value: DayOfWeek
  short: string
}

const DAY_OPTIONS: DayOption[] = [
  { value: 1, short: 'M' },
  { value: 2, short: 'T' },
  { value: 3, short: 'W' },
  { value: 4, short: 'T' },
  { value: 5, short: 'F' },
  { value: 6, short: 'S' },
  { value: 7, short: 'S' },
]

const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Anytime']

interface ChallengeOption {
  value: ChallengeDuration
  label: string
}

const CHALLENGE_OPTIONS: ChallengeOption[] = [
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
]

export function PlanReviewScreen({
  navigate,
  draft,
  onStart,
  skippedConfigure,
  scheduledDays: scheduledDaysProp,
  preferredTime: preferredTimeProp,
  challengeDurationDays: challengeDurationDaysProp,
  onScheduleChange,
  onChallengeChange,
  onClose,
}: Props) {
  const { state } = useAppStore()
  const template = draft.templateId ? findTemplate(draft.templateId) : null
  const activityName =
    draft.activityName || template?.defaultName || 'My activity'
  const measurements =
    draft.measurements.length > 0
      ? draft.measurements
      : template?.defaultMeasurements ?? []

  // Prefer explicit props (wired to the draft from App), fall back to the draft.
  const scheduledDays = scheduledDaysProp ?? draft.scheduledDays
  const preferredTime = preferredTimeProp ?? draft.preferredTime
  const challengeDurationDays =
    challengeDurationDaysProp ?? draft.challengeDurationDays

  // Collapsible section state — both collapsed by default.
  const [daysOpen, setDaysOpen] = useState(false)
  const [challengeOpen, setChallengeOpen] = useState(false)

  const isDuplicate = state.routines.some(
    (r) => r.name.toLowerCase() === activityName.toLowerCase(),
  )

  function toggleDay(day: DayOfWeek) {
    const next = scheduledDays.includes(day)
      ? scheduledDays.filter((d) => d !== day)
      : [...scheduledDays, day].sort((a, b) => a - b)
    onScheduleChange?.(next as DayOfWeek[], preferredTime)
  }

  function selectTime(time: string) {
    const next = preferredTime === time ? '' : time
    onScheduleChange?.(scheduledDays, next)
  }

  function toggleChallenge(days: ChallengeDuration) {
    onChallengeChange?.(challengeDurationDays === days ? null : days)
  }

  return (
    <div data-testid="screen-plan-review" className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-6">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate('set-frequency')}
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="flex-1 text-2xl font-semibold tracking-tight text-foreground">
          Here's your plan
        </h1>
        {onClose && (
          <button
            type="button"
            data-testid="close-onboarding"
            aria-label="Close"
            onClick={onClose}
            className="flex items-center justify-center size-11 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      <OnboardingProgress current={4} total={4} />

      {/* Plan summary card */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2 flex flex-col gap-4">
        {isDuplicate && (
          <div
            data-testid="duplicate-warning"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
          >
            <AlertTriangle size={16} className="text-destructive mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm text-foreground">
              You already have a routine called "{activityName}". You can still
              create this one, but consider renaming it to tell them apart.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
          {/* Activity name + frequency */}
          <div className="flex items-center gap-3">
            <ActivityIcon name={activityName} size={32} className="mt-0.5" />
            <div>
              <p
                data-testid="plan-activity-name"
                className="text-lg font-semibold text-foreground"
              >
                {activityName}
              </p>
              <p
                data-testid="plan-frequency"
                className="text-sm text-muted-foreground mt-0.5"
              >
                {frequencyLabel(draft.frequency)}
              </p>
            </div>
          </div>

          {/* Measurements (hidden when exercises are shown — they contain the same data) */}
          {measurements.length > 0 && !(draft.exercises?.length) && (
            <div className="flex flex-col gap-1">
              {measurements.map((m) => (
                <div
                  key={m.type}
                  data-testid={`plan-measurement-${m.type}`}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <span className="capitalize text-muted-foreground w-20">{m.type}</span>
                  {m.target != null && (
                    <span>
                      {m.target}
                      {m.unit ? ` ${m.unit}` : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Exercises (strength workouts) */}
          {(draft.exercises?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">Exercises</p>
              {draft.exercises.map((ex, i) => (
                <div
                  key={i}
                  data-testid={`plan-exercise-${i}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground font-medium">{ex.name}</span>
                  <span className="text-muted-foreground">
                    {ex.sets} × {ex.reps}
                    {ex.weight > 0 && ` · ${ex.weight} kg`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Scheduled days summary */}
          {scheduledDays.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Days</p>
              <p
                data-testid="plan-scheduled-days"
                className="text-sm text-foreground"
              >
                {scheduledDays.map((d) => DAY_NAMES[d]).join(' · ')}
              </p>
            </div>
          )}

          {/* Time preference summary */}
          {preferredTime && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Time</p>
              <p data-testid="plan-preferred-time" className="text-sm text-foreground">
                {preferredTime}
              </p>
            </div>
          )}

          {/* Challenge summary */}
          {challengeDurationDays != null && (
            <div
              data-testid="plan-challenge"
              className="rounded-xl bg-brand-light px-4 py-3 text-sm text-foreground"
            >
              {challengeDurationDays}-day challenge
            </div>
          )}
        </div>

        {/* Collapsible: Set preferred days */}
        <div className="rounded-2xl border border-border bg-card">
          <button
            type="button"
            data-testid="toggle-schedule"
            aria-expanded={daysOpen}
            onClick={() => setDaysOpen((v) => !v)}
            className="flex items-center justify-between w-full px-5 py-4 text-left"
          >
            <span className="text-sm font-medium text-foreground">Set preferred days</span>
            <ChevronDown
              size={18}
              className={[
                'text-muted-foreground transition-transform',
                daysOpen ? 'rotate-180' : '',
              ].join(' ')}
              aria-hidden="true"
            />
          </button>

          {daysOpen && (
            <div data-testid="schedule-content" className="px-5 pb-5 flex flex-col gap-5">
              {/* Day picker */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Days</p>
                <div className="flex gap-2">
                  {DAY_OPTIONS.map(({ value, short }) => {
                    const isSelected = scheduledDays.includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={isSelected}
                        data-testid={`day-option-${value}`}
                        onClick={() => toggleDay(value)}
                        className={[
                          'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                          isSelected
                            ? 'border-brand bg-brand-light text-foreground'
                            : 'border-border bg-card text-foreground hover:bg-surface-muted',
                        ].join(' ')}
                      >
                        {short}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time preference */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Time of day</p>
                <div className="flex gap-2 flex-wrap">
                  {TIME_OPTIONS.map((time) => {
                    const isSelected = preferredTime === time
                    return (
                      <button
                        key={time}
                        type="button"
                        aria-pressed={isSelected}
                        data-testid={`time-option-${time.toLowerCase()}`}
                        onClick={() => selectTime(time)}
                        className={[
                          'inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                          isSelected
                            ? 'border-brand bg-brand-light text-foreground'
                            : 'border-border bg-card text-foreground hover:bg-surface-muted',
                        ].join(' ')}
                      >
                        {isSelected && <Check size={14} className="text-brand" aria-hidden="true" />}
                        {time}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible: Make this a challenge? */}
        <div className="rounded-2xl border border-border bg-card">
          <button
            type="button"
            data-testid="toggle-challenge"
            aria-expanded={challengeOpen}
            onClick={() => setChallengeOpen((v) => !v)}
            className="flex items-center justify-between w-full px-5 py-4 text-left"
          >
            <span className="text-sm font-medium text-foreground">Make this a challenge?</span>
            <ChevronDown
              size={18}
              className={[
                'text-muted-foreground transition-transform',
                challengeOpen ? 'rotate-180' : '',
              ].join(' ')}
              aria-hidden="true"
            />
          </button>

          {challengeOpen && (
            <div
              data-testid="challenge-content"
              className="px-5 pb-5 flex flex-col gap-3"
              role="radiogroup"
              aria-label="Challenge duration"
            >
              {CHALLENGE_OPTIONS.map(({ value, label }) => {
                const isSelected = challengeDurationDays === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-testid={`challenge-option-${value}`}
                    onClick={() => toggleChallenge(value)}
                    className={[
                      'flex items-center justify-between w-full rounded-lg border px-4 py-3 text-left transition-colors',
                      isSelected
                        ? 'border-brand bg-brand-light'
                        : 'border-border bg-card hover:bg-surface-muted',
                    ].join(' ')}
                  >
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    {isSelected && <Check size={18} className="text-brand" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-border flex flex-col gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          data-testid="start-button"
          onClick={onStart}
          className="w-full"
        >
          Create my plan
        </Button>
        <Button
          type="button"
          variant="ghost"
          data-testid="edit-button"
          onClick={() => navigate(skippedConfigure ? 'choose-direction' : 'configure-activity')}
          className="w-full text-muted-foreground"
        >
          Edit plan
        </Button>
      </div>
    </div>
  )
}
