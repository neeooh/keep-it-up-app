/**
 * All screen names in the application.
 *
 * The router in App.tsx uses this discriminated union to determine which
 * screen component to render.
 *
 * The add-commitment screen hides the bottom navigation.
 * Main screens (dashboard → edit-commitment) show it.
 */

export type Screen =
  // ── Creation flow ────────────────────────────────────────────────────────
  | 'add-commitment'
  // ── Main app ─────────────────────────────────────────────────────────────
  | 'dashboard'
  | 'plan'
  | 'active-session'
  | 'history'
  | 'progress'
  | 'weekly-review'
  | 'edit-commitment'
  | 'settings'

/** Screens that hide the bottom navigation bar. */
export const CREATION_SCREENS: Screen[] = [
  'add-commitment',
]

/** Screens that show the persistent bottom navigation bar. */
export const MAIN_SCREENS: Screen[] = [
  'dashboard',
  'plan',
  'active-session',
  'history',
  'progress',
  'weekly-review',
  'edit-commitment',
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
