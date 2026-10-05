/**
 * PlanReviewScreen — onboarding screen 7.
 *
 * Shows a concise summary of the assembled plan and lets the user start
 * or go back to edit.
 * Spec reference: mvp_product_spec.md section 12.
 */

import { ChevronLeft } from 'lucide-react'
import { Button } from '../../components/ui/button'
import type { Navigate, OnboardingDraft } from '../../App'
import { findTemplate } from '../../domain/templates'
import type { Frequency } from '../../domain/types'

interface Props {
  navigate: Navigate
  draft: OnboardingDraft
  onStart: () => void
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

export function PlanReviewScreen({ navigate, draft, onStart }: Props) {
  const template = draft.templateId ? findTemplate(draft.templateId) : null
  const activityName =
    draft.activityName || template?.defaultName || 'My activity'
  const measurements =
    draft.measurements.length > 0
      ? draft.measurements
      : template?.defaultMeasurements ?? []

  return (
    <div data-testid="screen-plan-review" className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-6">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate('optional-challenge')}
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Your plan
        </h1>
      </div>

      {/* Plan summary card */}
      <div className="flex-1 px-4 pb-6">
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">

          {/* Activity name + frequency */}
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

          {/* Measurements */}
          {measurements.length > 0 && (
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

          {/* Scheduled days */}
          {draft.scheduledDays.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Days</p>
              <p
                data-testid="plan-scheduled-days"
                className="text-sm text-foreground"
              >
                {draft.scheduledDays.map((d) => DAY_NAMES[d]).join(' · ')}
              </p>
            </div>
          )}

          {/* Time preference */}
          {draft.preferredTime && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Time</p>
              <p data-testid="plan-preferred-time" className="text-sm text-foreground">
                {draft.preferredTime}
              </p>
            </div>
          )}

          {/* Challenge */}
          {draft.challengeDurationDays != null && (
            <div
              data-testid="plan-challenge"
              className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground"
            >
              {draft.challengeDurationDays}-day challenge
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-4 border-t border-border flex flex-col gap-2">
        <Button
          type="button"
          data-testid="start-button"
          onClick={onStart}
          className="w-full"
        >
          Start today
        </Button>
        <Button
          type="button"
          variant="ghost"
          data-testid="edit-button"
          onClick={() => navigate('configure-activity')}
          className="w-full text-muted-foreground"
        >
          Edit plan
        </Button>
      </div>
    </div>
  )
}
