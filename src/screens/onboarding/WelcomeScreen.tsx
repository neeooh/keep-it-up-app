import { Target, ShieldX, ArrowRight, X } from 'lucide-react'
import type { Navigate } from '../../App'
import type { Direction } from '../../domain/types'
import { personaPresets } from '../../domain/templates'
import { usePreferences } from '../../hooks/usePreferences'

interface Props {
  navigate: Navigate
  /** Called by App to wire direction selection into the draft. */
  onDirectionChoose?: (direction: Direction) => void
  /** When set, shows an X button to return to the dashboard.
   *  Also signals this is the "add routine" context, not first-use. */
  onClose?: () => void
  /** Install a persona preset routine bundle by id. */
  onInstallPreset?: (presetId: string) => void
}

export function WelcomeScreen({ navigate, onDirectionChoose, onClose, onInstallPreset }: Props) {
  const isAddRoutine = !!onClose
  const { preferences } = usePreferences()
  const hasPath = !!preferences.chosenPath

  function choose(direction: Direction) {
    onDirectionChoose?.(direction)
    navigate('choose-direction')
  }

  return (
    <div
      data-testid="screen-welcome"
      className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
    >
      {onClose && (
        <button
          type="button"
          data-testid="close-onboarding"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center size-11 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
        >
          <X size={20} aria-hidden="true" />
        </button>
      )}

      {/* ── Brand mark ─────────────────────────────────────────────────── */}
      <p className="text-lg font-bold tracking-tight text-brand">
        Keep It Up
      </p>

      {/* ── Heading and description ────────────────────────────────────── */}
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
        {isAddRoutine ? 'Add a routine' : 'What do you want to work on?'}
      </h1>

      <p className="mt-3 text-base text-muted-foreground max-w-xs">
        {isAddRoutine
          ? 'Choose a direction for your new routine.'
          : 'Build a habit you want to keep, or break one you want to leave behind.'}
      </p>

      {/* ── Choice cards ───────────────────────────────────────────────── */}
      <div className="mt-10 flex flex-col gap-4 w-full max-w-xs">
        <button
          type="button"
          data-testid="direction-do"
          onClick={() => choose('DO')}
          className="flex items-center gap-4 w-full rounded-xl border border-border bg-card px-5 py-4 text-left shadow-sm transition-colors hover:bg-muted active:scale-[0.98]"
        >
          <div className="flex items-center justify-center size-10 rounded-lg bg-brand/10 text-brand shrink-0">
            <Target size={22} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-foreground">Do something</p>
            <p className="text-sm text-muted-foreground">Build a positive habit</p>
          </div>
          <ArrowRight size={18} className="text-muted-foreground shrink-0" aria-hidden="true" />
        </button>

        <button
          type="button"
          data-testid="direction-avoid"
          onClick={() => choose('AVOID')}
          className="flex items-center gap-4 w-full rounded-xl border border-border bg-card px-5 py-4 text-left shadow-sm transition-colors hover:bg-muted active:scale-[0.98]"
        >
          <div className="flex items-center justify-center size-10 rounded-lg bg-muted text-muted-foreground shrink-0">
            <ShieldX size={22} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-foreground">Stop doing something</p>
            <p className="text-sm text-muted-foreground">Break an unwanted habit</p>
          </div>
          <ArrowRight size={18} className="text-muted-foreground shrink-0" aria-hidden="true" />
        </button>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="w-full max-w-xs mt-10 mb-8 flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or try a ready-made routine</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* ── Persona presets — horizontal scroll ────────────────────────── */}
      <div className="w-full">
        <p className="text-xs text-muted-foreground mb-3">
          {hasPath ? 'You are on a path. You can switch in settings.' : 'One tap setup — a complete routine in a second.'}
        </p>
        <div
          className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 snap-x scrollbar-none"
        >
          {personaPresets.map((preset) => {
            const isCurrent = preferences.chosenPath === preset.id
            const isDisabled = hasPath && !isCurrent
            return (
              <button
                key={preset.id}
                type="button"
                data-testid={`welcome-preset-${preset.id}`}
                disabled={isDisabled}
                onClick={() => onInstallPreset?.(preset.id)}
                className={[
                  'flex flex-col items-center justify-center shrink-0 w-28 h-28 rounded-xl border shadow-sm transition-colors snap-start',
                  isCurrent
                    ? 'border-brand bg-brand-light'
                    : isDisabled
                      ? 'border-border bg-card opacity-40 cursor-not-allowed'
                      : 'border-border bg-card hover:bg-muted active:scale-[0.97]',
                ].join(' ')}
              >
                <span className="text-3xl mb-1.5" aria-hidden="true">{preset.emoji}</span>
                <p className={['text-xs font-medium', isCurrent ? 'text-brand' : 'text-foreground'].join(' ')}>{preset.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 px-2 leading-tight">{preset.tagline}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
