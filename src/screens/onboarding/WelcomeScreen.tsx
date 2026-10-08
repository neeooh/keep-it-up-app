import { ArrowRight, X } from 'lucide-react'
import type { Navigate } from '../../App'
import type { Direction } from '../../domain/types'

interface Props {
  navigate: Navigate
  /** Called by App to wire direction selection into the draft. */
  onDirectionChoose?: (direction: Direction) => void
  /** When set, shows an X button to return to the dashboard. */
  onClose?: () => void
}

export function WelcomeScreen({ navigate, onDirectionChoose, onClose }: Props) {
  function choose(direction: Direction) {
    onDirectionChoose?.(direction)
    navigate('choose-direction')
  }

  return (
    <div
      data-testid="screen-welcome"
      className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center"
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
      <p className="text-sm font-semibold uppercase tracking-wide text-brand">
        Keep It Up
      </p>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        What do you want to work on?
      </h1>

      <p className="mt-4 text-base text-muted-foreground max-w-xs">
        Build something you want to do more consistently, or break a habit you
        want to leave behind.
      </p>

      <div className="mt-10 flex flex-col gap-4 w-full max-w-xs">
        <button
          type="button"
          data-testid="direction-do"
          onClick={() => choose('DO')}
          className="flex items-center justify-between w-full rounded-xl border border-border bg-card px-5 py-4 text-left text-base font-medium text-foreground shadow-sm transition-colors hover:bg-muted active:scale-[0.98]"
        >
          <span>Do something</span>
          <ArrowRight size={18} className="text-muted-foreground" aria-hidden="true" />
        </button>

        <button
          type="button"
          data-testid="direction-avoid"
          onClick={() => choose('AVOID')}
          className="flex items-center justify-between w-full rounded-xl border border-border bg-card px-5 py-4 text-left text-base font-medium text-foreground shadow-sm transition-colors hover:bg-muted active:scale-[0.98]"
        >
          <span>Stop doing something</span>
          <ArrowRight size={18} className="text-muted-foreground" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
