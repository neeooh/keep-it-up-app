import { ChevronLeft, Sparkles } from 'lucide-react'
import type { Navigate } from '../../App'
import type { Direction } from '../../domain/types'
import {
  type ActivityTemplate,
  customTemplate,
  templatesForDirection,
} from '../../domain/templates'

interface Props {
  navigate: Navigate
  direction: Direction | null
  onDirectionChange: (direction: Direction) => void
  onTemplateSelect?: (templateId: string) => void
}

/** Human-readable heading depending on direction. */
function heading(direction: Direction | null): string {
  if (direction === 'AVOID') return 'What do you want to avoid?'
  return 'What do you want to do?'
}

export function ChooseDirectionScreen({
  navigate,
  direction,
  onDirectionChange: _onDirectionChange,
  onTemplateSelect,
}: Props) {
  // Fall back to DO if direction somehow arrives null (deep-link or test)
  const resolvedDirection: Direction = direction ?? 'DO'
  const templates = templatesForDirection(resolvedDirection)

  function selectTemplate(template: ActivityTemplate) {
    onTemplateSelect?.(template.id)
    navigate('configure-activity')
  }

  return (
    <div data-testid="screen-choose-direction" className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-6">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate('welcome')}
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {heading(resolvedDirection)}
        </h1>
      </div>

      {/* Template cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="flex flex-col gap-3">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              data-testid={`template-card-${template.id}`}
              onClick={() => selectTemplate(template)}
              className={[
                'flex items-center gap-4 w-full rounded-xl border px-4 py-4 text-left',
                'transition-colors hover:bg-muted active:scale-[0.98]',
                template.isCustom
                  ? 'border-dashed border-border bg-transparent'
                  : 'border-border bg-card shadow-sm',
              ].join(' ')}
            >
              {template.isCustom && (
                <Sparkles
                  size={20}
                  className="shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {template.label}
                </p>
                {!template.isCustom && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {frequencyLabel(template)}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Short human-readable frequency label for a template card. */
function frequencyLabel(template: ActivityTemplate): string {
  switch (template.defaultFrequency) {
    case 'daily':
      return 'Daily'
    case '3x_week':
      return '3× per week'
    case '2x_week':
      return '2× per week'
    case '1x_week':
      return 'Once a week'
    case 'flexible':
      return 'Flexible'
  }
}

// Re-export for test convenience
export { customTemplate }
