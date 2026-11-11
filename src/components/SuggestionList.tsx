/**
 * SuggestionList — categorised template cards filtered by mode and category.
 *
 * Tapping a suggestion calls onSelect with the template. The parent
 * populates the composer card from the template defaults.
 *
 * When the "Paths" category is active, renders Path cards instead.
 */

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { ActivityIcon } from './ActivityIcon'
import type { ActivityTemplate } from '../domain/templates'
import { templatesForMode, templatesByCategory, paths } from '../domain/templates'
import type { Path } from '../domain/templates'
import type { Mode } from './ModeSwitch'
import type { FilterValue } from './CategoryFilter'
import type { TemplateCategory } from '../domain/templates'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  mode: Mode
  category: FilterValue
  onSelect: (template: ActivityTemplate) => void
  /** Called when the user adds an entire path. */
  onAddPath: (path: Path) => void
  /** The id of the currently selected template (for highlight). */
  selectedTemplateId?: string | null
}

// ─── Suggestion list ──────────────────────────────────────────────────────────

export function SuggestionList({ mode, category, onSelect, onAddPath, selectedTemplateId }: Props) {
  // Paths view
  if (category === 'paths') {
    return <PathList onAddPath={onAddPath} />
  }

  // Filter templates
  let templates: ActivityTemplate[]
  if (category === 'all') {
    templates = templatesForMode(mode)
  } else {
    templates = templatesByCategory(category as TemplateCategory)
  }

  if (templates.length === 0) {
    return (
      <p data-testid="no-suggestions" className="text-sm text-muted-foreground text-center py-6">
        No suggestions in this category.
      </p>
    )
  }

  return (
    <div data-testid="suggestion-list" className="flex flex-col gap-2">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          data-testid={`suggestion-${template.id}`}
          onClick={() => onSelect(template)}
          className={[
            'flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left transition-colors',
            selectedTemplateId === template.id
              ? 'border-brand bg-brand-light/30'
              : 'border-border bg-card hover:bg-surface-muted active:scale-[0.98]',
          ].join(' ')}
        >
          <ActivityIcon name={template.label} size={22} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {template.label}
            </p>
            {template.instruction && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {template.instruction}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Path list ────────────────────────────────────────────────────────────────

function PathList({ onAddPath }: { onAddPath: (path: Path) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div data-testid="path-list" className="flex flex-col gap-3">
      {paths.map((path) => {
        const isExpanded = expandedId === path.id
        return (
          <div
            key={path.id}
            data-testid={`path-card-${path.id}`}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            {/* Path header */}
            <button
              type="button"
              data-testid={`path-toggle-${path.id}`}
              onClick={() => setExpandedId(isExpanded ? null : path.id)}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-surface-muted transition-colors"
            >
              <span className="text-2xl shrink-0" aria-hidden="true">{path.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{path.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{path.tagline}</p>
              </div>
              {isExpanded
                ? <ChevronUp size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
                : <ChevronDown size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
              }
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-border px-4 py-3 flex flex-col gap-3">
                <p className="text-xs text-muted-foreground italic">{path.motivation}</p>
                <div className="flex flex-col gap-1.5">
                  {path.buildCommitments().map((c) => {
                    const activity = c.activities[0]
                    if (!activity) return null
                    return (
                      <div key={c.id} className="flex items-center gap-2 text-sm">
                        <ActivityIcon name={activity.name} size={16} />
                        <span className="text-foreground">{activity.name}</span>
                        {activity.instruction && (
                          <span className="text-muted-foreground text-xs">— {activity.instruction}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
                <button
                  type="button"
                  data-testid={`path-add-${path.id}`}
                  onClick={() => onAddPath(path)}
                  className="w-full rounded-lg bg-brand text-white text-sm font-medium py-2 hover:bg-brand/90 transition-colors"
                >
                  Add this path
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
