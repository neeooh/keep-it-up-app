/**
 * Shared test fixtures for screen tests.
 *
 * Provides mock routines, sessions, and helper functions to set up
 * localStorage state for rendering tests.
 */

import type { AppState, Routine, Session } from '../../domain/types'
import { AppStoreProvider, STORAGE_KEY } from '../../store/useAppStore'
import type { ReactNode } from 'react'

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Return an ISO date string for N days ago. */
export function daysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString()
}

/** Return the Monday of the current week as YYYY-MM-DD. */
export function thisMonday(): string {
  const d = new Date()
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

export const STRENGTH_ROUTINE: Routine = {
  id: 'routine-strength',
  name: 'Strength Training',
  createdAt: daysAgo(30),
  activities: [
    {
      id: 'act-bench',
      name: 'Bench Press',
      direction: 'DO',
      measurements: [
        { type: 'sets', target: 3 },
        { type: 'reps', target: 8 },
        { type: 'weight', unit: 'kg' },
      ],
      frequency: '3x_week',
    },
  ],
}

export const RUNNING_ROUTINE: Routine = {
  id: 'routine-running',
  name: 'Running',
  createdAt: daysAgo(30),
  activities: [
    {
      id: 'act-run',
      name: 'Running',
      direction: 'DO',
      measurements: [
        { type: 'distance', unit: 'km', target: 5 },
        { type: 'duration', unit: 'min', target: 30 },
      ],
      frequency: '2x_week',
    },
  ],
}

export const AVOID_ROUTINE: Routine = {
  id: 'routine-no-fast-food',
  name: 'No Fast Food',
  createdAt: daysAgo(30),
  activities: [
    {
      id: 'act-no-fast-food',
      name: 'No Fast Food',
      direction: 'AVOID',
      measurements: [],
      frequency: 'daily',
    },
  ],
}

export function makeStrengthSession(
  routineId: string,
  activityId: string,
  completedAt: string,
  weight: number,
  reps: number,
): Session {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    routineId,
    completedAt,
    results: [
      {
        activityId,
        measurements: {},
        sets: [
          { weight, reps },
          { weight, reps },
          { weight, reps },
        ],
      },
    ],
  }
}

export function makeRunningSession(
  routineId: string,
  activityId: string,
  completedAt: string,
  distance: number,
  duration: number,
): Session {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    routineId,
    completedAt,
    results: [
      {
        activityId,
        measurements: { distance, duration },
      },
    ],
  }
}

export function makeAvoidSession(
  routineId: string,
  activityId: string,
  completedAt: string,
  stayedOnTrack: boolean,
): Session {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    routineId,
    completedAt,
    results: [
      {
        activityId,
        measurements: {},
        stayedOnTrack,
      },
    ],
  }
}

// ─── localStorage setup ───────────────────────────────────────────────────────

export function seedStore(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearStore(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ─── Provider wrapper for render() ────────────────────────────────────────────

/**
 * Wraps children in AppStoreProvider.
 * Call seedStore() BEFORE render() so the provider reads the seeded data.
 */
export function StoreWrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider>{children}</AppStoreProvider>
}
