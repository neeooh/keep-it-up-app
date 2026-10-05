/**
 * useAppStore — the single source of truth for all application state.
 *
 * Reads from localStorage on first render and writes back on every state
 * change.  Exposes typed actions so components never touch localStorage
 * or raw state directly.
 *
 * No external state-management library is used — plain React state is
 * sufficient for a client-only MVP with local persistence.
 */

import { useCallback, useEffect, useState } from 'react'
import type { AppState, Routine, Session } from '../domain/types'

// ─── Storage key ──────────────────────────────────────────────────────────────

export const STORAGE_KEY = 'keep-it-up:state'

// ─── Empty / default state ────────────────────────────────────────────────────

export const EMPTY_STATE: AppState = {
  routines: [],
  sessions: [],
}

// ─── Serialisation helpers ────────────────────────────────────────────────────

/**
 * Attempt to parse the stored JSON into an AppState.
 * Returns EMPTY_STATE on any error (missing key, invalid JSON, wrong shape).
 */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return EMPTY_STATE

    const parsed: unknown = JSON.parse(raw)

    // Basic structural validation — must be an object with the two arrays.
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as Record<string, unknown>)['routines']) ||
      !Array.isArray((parsed as Record<string, unknown>)['sessions'])
    ) {
      return EMPTY_STATE
    }

    return parsed as AppState
  } catch {
    return EMPTY_STATE
  }
}

/**
 * Serialise and persist the given state to localStorage.
 * Silently swaps to EMPTY_STATE if serialisation fails (e.g. quota exceeded).
 */
export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage quota exceeded or private-browsing restriction — ignore.
  }
}

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface AppStore {
  /** The current application state. */
  state: AppState

  /**
   * Add a new routine.
   * The caller is responsible for supplying a unique `id` (e.g. crypto.randomUUID()).
   */
  addRoutine: (routine: Routine) => void

  /**
   * Replace an existing routine by id.
   * Does nothing if no routine with the given id exists.
   */
  updateRoutine: (routine: Routine) => void

  /**
   * Remove a routine and all sessions that belong to it.
   */
  deleteRoutine: (routineId: string) => void

  /**
   * Append a completed session.
   * The caller is responsible for supplying a unique `id`.
   */
  addSession: (session: Session) => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppStore(): AppStore {
  const [state, setState] = useState<AppState>(loadState)

  // Persist to localStorage whenever state changes.
  useEffect(() => {
    saveState(state)
  }, [state])

  const addRoutine = useCallback((routine: Routine) => {
    setState((prev) => ({
      ...prev,
      routines: [...prev.routines, routine],
    }))
  }, [])

  const updateRoutine = useCallback((routine: Routine) => {
    setState((prev) => ({
      ...prev,
      routines: prev.routines.map((r) => (r.id === routine.id ? routine : r)),
    }))
  }, [])

  const deleteRoutine = useCallback((routineId: string) => {
    setState((prev) => ({
      routines: prev.routines.filter((r) => r.id !== routineId),
      sessions: prev.sessions.filter((s) => s.routineId !== routineId),
    }))
  }, [])

  const addSession = useCallback((session: Session) => {
    setState((prev) => ({
      ...prev,
      sessions: [...prev.sessions, session],
    }))
  }, [])

  return { state, addRoutine, updateRoutine, deleteRoutine, addSession }
}
