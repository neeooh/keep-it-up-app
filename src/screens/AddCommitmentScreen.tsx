/**
 * AddCommitmentScreen — single-screen commitment creation.
 *
 * Layout (top to bottom):
 * 1. Build/Break mode switcher
 * 2. Composer card (name, frequency, time, reminder, alarm)
 * 3. Category filter (horizontal pill row)
 * 4. Suggestion list (filtered by mode + category)
 * 5. "Add commitment" button (pinned at bottom)
 */

import { Plus, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/PageHeader'
import { CommitmentComposer, EMPTY_COMPOSER } from '../components/CommitmentComposer'
import type { ComposerState } from '../components/CommitmentComposer'
import { ModeSwitch } from '../components/ModeSwitch'
import type { Mode } from '../components/ModeSwitch'
import { CategoryFilter } from '../components/CategoryFilter'
import type { FilterValue } from '../components/CategoryFilter'
import { SuggestionList } from '../components/SuggestionList'
import type { ActivityTemplate, Path } from '../domain/templates'
import type { DayOfWeek } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { usePreferences } from '../hooks/usePreferences'
import type { Navigate } from '../App'

interface Props {
  navigate: Navigate
  /** When set, shows a close (X) button that returns to the dashboard. */
  onClose?: () => void
}

/** Map a Frequency value to default scheduled days. */
function defaultDaysForFrequency(freq: string): DayOfWeek[] {
  const map: Record<string, DayOfWeek[]> = {
    daily: [1, 2, 3, 4, 5, 6, 7],
    '3x_week': [1, 3, 5],
    '2x_week': [2, 4],
    '1x_week': [6],
    flexible: [],
  }
  return map[freq] ?? []
}

export function AddCommitmentScreen({ navigate, onClose }: Props) {
  const { addCommitment } = useAppStore()
  const { updatePreferences } = usePreferences()

  const [composer, setComposer] = useState<ComposerState>(EMPTY_COMPOSER)
  const [mode, setMode] = useState<Mode>('build')
  const [category, setCategory] = useState<FilterValue>('all')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  function handleModeChange(newMode: Mode) {
    setMode(newMode)
    setCategory('all')
  }

  function handleTemplateSelect(template: ActivityTemplate) {
    setSelectedTemplateId(template.id)
    setComposer({
      name: template.defaultName,
      frequency: template.defaultFrequency,
      timeOfDay: template.defaultPreferredTime ?? '',
      reminderTime: composer.reminderTime,
      reminderType: composer.reminderType,
    })
  }

  const handleAddPath = useCallback(
    (path: Path) => {
      const existingNames = new Set<string>()
      for (const commitment of path.buildCommitments()) {
        const name = commitment.activities[0]?.name.toLowerCase() ?? ''
        if (existingNames.has(name)) continue
        existingNames.add(name)
        addCommitment(commitment)
      }
      updatePreferences({ chosenPath: path.id })
      navigate('dashboard')
    },
    [addCommitment, updatePreferences, navigate],
  )

  const canSave = composer.name.trim().length > 0

  function handleSave() {
    if (!canSave) return

    const direction = mode === 'build' ? 'DO' as const : 'AVOID' as const
    const scheduledDays = defaultDaysForFrequency(composer.frequency)

    addCommitment({
      id: crypto.randomUUID(),
      name: composer.name.trim(),
      createdAt: new Date().toISOString(),
      activities: [
        {
          id: crypto.randomUUID(),
          name: composer.name.trim(),
          direction,
          measurements: [],
          frequency: composer.frequency,
          completionMethod: 'binary',
          scheduledDays: scheduledDays.length > 0 ? scheduledDays : undefined,
          preferredTime: composer.timeOfDay || undefined,
          reminderTime: composer.reminderTime ?? undefined,
          reminderType: composer.reminderType !== 'none' ? composer.reminderType : undefined,
        },
      ],
    })

    navigate('dashboard')
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

      <div className="flex-1 flex flex-col px-5 py-4 gap-4 overflow-y-auto pb-24">
        {/* Mode switcher */}
        <ModeSwitch value={mode} onChange={handleModeChange} />

        {/* Composer card */}
        <CommitmentComposer
          value={composer}
          onChange={(patch) => setComposer((prev) => ({ ...prev, ...patch }))}
        />

        {/* Category filter */}
        <CategoryFilter mode={mode} value={category} onChange={setCategory} />

        {/* Suggestion list */}
        <SuggestionList
          mode={mode}
          category={category}
          onSelect={handleTemplateSelect}
          onAddPath={handleAddPath}
          selectedTemplateId={selectedTemplateId}
        />
      </div>

      {/* Pinned "Add commitment" button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl bg-background border-t border-border px-5 py-3">
        <Button
          data-testid="save-commitment-button"
          disabled={!canSave}
          onClick={handleSave}
          className="w-full"
          size="lg"
        >
          <Plus size={18} className="mr-1.5" aria-hidden="true" />
          Add commitment
        </Button>
      </div>
    </div>
  )
}
