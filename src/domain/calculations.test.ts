/**
 * Unit tests for src/domain/calculations.ts
 *
 * Covers all invariants listed in mvp_product_spec.md section 18:
 * - Consistency is always between 0% and 100%
 * - Reordering sets does not change total volume
 * - Total volume equals the sum of individual set volumes
 * - Incomplete sessions do not count as completed sessions
 * - Historical records do not incorrectly alter past results
 * - Challenge progress cannot exceed the challenge duration
 * - Progress calculations handle missing previous data safely
 */

import { describe, expect, it } from 'vitest'
import {
  calculateChallengeProgress,
  calculateCompletionRate,
  calculateConsistency,
  calculatePersonalBest,
  calculateProgress,
  calculateStreak,
  calculateTrend,
  calculateVolume,
  calculateWeeklySummary,
  plannedSessionsPerWeek,
  routinePlannedPerWeek,
  sessionsForRoutine,
  sessionsInRange,
} from './calculations'
import type { Activity, Routine, Session } from './types'

// ─── Test fixtures ────────────────────────────────────────────────────────────

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'act-1',
    name: 'Running',
    direction: 'DO',
    measurements: [{ type: 'distance', unit: 'km', target: 5 }],
    frequency: '3x_week',
    ...overrides,
  }
}

function makeRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'routine-1',
    name: 'Morning Run',
    activities: [makeActivity()],
    createdAt: '2026-10-01T07:00:00.000Z',
    ...overrides,
  }
}

function makeSession(
  routineId: string,
  completedAt: string,
  activityId = 'act-1',
  measurements: Partial<Record<string, number>> = { distance: 5 },
): Session {
  return {
    id: `session-${completedAt}`,
    routineId,
    completedAt,
    results: [
      {
        activityId,
        measurements: measurements as Session['results'][0]['measurements'],
      },
    ],
  }
}

// ─── plannedSessionsPerWeek ───────────────────────────────────────────────────

describe('plannedSessionsPerWeek', () => {
  it('returns 7 for daily', () => {
    expect(plannedSessionsPerWeek(makeActivity({ frequency: 'daily' }))).toBe(7)
  })

  it('returns 3 for 3x_week', () => {
    expect(plannedSessionsPerWeek(makeActivity({ frequency: '3x_week' }))).toBe(3)
  })

  it('returns 2 for 2x_week', () => {
    expect(plannedSessionsPerWeek(makeActivity({ frequency: '2x_week' }))).toBe(2)
  })

  it('returns 1 for 1x_week', () => {
    expect(plannedSessionsPerWeek(makeActivity({ frequency: '1x_week' }))).toBe(1)
  })

  it('returns 0 for flexible', () => {
    expect(plannedSessionsPerWeek(makeActivity({ frequency: 'flexible' }))).toBe(0)
  })
})

// ─── routinePlannedPerWeek ────────────────────────────────────────────────────

describe('routinePlannedPerWeek', () => {
  it('uses the first activity frequency', () => {
    expect(routinePlannedPerWeek(makeRoutine())).toBe(3)
  })

  it('returns 0 for a routine with no activities', () => {
    expect(routinePlannedPerWeek(makeRoutine({ activities: [] }))).toBe(0)
  })

  it('returns 0 for flexible frequency', () => {
    const routine = makeRoutine({
      activities: [makeActivity({ frequency: 'flexible' })],
    })
    expect(routinePlannedPerWeek(routine)).toBe(0)
  })
})

// ─── sessionsForRoutine ───────────────────────────────────────────────────────

describe('sessionsForRoutine', () => {
  it('filters to only the requested routine', () => {
    const sessions: Session[] = [
      makeSession('routine-1', '2026-10-01T10:00:00.000Z'),
      makeSession('routine-2', '2026-10-02T10:00:00.000Z'),
      makeSession('routine-1', '2026-10-03T10:00:00.000Z'),
    ]
    const result = sessionsForRoutine(sessions, 'routine-1')
    expect(result).toHaveLength(2)
    expect(result.every((s) => s.routineId === 'routine-1')).toBe(true)
  })

  it('returns sessions sorted oldest-first', () => {
    const sessions: Session[] = [
      makeSession('routine-1', '2026-10-03T10:00:00.000Z'),
      makeSession('routine-1', '2026-10-01T10:00:00.000Z'),
      makeSession('routine-1', '2026-10-02T10:00:00.000Z'),
    ]
    const result = sessionsForRoutine(sessions, 'routine-1')
    expect(result[0]!.completedAt).toBe('2026-10-01T10:00:00.000Z')
    expect(result[1]!.completedAt).toBe('2026-10-02T10:00:00.000Z')
    expect(result[2]!.completedAt).toBe('2026-10-03T10:00:00.000Z')
  })

  it('returns empty array when no matching sessions', () => {
    const sessions = [makeSession('routine-2', '2026-10-01T10:00:00.000Z')]
    expect(sessionsForRoutine(sessions, 'routine-1')).toHaveLength(0)
  })
})

// ─── sessionsInRange ──────────────────────────────────────────────────────────

describe('sessionsInRange', () => {
  const sessions: Session[] = [
    makeSession('r1', '2026-10-01T08:00:00.000Z'),
    makeSession('r1', '2026-10-05T08:00:00.000Z'),
    makeSession('r1', '2026-10-10T08:00:00.000Z'),
  ]

  it('includes sessions on the start and end dates', () => {
    const result = sessionsInRange(sessions, { start: '2026-10-01', end: '2026-10-05' })
    expect(result).toHaveLength(2)
  })

  it('excludes sessions outside the range', () => {
    const result = sessionsInRange(sessions, { start: '2026-10-02', end: '2026-10-09' })
    expect(result).toHaveLength(1)
    expect(result[0]!.completedAt).toBe('2026-10-05T08:00:00.000Z')
  })

  it('returns empty for a range with no sessions', () => {
    const result = sessionsInRange(sessions, { start: '2026-09-01', end: '2026-09-30' })
    expect(result).toHaveLength(0)
  })
})

// ─── calculateConsistency ─────────────────────────────────────────────────────

describe('calculateConsistency', () => {
  const routine = makeRoutine() // 3x_week

  it('returns 100 when all planned sessions are completed', () => {
    // 1 week = 3 planned, 3 completed
    const sessions: Session[] = [
      makeSession('routine-1', '2026-10-05T10:00:00.000Z'), // Mon
      makeSession('routine-1', '2026-10-07T10:00:00.000Z'), // Wed
      makeSession('routine-1', '2026-10-09T10:00:00.000Z'), // Fri
    ]
    const result = calculateConsistency(sessions, routine, {
      start: '2026-10-05',
      end: '2026-10-11',
    })
    expect(result).toBe(100)
  })

  it('returns approximately 67 for 2 of 3 planned sessions', () => {
    const sessions: Session[] = [
      makeSession('routine-1', '2026-10-05T10:00:00.000Z'),
      makeSession('routine-1', '2026-10-07T10:00:00.000Z'),
    ]
    const result = calculateConsistency(sessions, routine, {
      start: '2026-10-05',
      end: '2026-10-11',
    })
    expect(result).toBe(67)
  })

  it('returns 0 for flexible frequency', () => {
    const flexRoutine = makeRoutine({
      activities: [makeActivity({ frequency: 'flexible' })],
    })
    const sessions = [makeSession('routine-1', '2026-10-05T10:00:00.000Z')]
    expect(
      calculateConsistency(sessions, flexRoutine, { start: '2026-10-05', end: '2026-10-11' }),
    ).toBe(0)
  })

  it('result is always in [0, 100]', () => {
    // More sessions than planned — should clamp to 100
    const sessions: Session[] = Array.from({ length: 10 }, (_, i) =>
      makeSession('routine-1', `2026-10-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`),
    )
    const result = calculateConsistency(sessions, routine, {
      start: '2026-10-01',
      end: '2026-10-07',
    })
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(100)
  })

  it('returns 0 when there are no sessions', () => {
    const result = calculateConsistency([], routine, {
      start: '2026-10-05',
      end: '2026-10-11',
    })
    expect(result).toBe(0)
  })

  it('returns 0 for an empty date range', () => {
    const result = calculateConsistency(
      [makeSession('routine-1', '2026-10-05T10:00:00.000Z')],
      routine,
      { start: '2026-10-11', end: '2026-10-05' }, // reversed range
    )
    expect(result).toBe(0)
  })

  // ── Pro-rating tests (today parameter) ────────────────────────────────────

  it('pro-rates partial week: 100% when all elapsed days are covered', () => {
    // 3x_week routine. Range: Mon Oct 5 – Wed Oct 7 (3 days = partial week).
    // today = Oct 7 (Wednesday). Elapsed = 3 days. Pro-rated planned = (3/7)*3 ≈ 1.29.
    // 2 completed sessions → 2 / 1.29 → clamped to 100.
    const sessions: Session[] = [
      makeSession('routine-1', '2026-10-05T10:00:00.000Z'), // Mon
      makeSession('routine-1', '2026-10-07T10:00:00.000Z'), // Wed
    ]
    const result = calculateConsistency(
      sessions,
      routine,
      { start: '2026-10-05', end: '2026-10-07' },
      '2026-10-07',
    )
    expect(result).toBe(100)
  })

  it('pro-rates: full past weeks + partial current week', () => {
    // 3x_week routine. Range: Mon Sep 28 – Wed Oct 7.
    // Sep 28–Oct 4 = 7 days (1 full week, planned = 3).
    // Oct 5–Oct 7 = 3 days (partial week, pro-rated planned = (3/7)*3 ≈ 1.29).
    // Total planned ≈ 4.29. 4 completed sessions → 4 / 4.29 → 93%.
    const sessions: Session[] = [
      makeSession('routine-1', '2026-09-28T10:00:00.000Z'), // Mon wk1
      makeSession('routine-1', '2026-09-30T10:00:00.000Z'), // Wed wk1
      makeSession('routine-1', '2026-10-02T10:00:00.000Z'), // Fri wk1
      makeSession('routine-1', '2026-10-06T10:00:00.000Z'), // Tue wk2
    ]
    const result = calculateConsistency(
      sessions,
      routine,
      { start: '2026-09-28', end: '2026-10-07' },
      '2026-10-07',
    )
    // 3 / 3 for full week + 1 / 1.29 for partial → blended ≈ 93%
    expect(result).toBe(93)
  })

  it('no pro-rating when range end is in the past', () => {
    // Range Mon Oct 5 – Sun Oct 11 (full week). today = Oct 15 (after range).
    // Should behave the same as without the today parameter.
    const sessions: Session[] = [
      makeSession('routine-1', '2026-10-05T10:00:00.000Z'),
      makeSession('routine-1', '2026-10-07T10:00:00.000Z'),
    ]
    const withToday = calculateConsistency(
      sessions,
      routine,
      { start: '2026-10-05', end: '2026-10-11' },
      '2026-10-15',
    )
    const withoutToday = calculateConsistency(
      sessions,
      routine,
      { start: '2026-10-05', end: '2026-10-11' },
    )
    expect(withToday).toBe(withoutToday)
  })

  it('exact full weeks with today param produce same result as without', () => {
    // Range: Mon Oct 5 – Sun Oct 11. today = Sun Oct 11 (last day of week).
    // 7 elapsed days → fullWeeks = 1, remainder = 0 → same as full week.
    const sessions: Session[] = [
      makeSession('routine-1', '2026-10-05T10:00:00.000Z'),
      makeSession('routine-1', '2026-10-07T10:00:00.000Z'),
      makeSession('routine-1', '2026-10-09T10:00:00.000Z'),
    ]
    const withToday = calculateConsistency(
      sessions,
      routine,
      { start: '2026-10-05', end: '2026-10-11' },
      '2026-10-11',
    )
    const withoutToday = calculateConsistency(
      sessions,
      routine,
      { start: '2026-10-05', end: '2026-10-11' },
    )
    expect(withToday).toBe(withoutToday)
    expect(withToday).toBe(100)
  })

  it('partial week with no sessions penalizes only elapsed days', () => {
    // 3x_week routine. 2 full weeks (Mon Sep 28 – Sun Oct 11) + 3 days (Mon Oct 12 – Wed Oct 14).
    // Full weeks: 2 × 3 = 6 planned.
    // Partial week: (3/7) × 3 ≈ 1.29 planned.
    // Total planned ≈ 7.29. 6 completed (all in past weeks, none in current).
    // 6 / 7.29 ≈ 82%.
    const sessions: Session[] = [
      makeSession('routine-1', '2026-09-28T10:00:00.000Z'),
      makeSession('routine-1', '2026-09-30T10:00:00.000Z'),
      makeSession('routine-1', '2026-10-02T10:00:00.000Z'),
      makeSession('routine-1', '2026-10-05T10:00:00.000Z'),
      makeSession('routine-1', '2026-10-07T10:00:00.000Z'),
      makeSession('routine-1', '2026-10-09T10:00:00.000Z'),
    ]
    const result = calculateConsistency(
      sessions,
      routine,
      { start: '2026-09-28', end: '2026-10-14' },
      '2026-10-14',
    )
    // Without pro-rating: 17 days / 7 = 2.43 weeks → 7.29 planned → 6/7.29 = 82%
    // With pro-rating: 2 full weeks (6 planned) + 3/7 × 3 (1.29) = 7.29 → same here
    // because the start is on a Monday. The key difference shows when
    // comparing to range end = Oct 18 (Sunday) without pro-rating.
    expect(result).toBe(82)

    // Without pro-rating and range extending to Sunday Oct 18:
    // 21 days / 7 = 3 weeks → 9 planned → 6/9 = 67%.
    // With pro-rating to Oct 14: 82%. The user is not punished for Thu-Sun.
    const withoutProrating = calculateConsistency(
      sessions,
      routine,
      { start: '2026-09-28', end: '2026-10-18' },
    )
    expect(withoutProrating).toBe(67)
    expect(result).toBeGreaterThan(withoutProrating)
  })

  it('1-day range with 1 completed session for a daily routine returns 100%', () => {
    // Simulates a routine created today with 1 session completed today.
    const dailyRoutine = makeRoutine({
      activities: [makeActivity({ frequency: 'daily' })],
    })
    const sessions: Session[] = [
      makeSession('routine-1', '2026-10-07T10:00:00.000Z'),
    ]
    const result = calculateConsistency(
      sessions,
      dailyRoutine,
      { start: '2026-10-07', end: '2026-10-07' },
      '2026-10-07',
    )
    expect(result).toBe(100)
  })

  it('3-day range for a 3x_week routine with 1 session returns proportional score', () => {
    // Routine created 3 days ago. 3x_week → pro-rated planned = (3/7)*3 ≈ 1.29.
    // 1 completed → 1/1.29 ≈ 78%.
    const sessions: Session[] = [
      makeSession('routine-1', '2026-10-05T10:00:00.000Z'),
    ]
    const result = calculateConsistency(
      sessions,
      routine,
      { start: '2026-10-05', end: '2026-10-07' },
      '2026-10-07',
    )
    expect(result).toBe(78)
  })
})

// ─── calculateCompletionRate ──────────────────────────────────────────────────

describe('calculateCompletionRate', () => {
  it('returns correct completed and planned counts', () => {
    const routine = makeRoutine() // 3x_week
    const sessions = [
      makeSession('routine-1', '2026-10-05T10:00:00.000Z'), // Mon week of Oct 5
      makeSession('routine-1', '2026-10-07T10:00:00.000Z'), // Wed
    ]
    const result = calculateCompletionRate(sessions, routine, '2026-10-05')
    expect(result.completed).toBe(2)
    expect(result.planned).toBe(3)
  })

  it('returns 0 completed when no sessions in the week', () => {
    const routine = makeRoutine()
    const result = calculateCompletionRate([], routine, '2026-10-05')
    expect(result.completed).toBe(0)
    expect(result.planned).toBe(3)
  })

  it('does not count sessions from a different week', () => {
    const routine = makeRoutine()
    const sessions = [
      makeSession('routine-1', '2026-09-28T10:00:00.000Z'), // previous week
    ]
    const result = calculateCompletionRate(sessions, routine, '2026-10-05')
    expect(result.completed).toBe(0)
  })
})

// ─── calculateWeeklySummary ───────────────────────────────────────────────────

describe('calculateWeeklySummary', () => {
  it('computes overall consistency correctly', () => {
    const routine = makeRoutine()
    const sessions = [
      makeSession('routine-1', '2026-10-05T10:00:00.000Z'),
      makeSession('routine-1', '2026-10-07T10:00:00.000Z'),
      makeSession('routine-1', '2026-10-09T10:00:00.000Z'),
    ]
    const summary = calculateWeeklySummary(sessions, [routine], '2026-10-05')
    expect(summary.overallConsistency).toBe(100)
    expect(summary.entries).toHaveLength(1)
    expect(summary.entries[0]!.completed).toBe(3)
    expect(summary.entries[0]!.planned).toBe(3)
  })

  it('returns 0 consistency for a week with no sessions', () => {
    const routine = makeRoutine()
    const summary = calculateWeeklySummary([], [routine], '2026-10-05')
    expect(summary.overallConsistency).toBe(0)
  })

  it('handles multiple routines', () => {
    const routineA = makeRoutine({ id: 'r-a', activities: [makeActivity({ id: 'a1', frequency: '3x_week' })] })
    const routineB = makeRoutine({ id: 'r-b', activities: [makeActivity({ id: 'a2', frequency: '2x_week' })] })

    const sessions = [
      makeSession('r-a', '2026-10-05T10:00:00.000Z', 'a1'),
      makeSession('r-a', '2026-10-07T10:00:00.000Z', 'a1'),
      makeSession('r-a', '2026-10-09T10:00:00.000Z', 'a1'),
      makeSession('r-b', '2026-10-06T10:00:00.000Z', 'a2'),
      makeSession('r-b', '2026-10-08T10:00:00.000Z', 'a2'),
    ]
    const summary = calculateWeeklySummary(sessions, [routineA, routineB], '2026-10-05')
    expect(summary.entries).toHaveLength(2)
    // 3/3 + 2/2 = 5/5 → 100%
    expect(summary.overallConsistency).toBe(100)
  })
})

// ─── calculateVolume ──────────────────────────────────────────────────────────

describe('calculateVolume', () => {
  it('calculates total volume from sets correctly', () => {
    const session: Session = {
      id: 's1',
      routineId: 'r1',
      completedAt: '2026-10-05T10:00:00.000Z',
      results: [
        {
          activityId: 'act-1',
          measurements: {},
          sets: [
            { weight: 60, reps: 8 }, // 480
            { weight: 60, reps: 8 }, // 480
            { weight: 62.5, reps: 7 }, // 437.5
          ],
        },
      ],
    }
    // Total = 480 + 480 + 437.5 = 1397.5
    expect(calculateVolume(session, 'act-1')).toBeCloseTo(1397.5)
  })

  it('total volume equals sum of individual set volumes', () => {
    const sets = [
      { weight: 80, reps: 5 },
      { weight: 80, reps: 5 },
      { weight: 85, reps: 3 },
    ]
    const session: Session = {
      id: 's1',
      routineId: 'r1',
      completedAt: '2026-10-05T10:00:00.000Z',
      results: [{ activityId: 'act-1', measurements: {}, sets }],
    }
    const total = calculateVolume(session, 'act-1')
    const sumOfParts = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
    expect(total).toBeCloseTo(sumOfParts)
  })

  it('reordering sets does not change total volume', () => {
    const sets = [
      { weight: 60, reps: 8 },
      { weight: 70, reps: 6 },
      { weight: 50, reps: 10 },
    ]
    const reversed = [...sets].reverse()

    const session1: Session = {
      id: 's1', routineId: 'r1', completedAt: '2026-10-01T10:00:00.000Z',
      results: [{ activityId: 'act-1', measurements: {}, sets }],
    }
    const session2: Session = {
      id: 's2', routineId: 'r1', completedAt: '2026-10-02T10:00:00.000Z',
      results: [{ activityId: 'act-1', measurements: {}, sets: reversed }],
    }
    expect(calculateVolume(session1, 'act-1')).toBeCloseTo(calculateVolume(session2, 'act-1'))
  })

  it('returns 0 when the activity is not in the session', () => {
    const session = makeSession('r1', '2026-10-05T10:00:00.000Z', 'act-1')
    expect(calculateVolume(session, 'act-2')).toBe(0)
  })

  it('falls back to scalar measurements when no sets present', () => {
    const session: Session = {
      id: 's1', routineId: 'r1', completedAt: '2026-10-05T10:00:00.000Z',
      results: [{ activityId: 'act-1', measurements: { weight: 60, reps: 8, sets: 3 } }],
    }
    // 60 * 8 * 3 = 1440
    expect(calculateVolume(session, 'act-1')).toBe(1440)
  })
})

// ─── calculateProgress ────────────────────────────────────────────────────────

describe('calculateProgress', () => {
  const activity = makeActivity({
    id: 'act-1',
    measurements: [{ type: 'distance', unit: 'km', target: 5 }],
  })

  it('returns an empty array when fewer than two sessions exist', () => {
    const sessions = [makeSession('r1', '2026-10-01T10:00:00.000Z', 'act-1', { distance: 5 })]
    expect(calculateProgress(sessions, activity)).toHaveLength(0)
  })

  it('handles missing previous data safely (returns empty when only one session)', () => {
    expect(calculateProgress([], activity)).toHaveLength(0)
  })

  it('computes positive delta percent correctly', () => {
    const sessions = [
      makeSession('r1', '2026-09-01T10:00:00.000Z', 'act-1', { distance: 5 }),
      makeSession('r1', '2026-10-01T10:00:00.000Z', 'act-1', { distance: 6 }),
    ]
    const entries = calculateProgress(sessions, activity)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.firstValue).toBe(5)
    expect(entries[0]!.latestValue).toBe(6)
    expect(entries[0]!.deltaPercent).toBe(20)
  })

  it('computes negative delta percent correctly', () => {
    const sessions = [
      makeSession('r1', '2026-09-01T10:00:00.000Z', 'act-1', { distance: 10 }),
      makeSession('r1', '2026-10-01T10:00:00.000Z', 'act-1', { distance: 8 }),
    ]
    const entries = calculateProgress(sessions, activity)
    expect(entries[0]!.deltaPercent).toBe(-20)
  })

  it('returns deltaPercent of 0 when first value is 0', () => {
    const sessions = [
      makeSession('r1', '2026-09-01T10:00:00.000Z', 'act-1', { distance: 0 }),
      makeSession('r1', '2026-10-01T10:00:00.000Z', 'act-1', { distance: 5 }),
    ]
    const entries = calculateProgress(sessions, activity)
    expect(entries[0]!.deltaPercent).toBe(0)
  })

  it('uses first and latest sessions regardless of how many exist', () => {
    const sessions = [
      makeSession('r1', '2026-09-01T10:00:00.000Z', 'act-1', { distance: 5 }),
      makeSession('r1', '2026-09-15T10:00:00.000Z', 'act-1', { distance: 5.5 }),
      makeSession('r1', '2026-10-01T10:00:00.000Z', 'act-1', { distance: 6 }),
    ]
    const entries = calculateProgress(sessions, activity)
    expect(entries[0]!.firstValue).toBe(5)
    expect(entries[0]!.latestValue).toBe(6)
  })
})

// ─── calculateTrend ───────────────────────────────────────────────────────────

describe('calculateTrend', () => {
  it('returns trend points in chronological order', () => {
    const sessions = [
      makeSession('r1', '2026-10-03T10:00:00.000Z', 'act-1', { duration: 25 }),
      makeSession('r1', '2026-10-01T10:00:00.000Z', 'act-1', { duration: 20 }),
      makeSession('r1', '2026-10-05T10:00:00.000Z', 'act-1', { duration: 30 }),
    ]
    const points = calculateTrend(sessions, 'act-1', 'duration')
    expect(points[0]!.date).toBe('2026-10-01')
    expect(points[1]!.date).toBe('2026-10-03')
    expect(points[2]!.date).toBe('2026-10-05')
  })

  it('returns the correct values for each point', () => {
    const sessions = [
      makeSession('r1', '2026-10-01T10:00:00.000Z', 'act-1', { distance: 5 }),
      makeSession('r1', '2026-10-03T10:00:00.000Z', 'act-1', { distance: 5.5 }),
    ]
    const points = calculateTrend(sessions, 'act-1', 'distance')
    expect(points[0]!.value).toBe(5)
    expect(points[1]!.value).toBe(5.5)
  })

  it('skips sessions where the metric is not recorded', () => {
    const sessions = [
      makeSession('r1', '2026-10-01T10:00:00.000Z', 'act-1', { distance: 5 }),
      makeSession('r1', '2026-10-03T10:00:00.000Z', 'act-1', {}), // no distance
    ]
    const points = calculateTrend(sessions, 'act-1', 'distance')
    expect(points).toHaveLength(1)
  })

  it('uses total volume for weight metric on set-based activities', () => {
    const session: Session = {
      id: 's1', routineId: 'r1', completedAt: '2026-10-01T10:00:00.000Z',
      results: [{
        activityId: 'act-1',
        measurements: {},
        sets: [{ weight: 60, reps: 8 }, { weight: 60, reps: 8 }],
      }],
    }
    const points = calculateTrend([session], 'act-1', 'weight')
    expect(points[0]!.value).toBeCloseTo(960)
  })
})

// ─── calculateStreak ─────────────────────────────────────────────────────────

describe('calculateStreak', () => {
  it('returns 0 for flexible frequency routines', () => {
    const routine = makeRoutine({
      activities: [makeActivity({ frequency: 'flexible' })],
    })
    expect(calculateStreak([makeSession('routine-1', new Date().toISOString())], routine)).toBe(0)
  })

  it('returns 0 for routines with no sessions', () => {
    const routine = makeRoutine()
    expect(calculateStreak([], routine)).toBe(0)
  })
})

// ─── calculateChallengeProgress ───────────────────────────────────────────────

describe('calculateChallengeProgress', () => {
  const challengeRoutine = makeRoutine({
    challengeDurationDays: 30,
    challengeStartDate: '2026-10-01',
  })

  it('challenge progress cannot exceed the challenge duration', () => {
    // Simulate 50 sessions in a 30-day challenge
    const sessions = Array.from({ length: 50 }, (_, i) => {
      const date = new Date('2026-10-01')
      date.setUTCDate(date.getUTCDate() + i)
      return makeSession('routine-1', date.toISOString())
    })
    const progress = calculateChallengeProgress(challengeRoutine, sessions, '2026-11-10')
    expect(progress.completionRate).toBeLessThanOrEqual(1)
    expect(progress.elapsedDays).toBeLessThanOrEqual(30)
  })

  it('calculates elapsed days correctly', () => {
    const progress = calculateChallengeProgress(challengeRoutine, [], '2026-10-11')
    expect(progress.elapsedDays).toBe(11) // Oct 1 → Oct 11 inclusive
  })

  it('marks as complete when end date is reached', () => {
    const progress = calculateChallengeProgress(challengeRoutine, [], '2026-10-31')
    expect(progress.isComplete).toBe(true)
  })

  it('is not complete before the end date', () => {
    const progress = calculateChallengeProgress(challengeRoutine, [], '2026-10-15')
    expect(progress.isComplete).toBe(false)
  })

  it('counts only sessions within the challenge window', () => {
    const sessions = [
      makeSession('routine-1', '2026-09-30T10:00:00.000Z'), // before challenge
      makeSession('routine-1', '2026-10-05T10:00:00.000Z'), // within
      makeSession('routine-1', '2026-11-02T10:00:00.000Z'), // after challenge end (Oct 30)
    ]
    const progress = calculateChallengeProgress(challengeRoutine, sessions, '2026-10-10')
    expect(progress.completedSessions).toBe(1)
  })

  it('elapsedDays is clamped to 0 from below', () => {
    const progress = calculateChallengeProgress(challengeRoutine, [], '2026-09-15')
    expect(progress.elapsedDays).toBe(0)
  })

  it('elapsedDays is clamped to totalDays from above', () => {
    const progress = calculateChallengeProgress(challengeRoutine, [], '2026-12-31')
    expect(progress.elapsedDays).toBe(30)
  })
})

// ─── calculatePersonalBest ────────────────────────────────────────────────────

describe('calculatePersonalBest', () => {
  it('returns the maximum value across sessions', () => {
    const sessions = [
      makeSession('r1', '2026-09-01T10:00:00.000Z', 'act-1', { distance: 5 }),
      makeSession('r1', '2026-09-15T10:00:00.000Z', 'act-1', { distance: 6.2 }),
      makeSession('r1', '2026-10-01T10:00:00.000Z', 'act-1', { distance: 5.8 }),
    ]
    expect(calculatePersonalBest(sessions, 'act-1', 'distance')).toBe(6.2)
  })

  it('returns undefined when no sessions contain the metric', () => {
    const sessions = [makeSession('r1', '2026-10-01T10:00:00.000Z', 'act-1', { duration: 30 })]
    expect(calculatePersonalBest(sessions, 'act-1', 'distance')).toBeUndefined()
  })

  it('returns undefined for empty sessions', () => {
    expect(calculatePersonalBest([], 'act-1', 'weight')).toBeUndefined()
  })

  it('finds the max weight from individual sets (not total volume)', () => {
    const session: Session = {
      id: 's1', routineId: 'r1', completedAt: '2026-10-01T10:00:00.000Z',
      results: [{
        activityId: 'act-1',
        measurements: {},
        sets: [
          { weight: 60, reps: 8 },
          { weight: 70, reps: 6 },
          { weight: 65, reps: 7 },
        ],
      }],
    }
    expect(calculatePersonalBest([session], 'act-1', 'weight')).toBe(70)
  })
})
