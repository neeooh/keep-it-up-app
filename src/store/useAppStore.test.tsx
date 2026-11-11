/**
 * Tests for src/store/useAppStore.ts
 *
 * Covers:
 * - loadState: returns EMPTY_STATE for missing key, corrupt JSON, wrong shape
 * - loadState: correctly deserialises a valid stored state
 * - saveState: serialises state to localStorage under the correct key
 * - Serialisation round-trip: save then load returns equivalent state
 * - addCommitment: appends a new commitment
 * - updateCommitment: replaces an existing commitment by id
 * - updateCommitment: does nothing for an unknown id
 * - deleteCommitment: removes the commitment and all its sessions
 * - addSession: appends a new session
 * - Context: useAppStore throws outside AppStoreProvider
 * - Context: two consumers share the same state
 */

import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import {
  AppStoreProvider,
  EMPTY_STATE,
  STORAGE_KEY,
  loadState,
  saveState,
  useAppStore,
} from './useAppStore'
import type { Commitment, Session } from '../domain/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeCommitment(id: string): Commitment {
  return {
    id,
    name: `Commitment ${id}`,
    activities: [
      {
        id: `act-${id}`,
        name: 'Running',
        direction: 'DO',
        measurements: [{ type: 'distance', unit: 'km', target: 5 }],
        frequency: '3x_week',
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
  }
}

function makeSession(id: string, commitmentId: string): Session {
  return {
    id,
    commitmentId,
    completedAt: '2026-10-05T10:00:00.000Z',
    results: [
      {
        activityId: `act-${commitmentId}`,
        measurements: { distance: 5 },
      },
    ],
  }
}

// ─── Provider wrapper for renderHook ──────────────────────────────────────────

function wrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider>{children}</AppStoreProvider>
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

// ─── loadState ────────────────────────────────────────────────────────────────

describe('loadState', () => {
  it('returns EMPTY_STATE when localStorage has no entry', () => {
    expect(loadState()).toEqual(EMPTY_STATE)
  })

  it('returns EMPTY_STATE for corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json}')
    expect(loadState()).toEqual(EMPTY_STATE)
  })

  it('returns EMPTY_STATE when stored value is not an object', () => {
    localStorage.setItem(STORAGE_KEY, '"just a string"')
    expect(loadState()).toEqual(EMPTY_STATE)
  })

  it('returns EMPTY_STATE when commitments field is missing', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions: [] }))
    expect(loadState()).toEqual(EMPTY_STATE)
  })

  it('returns EMPTY_STATE when sessions field is missing', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ commitments: [] }))
    expect(loadState()).toEqual(EMPTY_STATE)
  })

  it('returns EMPTY_STATE when commitments is not an array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ commitments: {}, sessions: [] }))
    expect(loadState()).toEqual(EMPTY_STATE)
  })

  it('returns EMPTY_STATE when sessions is not an array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ commitments: [], sessions: 'bad' }))
    expect(loadState()).toEqual(EMPTY_STATE)
  })

  it('correctly deserialises a valid stored state', () => {
    const stored = {
      commitments: [makeCommitment('r1')],
      sessions: [makeSession('s1', 'r1')],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    expect(loadState()).toEqual(stored)
  })

  it('returns EMPTY_STATE for a null stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'null')
    expect(loadState()).toEqual(EMPTY_STATE)
  })
})

// ─── saveState ────────────────────────────────────────────────────────────────

describe('saveState', () => {
  it('writes the state to localStorage under the correct key', () => {
    const state = { commitments: [makeCommitment('r1')], sessions: [] }
    saveState(state)
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toEqual(state)
  })

  it('overwrites a previously stored state', () => {
    saveState({ commitments: [makeCommitment('r1')], sessions: [] })
    saveState({ commitments: [], sessions: [] })
    expect(loadState()).toEqual(EMPTY_STATE)
  })
})

// ─── Serialisation round-trip ─────────────────────────────────────────────────

describe('serialisation round-trip', () => {
  it('save then load returns equivalent state', () => {
    const state = {
      commitments: [makeCommitment('r1'), makeCommitment('r2')],
      sessions: [makeSession('s1', 'r1'), makeSession('s2', 'r2')],
    }
    saveState(state)
    expect(loadState()).toEqual(state)
  })

  it('round-trips EMPTY_STATE without modification', () => {
    saveState(EMPTY_STATE)
    expect(loadState()).toEqual(EMPTY_STATE)
  })
})

// ─── useAppStore — context safety ─────────────────────────────────────────────

describe('useAppStore — context', () => {
  it('throws when used outside AppStoreProvider', () => {
    // Suppress React error boundary output in test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useAppStore())).toThrow(
      'useAppStore must be used within an AppStoreProvider',
    )
    spy.mockRestore()
  })
})

// ─── useAppStore — addCommitment ─────────────────────────────────────────────────

describe('useAppStore — addCommitment', () => {
  it('appends a new commitment to state', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
    })

    expect(result.current.state.commitments).toHaveLength(1)
    expect(result.current.state.commitments[0]!.id).toBe('r1')
  })

  it('appends multiple commitments in order', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
      result.current.addCommitment(makeCommitment('r2'))
    })

    expect(result.current.state.commitments).toHaveLength(2)
    expect(result.current.state.commitments[0]!.id).toBe('r1')
    expect(result.current.state.commitments[1]!.id).toBe('r2')
  })

  it('does not affect existing sessions', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ commitments: [], sessions: [makeSession('s1', 'r-existing')] }),
    )
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
    })

    expect(result.current.state.sessions).toHaveLength(1)
  })

  it('persists the new commitment to localStorage', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
    })

    const persisted = loadState()
    expect(persisted.commitments).toHaveLength(1)
    expect(persisted.commitments[0]!.id).toBe('r1')
  })
})

// ─── useAppStore — updateCommitment ──────────────────────────────────────────────

describe('useAppStore — updateCommitment', () => {
  it('replaces an existing commitment by id', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
    })

    const updated: Commitment = { ...makeCommitment('r1'), name: 'Updated Name' }

    act(() => {
      result.current.updateCommitment(updated)
    })

    expect(result.current.state.commitments).toHaveLength(1)
    expect(result.current.state.commitments[0]!.name).toBe('Updated Name')
  })

  it('does not change the number of commitments', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
      result.current.addCommitment(makeCommitment('r2'))
    })

    act(() => {
      result.current.updateCommitment({ ...makeCommitment('r1'), name: 'Changed' })
    })

    expect(result.current.state.commitments).toHaveLength(2)
  })

  it('only updates the matching commitment, leaving others unchanged', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
      result.current.addCommitment(makeCommitment('r2'))
    })

    act(() => {
      result.current.updateCommitment({ ...makeCommitment('r1'), name: 'Changed' })
    })

    expect(result.current.state.commitments[1]!.name).toBe('Commitment r2')
  })

  it('does nothing when the id does not exist', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
    })

    act(() => {
      result.current.updateCommitment(makeCommitment('does-not-exist'))
    })

    expect(result.current.state.commitments).toHaveLength(1)
    expect(result.current.state.commitments[0]!.id).toBe('r1')
  })

  it('persists the updated commitment to localStorage', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
    })

    act(() => {
      result.current.updateCommitment({ ...makeCommitment('r1'), name: 'Persisted' })
    })

    expect(loadState().commitments[0]!.name).toBe('Persisted')
  })
})

// ─── useAppStore — deleteCommitment ──────────────────────────────────────────────

describe('useAppStore — deleteCommitment', () => {
  it('removes the commitment with the given id', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
      result.current.addCommitment(makeCommitment('r2'))
    })

    act(() => {
      result.current.deleteCommitment('r1')
    })

    expect(result.current.state.commitments).toHaveLength(1)
    expect(result.current.state.commitments[0]!.id).toBe('r2')
  })

  it('removes all sessions that belong to the deleted commitment', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
      result.current.addSession(makeSession('s1', 'r1'))
      result.current.addSession(makeSession('s2', 'r1'))
      result.current.addSession(makeSession('s3', 'r2')) // different commitment
    })

    act(() => {
      result.current.deleteCommitment('r1')
    })

    expect(result.current.state.sessions).toHaveLength(1)
    expect(result.current.state.sessions[0]!.id).toBe('s3')
  })

  it('leaves other commitments and sessions intact', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
      result.current.addCommitment(makeCommitment('r2'))
      result.current.addSession(makeSession('s2', 'r2'))
    })

    act(() => {
      result.current.deleteCommitment('r1')
    })

    expect(result.current.state.commitments[0]!.id).toBe('r2')
    expect(result.current.state.sessions[0]!.id).toBe('s2')
  })

  it('does nothing when the id does not exist', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
    })

    act(() => {
      result.current.deleteCommitment('does-not-exist')
    })

    expect(result.current.state.commitments).toHaveLength(1)
  })

  it('persists the deletion to localStorage', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
    })

    act(() => {
      result.current.deleteCommitment('r1')
    })

    expect(loadState().commitments).toHaveLength(0)
  })
})

// ─── useAppStore — addSession ─────────────────────────────────────────────────

describe('useAppStore — addSession', () => {
  it('appends a new session to state', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addSession(makeSession('s1', 'r1'))
    })

    expect(result.current.state.sessions).toHaveLength(1)
    expect(result.current.state.sessions[0]!.id).toBe('s1')
  })

  it('appends multiple sessions in order', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addSession(makeSession('s1', 'r1'))
      result.current.addSession(makeSession('s2', 'r1'))
    })

    expect(result.current.state.sessions).toHaveLength(2)
    expect(result.current.state.sessions[0]!.id).toBe('s1')
    expect(result.current.state.sessions[1]!.id).toBe('s2')
  })

  it('does not affect existing commitments', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addCommitment(makeCommitment('r1'))
      result.current.addSession(makeSession('s1', 'r1'))
    })

    expect(result.current.state.commitments).toHaveLength(1)
  })

  it('persists the new session to localStorage', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })

    act(() => {
      result.current.addSession(makeSession('s1', 'r1'))
    })

    const persisted = loadState()
    expect(persisted.sessions).toHaveLength(1)
    expect(persisted.sessions[0]!.id).toBe('s1')
  })
})

// ─── Initial load from localStorage ──────────────────────────────────────────

describe('useAppStore — initial load', () => {
  it('initialises state from an existing localStorage entry', () => {
    const stored = {
      commitments: [makeCommitment('r1')],
      sessions: [makeSession('s1', 'r1')],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const { result } = renderHook(() => useAppStore(), { wrapper })

    expect(result.current.state.commitments).toHaveLength(1)
    expect(result.current.state.commitments[0]!.id).toBe('r1')
    expect(result.current.state.sessions).toHaveLength(1)
  })

  it('falls back to empty state when localStorage is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, 'not json at all {{{{')

    const { result } = renderHook(() => useAppStore(), { wrapper })

    expect(result.current.state).toEqual(EMPTY_STATE)
  })
})
