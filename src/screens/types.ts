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
  | 'configure-activity'
  | 'set-frequency'
  | 'plan-review'
  | 'path-preview'
  // ── Main app ─────────────────────────────────────────────────────────────
  | 'dashboard'
  | 'plan'
  | 'active-session'
  | 'history'
  | 'progress'
  | 'weekly-review'
  | 'edit-routine'
  | 'settings'

/** Screens that belong to the onboarding flow (no bottom nav). */
export const ONBOARDING_SCREENS: Screen[] = [
  'welcome',
  'choose-direction',
  'configure-activity',
  'set-frequency',
  'plan-review',
  'path-preview',
]

/** Screens that show the persistent bottom navigation bar. */
export const MAIN_SCREENS: Screen[] = [
  'dashboard',
  'plan',
  'active-session',
  'history',
  'progress',
  'weekly-review',
  'edit-routine',
  'settings',
]

/** Bottom nav tabs (subset of main screens with labels and icon names). */
export const NAV_TABS = [
  { screen: 'dashboard' as Screen, label: 'Today' },
  { screen: 'plan' as Screen, label: 'Plan' },
  { screen: 'progress' as Screen, label: 'Progress' },
  { screen: 'history' as Screen, label: 'History' },
] as const

export type NavTab = (typeof NAV_TABS)[number]
