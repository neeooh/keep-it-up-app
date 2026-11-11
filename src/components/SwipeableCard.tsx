/**
 * SwipeableCard — horizontal swipe wrapper for commitment cards.
 *
 * Swipe left to reveal Edit and Delete action buttons behind the card.
 * Snap back if the swipe distance is below the threshold.
 *
 * Non-swipe alternative: a three-dot MoreHorizontal button that opens
 * a dropdown with Edit and Delete options. Always accessible for keyboard
 * and assistive technology users.
 */

import { useRef, useState, useCallback } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

const SWIPE_THRESHOLD = 80
const ACTION_WIDTH = 160

interface Props {
  children: React.ReactNode
  /** Called when the user taps Edit. */
  onEdit: () => void
  /** Called when the user confirms Delete. */
  onDelete: () => void
  /** The commitment name for the confirmation dialog. */
  commitmentName: string
}

export function SwipeableCard({ children, onEdit, onDelete, commitmentName }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [offsetX, setOffsetX] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const startXRef = useRef(0)
  const isDraggingRef = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    startXRef.current = e.clientX
    isDraggingRef.current = false
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const dx = e.clientX - startXRef.current
    if (Math.abs(dx) > 5) isDraggingRef.current = true

    if (isOpen) {
      // When already open, allow swiping back (right)
      const newOffset = Math.min(0, Math.max(-ACTION_WIDTH, -ACTION_WIDTH + dx))
      setOffsetX(newOffset)
    } else {
      // Only allow left swipe
      const newOffset = Math.min(0, dx)
      setOffsetX(newOffset)
    }
  }, [isOpen])

  const handlePointerUp = useCallback(() => {
    if (Math.abs(offsetX) > SWIPE_THRESHOLD) {
      setOffsetX(-ACTION_WIDTH)
      setIsOpen(true)
    } else {
      setOffsetX(0)
      setIsOpen(false)
    }
  }, [offsetX])

  const close = useCallback(() => {
    setOffsetX(0)
    setIsOpen(false)
    setMenuOpen(false)
  }, [])

  const handleEdit = useCallback(() => {
    close()
    onEdit()
  }, [close, onEdit])

  const handleDelete = useCallback(() => {
    close()
    setShowConfirm(true)
  }, [close])

  const confirmDelete = useCallback(() => {
    setShowConfirm(false)
    onDelete()
  }, [onDelete])

  return (
    <>
      <div className="relative overflow-hidden rounded-xl" data-testid="swipeable-card">
        {/* Action buttons behind the card */}
        <div className="absolute inset-y-0 right-0 flex" style={{ width: ACTION_WIDTH }}>
          <button
            type="button"
            data-testid="swipe-edit-button"
            onClick={handleEdit}
            className="flex-1 flex items-center justify-center bg-brand text-white"
            aria-label="Edit"
          >
            <Pencil size={18} />
          </button>
          <button
            type="button"
            data-testid="swipe-delete-button"
            onClick={handleDelete}
            className="flex-1 flex items-center justify-center bg-destructive text-white"
            aria-label="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Swipeable card content */}
        <div
          ref={cardRef}
          className="relative bg-background transition-transform duration-200 ease-out touch-pan-y"
          style={{ transform: `translateX(${offsetX}px)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="relative">
            {children}

            {/* Three-dot menu button — always accessible */}
            <div className="absolute top-2 right-2">
              <button
                type="button"
                data-testid="card-menu-button"
                aria-label={`Options for ${commitmentName}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(!menuOpen)
                }}
                className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
              >
                <MoreHorizontal size={16} aria-hidden="true" />
              </button>

              {menuOpen && (
                <div
                  data-testid="card-menu-dropdown"
                  className="absolute right-0 top-full mt-1 z-10 w-36 rounded-lg border border-border bg-card p-1 shadow-lg ring-1 ring-foreground/5"
                >
                  <button
                    type="button"
                    data-testid="menu-edit"
                    onClick={handleEdit}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-surface-muted transition-colors"
                  >
                    <Pencil size={14} aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    data-testid="menu-delete"
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-surface-muted transition-colors"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showConfirm && (
        <div
          data-testid="delete-confirm-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-card rounded-xl p-6 mx-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground">Delete commitment?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This will remove <strong>{commitmentName}</strong> and all its completion history.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                data-testid="delete-cancel"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="delete-confirm"
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-destructive text-white px-4 py-2 text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
