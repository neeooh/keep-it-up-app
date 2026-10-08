/**
 * ActivityIcon — maps activity names to Lucide icons.
 *
 * Uses keyword matching against the activity name to pick a relevant icon.
 * Falls back to a generic circle-dot for unrecognized activities.
 *
 * Used on the Today screen, History screen, and onboarding template cards.
 */

import {
  Dumbbell,
  Footprints,
  Bike,
  Waves,
  PersonStanding,
  Wind,
  BookOpen,
  GraduationCap,
  Palette,
  Brain,
  PenLine,
  Sunrise,
  Moon,
  TreePine,
  Cigarette,
  UtensilsCrossed,
  Smartphone,
  Wine,
  CircleDot,
  type LucideIcon,
} from 'lucide-react'

// ─── Icon mapping ─────────────────────────────────────────────────────────────

/**
 * Ordered list of keyword → icon pairs. First match wins.
 * Keywords are matched case-insensitively against the activity name.
 */
const ICON_MAP: [RegExp, LucideIcon][] = [
  [/strength|workout|weight|bench|squat|deadlift|press/i, Dumbbell],
  [/run|jog/i, Footprints],
  [/walk/i, Footprints],
  [/cycl|bike|bik/i, Bike],
  [/swim/i, Waves],
  [/yoga|stretch/i, PersonStanding],
  [/meditat|breath|mindful/i, Wind],
  [/read/i, BookOpen],
  [/learn|study|course/i, GraduationCap],
  [/practice|skill|music|instrument|draw|paint/i, Palette],
  [/journal|diary|writ/i, PenLine],
  [/brain|puzzle|think/i, Brain],
  [/morning|wake/i, Sunrise],
  [/evening|night|sleep/i, Moon],
  [/outside|outdoor|nature|hike/i, TreePine],
  [/smok|cigarette|vape/i, Cigarette],
  [/food|eat|diet|fast.?food|junk/i, UtensilsCrossed],
  [/social.?media|phone|screen|scroll/i, Smartphone],
  [/alcohol|drink|beer|wine/i, Wine],
]

function iconForName(name: string): LucideIcon {
  for (const [pattern, icon] of ICON_MAP) {
    if (pattern.test(name)) return icon
  }
  return CircleDot
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  /** The activity or template name to match against. */
  name: string
  /** Size in pixels. Defaults to 24. */
  size?: number
  /** Additional CSS classes. */
  className?: string
}

export function ActivityIcon({ name, size = 24, className = '' }: Props) {
  const Icon = iconForName(name)
  return (
    <Icon
      size={size}
      aria-hidden="true"
      className={`text-muted-foreground/60 shrink-0 ${className}`}
    />
  )
}
