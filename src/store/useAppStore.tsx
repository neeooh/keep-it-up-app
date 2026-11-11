/**
 * useAppStore — the single source of truth for all application state.
 *
 * A React Context holds the one state instance. The AppStoreProvider
 * reads from localStorage on mount and writes back on every state
 * change. All components that call useAppStore() share the same state.
 *
 * No external state-management library is used — React Context is
 * sufficient for a client-only MVP with local persistence.
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
import type { AppState, Commitment, Session } from '../domain/types'

// ─── Storage key ──────────────────────────────────────────────────────────────

/** New key for v0.3. Old data under 'keep-it-up:state' is not loaded. */
export const STORAGE_KEY = 'keep-it-up:v3:state'

// ─── Empty / default state ────────────────────────────────────────────────────

export const EMPTY_STATE: AppState = {
  commitments: [],
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
      !Array.isArray((parsed as Record<string, unknown>)['commitments']) ||
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

// ─── Store interface ──────────────────────────────────────────────────────────

export interface AppStore {
  /** The current application state. */
  state: AppState

  /**
   * Add a new commitment.
   * The caller is responsible for supplying a unique `id` (e.g. crypto.randomUUID()).
   */
  addCommitment: (commitment: Commitment) => void

  /**
   * Replace an existing commitment by id.
   * Does nothing if no commitment with the given id exists.
   */
  updateCommitment: (commitment: Commitment) => void

  /**
   * Remove a commitment and all sessions that belong to it.
   */
  deleteCommitment: (commitmentId: string) => void

  /**
   * Append a completed session.
   * The caller is responsible for supplying a unique `id`.
   */
  addSession: (session: Session) => void

  /**
   * Remove a session by id.
   */
  deleteSession: (sessionId: string) => void

  /**
   * Replace an existing session by id.
   * Does nothing if no session with the given id exists.
   */
  updateSession: (session: Session) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppStoreContext = createContext<AppStore | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)

  // Persist to localStorage whenever state changes.
  useEffect(() => {
    saveState(state)
  }, [state])

  const addCommitment = useCallback((commitment: Commitment) => {
    setState((prev) => ({
      ...prev,
      commitments: [...prev.commitments, commitment],
    }))
  }, [])

  const updateCommitment = useCallback((commitment: Commitment) => {
    setState((prev) => ({
      ...prev,
      commitments: prev.commitments.map((c) => (c.id === commitment.id ? commitment : c)),
    }))
  }, [])

  const deleteCommitment = useCallback((commitmentId: string) => {
    setState((prev) => ({
      commitments: prev.commitments.filter((c) => c.id !== commitmentId),
      sessions: prev.sessions.filter((s) => s.commitmentId !== commitmentId),
    }))
  }, [])

  const addSession = useCallback((session: Session) => {
    setState((prev) => ({
      ...prev,
      sessions: [...prev.sessions, session],
    }))
  }, [])

  const deleteSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== sessionId),
    }))
  }, [])

  const updateSession = useCallback((session: Session) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === session.id ? session : s)),
    }))
  }, [])

  const store = useMemo<AppStore>(
    () => ({ state, addCommitment, updateCommitment, deleteCommitment, addSession, deleteSession, updateSession }),
    [state, addCommitment, updateCommitment, deleteCommitment, addSession, deleteSession, updateSession],
  )

  return (
    <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppStore(): AppStore {
  const store = useContext(AppStoreContext)
  if (store === null) {
    throw new Error('useAppStore must be used within an AppStoreProvider')
  }
  return store
}
