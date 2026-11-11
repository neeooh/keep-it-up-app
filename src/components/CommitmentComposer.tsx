/**
 * CommitmentComposer — the top card on the creation screen.
 *
 * Contains:
 * - Activity name text input
 * - Frequency pill selector
 * - Time-of-day pill selector
 * - Reminder time picker
 * - Alarm toggle
 */

import { Bell, BellRing } from 'lucide-react'
import { useRef } from 'react'
import type { Frequency, ReminderType } from '../domain/types'

// ─── State type ───────────────────────────────────────────────────────────────

export interface ComposerState {
  name: string
  frequency: Frequency
  timeOfDay: string
  reminderTime: string | null
  reminderType: ReminderType
}

export const EMPTY_COMPOSER: ComposerState = {
  name: '',
  frequency: '3x_week',
  timeOfDay: '',
  reminderTime: null,
  reminderType: 'none',
}

// ─── Options ──────────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: '3x_week', label: '3× / week' },
  { value: '2x_week', label: '2× / week' },
  { value: '1x_week', label: 'Weekly' },
  { value: 'flexible', label: 'Flexible' },
]

const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Any time']

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  value: ComposerState
  onChange: (patch: Partial<ComposerState>) => void
  /** Auto-focus the name input on mount. */
  autoFocus?: boolean
}

export function CommitmentComposer({ value, onChange, autoFocus = true }: Props) {
  const timeInputRef = useRef<HTMLInputElement>(null)

  const hasReminder = value.reminderTime !== null

  function handleReminderClick() {
    if (timeInputRef.current) {
      timeInputRef.current.showPicker?.()
      timeInputRef.current.focus()
    }
  }

  function handleReminderChange(time: string) {
    if (time) {
      onChange({
        reminderTime: time,
        reminderType: value.reminderType === 'none' ? 'alert' : value.reminderType,
      })
    } else {
      onChange({ reminderTime: null, reminderType: 'none' })
    }
  }

  function toggleAlarm() {
    if (!hasReminder) return
    onChange({
      reminderType: value.reminderType === 'alarm' ? 'alert' : 'alarm',
    })
  }

  return (
    <div
      data-testid="commitment-composer"
      className="rounded-2xl border border-border bg-card shadow-sm p-5 flex flex-col gap-4"
    >
      {/* Name input */}
      <input
        type="text"
        data-testid="composer-name-input"
        placeholder="Name your commitment..."
        value={value.name}
        onChange={(e) => onChange({ name: e.target.value })}
        autoFocus={autoFocus}
        className="w-full text-lg font-semibold text-foreground bg-transparent placeholder:text-muted-foreground/60 outline-none border-b border-border pb-2 focus:border-brand transition-colors"
      />

      {/* Frequency pills */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Frequency</span>
        <div className="flex flex-wrap gap-2" data-testid="frequency-pills">
          {FREQUENCY_OPTIONS.map(({ value: freq, label }) => (
            <button
              key={freq}
              type="button"
              data-testid={`freq-${freq}`}
              onClick={() => onChange({ frequency: freq })}
              className={[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                value.frequency === freq
                  ? 'bg-brand text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Time-of-day pills */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Time of day</span>
        <div className="flex flex-wrap gap-2" data-testid="time-pills">
          {TIME_OPTIONS.map((time) => (
            <button
              key={time}
              type="button"
              data-testid={`time-${time.toLowerCase().replace(/ /g, '-')}`}
              onClick={() =>
                onChange({ timeOfDay: value.timeOfDay === time ? '' : time })
              }
              className={[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                value.timeOfDay === time
                  ? 'bg-brand text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              ].join(' ')}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Reminder and alarm row */}
      <div className="flex items-center gap-2">
        {/* Reminder pill with hidden time input */}
        <button
          type="button"
          data-testid="reminder-pill"
          onClick={handleReminderClick}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            hasReminder
              ? 'bg-brand text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          ].join(' ')}
        >
          <Bell size={14} aria-hidden="true" />
          {hasReminder ? value.reminderTime : 'Reminder'}
        </button>
        <input
          ref={timeInputRef}
          type="time"
          data-testid="reminder-time-input"
          value={value.reminderTime ?? ''}
          onChange={(e) => handleReminderChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
          aria-label="Reminder time"
        />

        {/* Alarm toggle */}
        <button
          type="button"
          data-testid="alarm-toggle"
          onClick={toggleAlarm}
          disabled={!hasReminder}
          aria-pressed={value.reminderType === 'alarm'}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            !hasReminder
              ? 'bg-muted text-muted-foreground/40 cursor-not-allowed'
              : value.reminderType === 'alarm'
                ? 'bg-brand text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
          ].join(' ')}
        >
          <BellRing size={14} aria-hidden="true" />
          {value.reminderType === 'alarm' ? 'Alarm' : 'Alert'}
        </button>

        {/* Clear reminder */}
        {hasReminder && (
          <button
            type="button"
            data-testid="clear-reminder"
            onClick={() => onChange({ reminderTime: null, reminderType: 'none' })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
