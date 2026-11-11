/**
 * ConfettiCelebration — emoji confetti burst animation.
 *
 * Renders 12 emoji characters that pop outward from the center of the
 * trigger element and fade out. Uses CSS keyframes only — no canvas,
 * no external libraries.
 *
 * Respects prefers-reduced-motion: skips the animation entirely.
 * Auto-unmounts after the animation completes (~800ms).
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const EMOJIS = ['🎉', '✨', '🌟', '💪', '🔥', '⭐', '🎉', '✨', '🌟', '💪', '🔥', '⭐']

/** Generate a random value between min and max. */
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

interface Props {
  /** The bounding rect of the element that triggered the celebration. */
  origin: { x: number; y: number }
  /** Called when the animation completes and the component should unmount. */
  onComplete: () => void
}

export function ConfettiCelebration({ origin, onComplete }: Props) {
  const [visible, setVisible] = useState(true)

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete()
      return
    }
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete()
    }, 900)
    return () => clearTimeout(timer)
  }, [prefersReducedMotion, onComplete])

  if (prefersReducedMotion || !visible) return null

  return createPortal(
    <div
      data-testid="confetti-celebration"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100]"
    >
      {EMOJIS.map((emoji, i) => {
        const angle = (360 / EMOJIS.length) * i + rand(-15, 15)
        const distance = rand(60, 140)
        const rotation = rand(-180, 180)
        const delay = rand(0, 100)

        const rad = (angle * Math.PI) / 180
        const tx = Math.cos(rad) * distance
        const ty = Math.sin(rad) * distance

        return (
          <span
            key={i}
            className="absolute text-xl"
            style={{
              left: origin.x,
              top: origin.y,
              animation: `confetti-burst 800ms ${delay}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
              // Pass trajectory as CSS custom properties
              ['--tx' as string]: `${tx}px`,
              ['--ty' as string]: `${ty}px`,
              ['--rot' as string]: `${rotation}deg`,
            }}
          >
            {emoji}
          </span>
        )
      })}
    </div>,
    document.body,
  )
}
