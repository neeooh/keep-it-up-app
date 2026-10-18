/**
 * PathPreviewScreen — shows a persona preset in detail before the user commits.
 *
 * Displays the persona name, emoji, motivation quote, list of activities
 * grouped by time of day, and total daily time commitment.
 * Two actions: "This is me" (install) and back (choose again).
 */

import { ChevronLeft, Sun, Moon, Clock } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { personaPresets, type PersonaPreset } from '../../domain/templates'
import type { Navigate } from '../../App'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
  presetId: string | null
  onConfirm: (presetId: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function totalDailyMinutes(preset: PersonaPreset): number {
  const routines = preset.buildRoutines()
  let total = 0
  for (const routine of routines) {
    for (const activity of routine.activities) {
      const dur = activity.measurements.find((m) => m.type === 'duration')
      if (dur?.target) total += dur.target
    }
  }
  return total
}

interface GroupedActivity {
  name: string
  description?: string
  duration?: number
  isAvoid: boolean
}

function groupByTime(preset: PersonaPreset): { morning: GroupedActivity[]; evening: GroupedActivity[]; anytime: GroupedActivity[] } {
  const routines = preset.buildRoutines()
  const morning: GroupedActivity[] = []
  const evening: GroupedActivity[] = []
  const anytime: GroupedActivity[] = []

  for (const routine of routines) {
    for (const activity of routine.activities) {
      const dur = activity.measurements.find((m) => m.type === 'duration')
      const item: GroupedActivity = {
        name: activity.name,
        description: activity.description,
        duration: dur?.target,
        isAvoid: activity.direction === 'AVOID',
      }
      const time = activity.preferredTime?.toLowerCase()
      if (time === 'morning') morning.push(item)
      else if (time === 'evening') evening.push(item)
      else anytime.push(item)
    }
  }

  return { morning, evening, anytime }
}

function ActivityRow({ activity }: { activity: GroupedActivity }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{activity.name}</p>
        {activity.description && (
          <p className="text-xs text-muted-foreground italic mt-0.5">{activity.description}</p>
        )}
      </div>
      {activity.duration && (
        <span className="text-xs text-muted-foreground shrink-0">{activity.duration} min</span>
      )}
      {activity.isAvoid && (
        <span className="text-xs text-muted-foreground shrink-0">Avoid</span>
      )}
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function PathPreviewScreen({ navigate, presetId, onConfirm }: Props) {
  const preset = presetId ? personaPresets.find((p) => p.id === presetId) : null

  if (!preset) {
    return (
      <div
        data-testid="screen-path-preview"
        className="flex flex-1 flex-col items-center justify-center p-6 text-center"
      >
        <p className="text-foreground">Path not found.</p>
        <Button onClick={() => navigate('welcome')} className="mt-4">Go back</Button>
      </div>
    )
  }

  const { morning, evening, anytime } = groupByTime(preset)
  const totalMin = totalDailyMinutes(preset)

  return (
    <div data-testid="screen-path-preview" className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-8 pb-4">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate('welcome')}
          className="-ml-2 flex items-center justify-center size-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Persona hero */}
      <div className="flex flex-col items-center text-center px-6 pb-6">
        <span className="text-5xl mb-3" aria-hidden="true">{preset.emoji}</span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{preset.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{preset.tagline}</p>
        <p className="text-sm text-foreground italic mt-4 max-w-xs">
          "{preset.motivation}"
        </p>
        <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground">
          <Clock size={12} aria-hidden="true" />
          <span>~{totalMin} min per day</span>
        </div>
      </div>

      {/* Activities grouped by time */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4">
        {morning.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sun size={14} className="text-brand" aria-hidden="true" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Morning</p>
            </div>
            {morning.map((a) => <ActivityRow key={a.name} activity={a} />)}
          </div>
        )}

        {evening.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Moon size={14} className="text-brand" aria-hidden="true" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Evening</p>
            </div>
            {evening.map((a) => <ActivityRow key={a.name} activity={a} />)}
          </div>
        )}

        {anytime.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Anytime</p>
            {anytime.map((a) => <ActivityRow key={a.name} activity={a} />)}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 py-4 border-t border-border">
        <Button
          data-testid="confirm-path-button"
          onClick={() => onConfirm(preset.id)}
          className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
        >
          This is me
        </Button>
      </div>
    </div>
  )
}
