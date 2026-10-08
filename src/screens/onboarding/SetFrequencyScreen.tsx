/**
 * SetFrequencyScreen — onboarding screen 3 of 4.
 *
 * The user picks how often they intend to perform the activity.
 * Spec reference: mvp_product_spec.md section 9.
 */

import { ChevronLeft, Check, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { OnboardingProgress } from '../../components/OnboardingProgress'
import type { Navigate } from '../../App'
import type { Frequency } from '../../domain/types'

interface Props {
  navigate: Navigate
  frequency: Frequency
  onFrequencyChange: (frequency: Frequency) => void
  /** When true, back goes to choose-direction instead of configure-activity. */
  skippedConfigure?: boolean
  onClose?: () => void
}

interface FrequencyOption {
  value: Frequency
  label: string
  sublabel: string
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 'daily',    label: 'Every day',        sublabel: '7× per week' },
  { value: '3x_week',  label: '3× per week',      sublabel: 'e.g. Mon / Wed / Fri' },
  { value: '2x_week',  label: '2× per week',      sublabel: 'e.g. Tue / Thu' },
  { value: '1x_week',  label: 'Once a week',      sublabel: 'e.g. Saturday morning' },
  { value: 'flexible', label: "I'll decide each time", sublabel: 'No fixed schedule' },
]

export function SetFrequencyScreen({ navigate, frequency, onFrequencyChange, skippedConfigure, onClose }: Props) {
  return (
    <div data-testid="screen-set-frequency" className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-6">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(skippedConfigure ? 'choose-direction' : 'configure-activity')}
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="flex-1 text-2xl font-semibold tracking-tight text-foreground">
          How often feels realistic?
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

      <OnboardingProgress current={3} total={4} />

      {/* Options */}
      <div className="flex-1 px-5 pb-6 pt-2">
        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Frequency">
          {FREQUENCY_OPTIONS.map(({ value, label, sublabel }) => {
            const isSelected = frequency === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                data-testid={`frequency-option-${value}`}
                onClick={() => onFrequencyChange(value)}
                className={[
                  'flex items-center justify-between w-full rounded-xl border px-4 py-3.5 text-left transition-colors',
                  isSelected
                    ? 'border-brand bg-brand-light'
                    : 'border-border bg-card hover:bg-surface-muted',
                ].join(' ')}
              >
                <span className="flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{sublabel}</span>
                </span>
                {isSelected && (
                  <Check size={18} className="shrink-0 text-brand" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Choose what you can realistically keep doing. Consistency beats ambition.
        </p>
      </div>

      {/* Continue */}
      <div className="px-5 py-4 border-t border-border pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          data-testid="continue-button"
          onClick={() => navigate('plan-review')}
          className="w-full"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
