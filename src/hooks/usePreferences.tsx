/**
 * usePreferences — lightweight user preferences store.
 *
 * Stores UI preferences (user name, etc.) in localStorage under a
 * dedicated key. Separate from the domain app store because preferences
 * are a UI/personalisation concern, not application data.
 *
 * Provides a React Context so any component can read or update
 * preferences without prop drilling.
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

export interface Preferences {
  /** The user's display name. Used in the dashboard greeting. */
  userName: string
}

export interface PreferencesContextValue {
  preferences: Preferences
  updatePreferences: (patch: Partial<Preferences>) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const PREFERENCES_STORAGE_KEY = 'keep-it-up:preferences'

export const DEFAULT_PREFERENCES: Preferences = {
  userName: '',
}

// ─── Serialisation ────────────────────────────────────────────────────────────

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (raw === null) return DEFAULT_PREFERENCES
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_PREFERENCES
    return {
      ...DEFAULT_PREFERENCES,
      ...(parsed as Partial<Preferences>),
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

function savePreferences(prefs: Preferences): void {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Storage unavailable.
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)

  useEffect(() => {
    savePreferences(preferences)
  }, [preferences])

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }))
  }, [])

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, updatePreferences }),
    [preferences, updatePreferences],
  )

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext)
  if (ctx === null) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return ctx
}
