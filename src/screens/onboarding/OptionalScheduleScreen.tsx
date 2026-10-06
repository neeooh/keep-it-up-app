/**
 * OptionalScheduleScreen — onboarding screen 5.
 *
 * The user optionally picks preferred days and a time-of-day preference.
 * Skip is always prominently available.
 * Spec reference: mvp_product_spec.md section 10.
 */

import { ChevronLeft, CalendarPlus } from 'lucide-react'
import { Button } from '../../components/ui/button'
import type { Navigate } from '../../App'
import type { DayOfWeek } from '../../domain/types'

interface Props {
  navigate: Navigate
  scheduledDays: DayOfWeek[]
  preferredTime: string
  onScheduleChange: (days: DayOfWeek[], time: string) => void
}

interface DayOption {
  value: DayOfWeek
  short: string
}

const DAY_OPTIONS: DayOption[] = [
  { value: 1, short: 'Mon' },
  { value: 2, short: 'Tue' },
  { value: 3, short: 'Wed' },
  { value: 4, short: 'Thu' },
  { value: 5, short: 'Fri' },
  { value: 6, short: 'Sat' },
  { value: 7, short: 'Sun' },
]

const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Anytime']

export function OptionalScheduleScreen({
  navigate,
  scheduledDays,
  preferredTime,
  onScheduleChange,
}: Props) {
  function toggleDay(day: DayOfWeek) {
    const next = scheduledDays.includes(day)
      ? scheduledDays.filter((d) => d !== day)
      : [...scheduledDays, day].sort((a, b) => a - b)
    onScheduleChange(next as DayOfWeek[], preferredTime)
  }

  function selectTime(time: string) {
    const next = preferredTime === time ? '' : time
    onScheduleChange(scheduledDays, next)
  }

  function handleContinue() {
    navigate('optional-challenge')
  }

  function handleSkip() {
    onScheduleChange([], '')
    navigate('optional-challenge')
  }

  return (
    <div data-testid="screen-optional-schedule" className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-6">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate('set-frequency')}
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Pick your preferred days
        </h1>
      </div>

      <div className="flex-1 px-4 pb-6 flex flex-col gap-8">
        {/* Day picker */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Days (optional)</p>
          <div className="flex gap-2 flex-wrap">
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
        <div>
          <p className="text-sm text-muted-foreground mb-3">Time of day (optional)</p>
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
                    'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                    isSelected
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-card text-foreground hover:bg-muted',
                  ].join(' ')}
                >
                  {time}
                </button>
              )
            })}
          </div>
        </div>

        {/* Calendar reminder prompt */}
        {scheduledDays.length > 0 && preferredTime && preferredTime !== 'Anytime' && (
          <div
            data-testid="calendar-reminder-prompt"
            className="flex items-start gap-3 rounded-xl bg-muted px-4 py-3"
          >
            <CalendarPlus size={18} className="text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Add a recurring calendar reminder on your phone to help you remember.
              This app does not send push notifications yet.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-4 border-t border-border flex flex-col gap-2">
        <Button
          type="button"
          data-testid="continue-button"
          onClick={handleContinue}
          className="w-full"
        >
          Continue
        </Button>
        <Button
          type="button"
          variant="ghost"
          data-testid="skip-button"
          onClick={handleSkip}
          className="w-full text-muted-foreground"
        >
          Skip
        </Button>
      </div>
    </div>
  )
}
