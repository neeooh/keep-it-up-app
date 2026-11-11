/**
 * AddCommitmentScreen — single-screen commitment creation.
 *
 * Layout (top to bottom):
 * 1. Build/Break mode switcher
 * 2. Composer card (name, frequency, time, reminder, alarm)
 * 3. Category filter (horizontal pill row)
 * 4. Suggestion list (filtered by mode + category)
 */

import { X } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { CommitmentComposer, EMPTY_COMPOSER } from '../components/CommitmentComposer'
import type { ComposerState } from '../components/CommitmentComposer'
import { ModeSwitch } from '../components/ModeSwitch'
import type { Mode } from '../components/ModeSwitch'
import { CategoryFilter } from '../components/CategoryFilter'
import type { FilterValue } from '../components/CategoryFilter'
import type { Navigate } from '../App'

interface Props {
  navigate: Navigate
  /** When set, shows a close (X) button that returns to the dashboard. */
  onClose?: () => void
}

export function AddCommitmentScreen({ onClose }: Props) {
  const [composer, setComposer] = useState<ComposerState>(EMPTY_COMPOSER)
  const [mode, setMode] = useState<Mode>('build')
  const [category, setCategory] = useState<FilterValue>('all')

  function handleModeChange(newMode: Mode) {
    setMode(newMode)
    setCategory('all') // Reset category when mode changes
  }

  return (
    <div data-testid="screen-add-commitment" className="flex flex-col min-h-full">
      <PageHeader
        title="What would you like to commit to?"
        rightAction={
          onClose ? (
            <button
              type="button"
              data-testid="close-add-commitment"
              aria-label="Close"
              onClick={onClose}
              className="flex items-center justify-center size-11 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
            >
              <X size={20} aria-hidden="true" />
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 flex flex-col px-5 py-4 gap-4 overflow-y-auto">
        {/* Mode switcher */}
        <ModeSwitch value={mode} onChange={handleModeChange} />

        {/* Composer card */}
        <CommitmentComposer
          value={composer}
          onChange={(patch) => setComposer((prev) => ({ ...prev, ...patch }))}
        />

        {/* Category filter */}
        <CategoryFilter mode={mode} value={category} onChange={setCategory} />

        {/* Suggestion list placeholder — Task 6 */}
        <p className="text-muted-foreground text-sm text-center py-8">
          Suggestions coming next.
        </p>
      </div>
    </div>
  )
}
