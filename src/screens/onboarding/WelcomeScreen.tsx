import { Target, ShieldX, ArrowRight, X } from 'lucide-react'
import type { Navigate } from '../../App'
import type { Direction } from '../../domain/types'

interface Props {
  navigate: Navigate
  /** Called by App to wire direction selection into the draft. */
  onDirectionChoose?: (direction: Direction) => void
  /** When set, shows an X button to return to the dashboard.
   *  Also signals this is the "add routine" context, not first-use. */
  onClose?: () => void
}

export function WelcomeScreen({ navigate, onDirectionChoose, onClose }: Props) {
  const isAddRoutine = !!onClose

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
    </div>
  )
}
