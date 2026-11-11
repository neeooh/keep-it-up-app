/**
 * CategoryFilter — horizontal scrollable row of pill buttons.
 *
 * Renders the categories for the current mode. The first pill is always "All".
 * For Build mode, a "Paths" pill is appended at the end.
 */

import type { Mode } from './ModeSwitch'
import type { TemplateCategory } from '../domain/templates'
import { BUILD_CATEGORIES, BREAK_CATEGORIES } from '../domain/templates'

/** Special filter values that are not real TemplateCategory values. */
export type FilterValue = 'all' | 'paths' | TemplateCategory

interface Props {
  mode: Mode
  value: FilterValue
  onChange: (category: FilterValue) => void
}

export function CategoryFilter({ mode, value, onChange }: Props) {
  const categories = mode === 'build' ? BUILD_CATEGORIES : BREAK_CATEGORIES

  return (
    <div
      data-testid="category-filter"
      className="flex overflow-x-auto gap-2 pb-1 scrollbar-none -mx-5 px-5"
    >
      {/* "All" pill — always first */}
      <button
        type="button"
        data-testid="category-all"
        onClick={() => onChange('all')}
        className={[
          'shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
          value === 'all'
            ? 'bg-brand text-white'
            : 'bg-muted text-muted-foreground hover:bg-muted/80',
        ].join(' ')}
      >
        All
      </button>

      {/* Category pills */}
      {categories.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          data-testid={`category-${key}`}
          onClick={() => onChange(key)}
          className={[
            'shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
            value === key
              ? 'bg-brand text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          ].join(' ')}
        >
          {label}
        </button>
      ))}

      {/* "Paths" pill — only in Build mode */}
      {mode === 'build' && (
        <button
          type="button"
          data-testid="category-paths"
          onClick={() => onChange('paths')}
          className={[
            'shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            value === 'paths'
              ? 'bg-brand text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          ].join(' ')}
        >
          Paths
        </button>
      )}
    </div>
  )
}
