/**
 * useTheme — theme state management for light/dark mode.
 *
 * A React Context that reads from localStorage on mount, detects the
 * OS colour-scheme preference, and toggles the `.dark` class on the
 * `<html>` element. It also updates the `<meta name="theme-color">`
 * tag so the PWA status bar matches the active theme.
 *
 * Separate from the domain app store — theme is a UI concern.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  /** The stored preference: 'light', 'dark', or 'system'. */
  theme: Theme
  /** The effective theme after resolving 'system' via OS preference. */
  resolvedTheme: ResolvedTheme
  /** Toggle between light and dark. Stores an explicit choice. */
  toggleTheme: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const THEME_STORAGE_KEY = 'keep-it-up:theme'
export const THEME_COLOR_LIGHT = '#FAF9F6'
export const THEME_COLOR_DARK = '#2E2C28'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Private browsing or storage unavailable.
  }
  return 'system'
}

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') return getSystemPrefersDark() ? 'dark' : 'light'
  return theme
}

function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  // Update <meta name="theme-color"> for PWA status bar.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute(
      'content',
      resolved === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT,
    )
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  const resolved = resolveTheme(theme)

  // Apply the .dark class and meta theme-color whenever the resolved theme changes.
  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  // Listen for OS colour-scheme changes so 'system' mode stays in sync.
  useEffect(() => {
    if (theme !== 'system') return

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      applyTheme(resolveTheme('system'))
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const currentResolved = resolveTheme(prev)
      const next: ResolvedTheme = currentResolved === 'light' ? 'dark' : 'light'
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        // Storage unavailable.
      }
      return next
    })
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme: resolved, toggleTheme }),
    [theme, resolved, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (ctx === null) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
