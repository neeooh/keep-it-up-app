/**
 * All screen names in the application.
 *
 * The router in App.tsx uses this discriminated union to determine which
 * screen component to render.
 *
 * Onboarding screens (welcome → plan-review) hide the bottom navigation.
 * Main screens (dashboard → edit-routine) show it.
 */

export type Screen =
  // ── Onboarding flow ──────────────────────────────────────────────────────
  | 'welcome'
  | 'choose-direction'
  | 'choose-template'
  | 'configure-activity'
  | 'set-frequency'
  | 'optional-schedule'
  | 'optional-challenge'
  | 'plan-review'
  // ── Main app ─────────────────────────────────────────────────────────────
  | 'dashboard'
  | 'active-session'
  | 'history'
  | 'progress'
  | 'weekly-review'
  | 'edit-routine'

/** Screens that belong to the onboarding flow (no bottom nav). */
export const ONBOARDING_SCREENS: Screen[] = [
  'welcome',
  'choose-direction',
  'choose-template',
  'configure-activity',
  'set-frequency',
  'optional-schedule',
  'optional-challenge',
  'plan-review',
]

/** Screens that show the persistent bottom navigation bar. */
export const MAIN_SCREENS: Screen[] = [
  'dashboard',
  'active-session',
  'history',
  'progress',
  'weekly-review',
  'edit-routine',
]

/** Bottom nav tabs (subset of main screens with labels and icon names). */
export const NAV_TABS = [
  { screen: 'dashboard' as Screen, label: 'Home' },
  { screen: 'history' as Screen, label: 'History' },
  { screen: 'progress' as Screen, label: 'Progress' },
  { screen: 'weekly-review' as Screen, label: 'Review' },
] as const

export type NavTab = (typeof NAV_TABS)[number]
