/**
 * OptionalChallengeScreen — onboarding screen 6.
 *
 * The user optionally sets a fixed-duration challenge (30/60/90 days).
 * Skip is always prominently available.
 * Spec reference: mvp_product_spec.md section 11.
 */

import { ChevronLeft } from 'lucide-react'
import { Button } from '../../components/ui/button'
import type { Navigate } from '../../App'
import type { ChallengeDuration } from '../../domain/types'
import { findTemplate } from '../../domain/templates'

interface Props {
  navigate: Navigate
  templateId: string | null
  challengeDurationDays: ChallengeDuration | null
  onChallengeChange: (days: ChallengeDuration | null) => void
}

interface ChallengeOption {
  value: ChallengeDuration
  label: string
}

const CHALLENGE_OPTIONS: ChallengeOption[] = [
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
]

export function OptionalChallengeScreen({
  navigate,
  templateId,
  challengeDurationDays,
  onChallengeChange,
}: Props) {
  const template = templateId ? findTemplate(templateId) : null
  const suggested = template?.suggestedChallengeDays ?? null

  function toggle(days: ChallengeDuration) {
    onChallengeChange(challengeDurationDays === days ? null : days)
  }

  function handleContinue() {
    navigate('plan-review')
  }

  function handleSkip() {
    onChallengeChange(null)
    navigate('plan-review')
  }

  return (
    <div data-testid="screen-optional-challenge" className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-6">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate('optional-schedule')}
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Make this a challenge?
        </h1>
      </div>

      <div className="flex-1 px-4 pb-6 flex flex-col gap-4">
        {suggested && (
          <p className="text-sm text-muted-foreground">
            A {suggested}-day challenge is popular for this habit.
          </p>
        )}

        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Challenge duration">
          {CHALLENGE_OPTIONS.map(({ value, label }) => {
            const isSelected = challengeDurationDays === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                data-testid={`challenge-option-${value}`}
                onClick={() => toggle(value)}
                className={[
                  'flex items-center justify-between w-full rounded-xl border px-4 py-3.5 text-left transition-colors',
                  isSelected
                    ? 'border-foreground bg-card'
                    : 'border-border bg-card hover:bg-muted',
                ].join(' ')}
              >
                <span className="text-sm font-medium text-foreground">{label}</span>
                {suggested === value && (
                  <span className="text-xs text-muted-foreground">Suggested</span>
                )}
              </button>
            )
          })}
        </div>
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
          No end date
        </Button>
      </div>
    </div>
  )
}
