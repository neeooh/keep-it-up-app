/**
 * UndoToast — fixed-position bar that appears after completing a commitment.
 *
 * Shows "Commitment completed" with an Undo button. Auto-dismisses after
 * 5 seconds with a shrinking progress bar. Tapping Undo reverses the
 * completion. Accessible via role="status" and aria-live="polite".
 */

import { useEffect, useState } from 'react'
import { Undo2 } from 'lucide-react'

const DURATION_MS = 5000

interface Props {
  /** The name of the completed commitment. */
  commitmentName: string
  /** Called when the user taps Undo. */
  onUndo: () => void
  /** Called when the toast auto-dismisses (no undo). */
  onDismiss: () => void
}

export function UndoToast({ commitmentName, onUndo, onDismiss }: Props) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      // Allow exit animation before dismissing
      setTimeout(onDismiss, 300)
    }, DURATION_MS)

    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      data-testid="undo-toast"
      role="status"
      aria-live="polite"
      className={[
        'fixed bottom-16 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-md',
        'rounded-xl bg-foreground text-background shadow-lg overflow-hidden',
        'transition-all duration-300',
        exiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0',
      ].join(' ')}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-medium truncate">
          {commitmentName} completed
        </p>
        <button
          type="button"
          data-testid="undo-button"
          onClick={onUndo}
          className="flex items-center gap-1.5 shrink-0 ml-3 px-3 py-1 rounded-lg bg-background/15 text-sm font-medium hover:bg-background/25 transition-colors"
        >
          <Undo2 size={14} aria-hidden="true" />
          Undo
        </button>
      </div>

      {/* Shrinking progress bar */}
      <div
        className="h-0.5 bg-background/30 origin-left"
        style={{
          animation: `shrink-bar ${DURATION_MS}ms linear forwards`,
        }}
      />
    </div>
  )
}
