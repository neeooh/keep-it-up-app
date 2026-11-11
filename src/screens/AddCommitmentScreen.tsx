/**
 * AddCommitmentScreen — single-screen commitment creation.
 *
 * Replaces the old multi-step onboarding wizard with one screen:
 * - Build/Break mode switcher
 * - Composer card (name, frequency, time, reminder, alarm)
 * - Category filter
 * - Suggestion list with inline path exploration
 */

import { X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import type { Navigate } from '../App'

interface Props {
  navigate: Navigate
  /** When set, shows a close (X) button that returns to the dashboard. */
  onClose?: () => void
}

export function AddCommitmentScreen({ onClose }: Props) {
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

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-muted-foreground text-sm">
          Commitment creation screen — coming next.
        </p>
      </div>
    </div>
  )
}
