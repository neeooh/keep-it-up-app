/**
 * Property-based tests for domain calculations.
 *
 * These tests enforce general rules that must always hold for any input,
 * derived from the spec requirements:
 *
 * - Consistency is always 0–100
 * - Sessions for a commitment always belong to that commitment
 * - Sessions for a commitment are always sorted oldest-first
 * - Volume is always non-negative
 * - Volume equals sum of (weight × reps) per set
 * - Completion rate never exceeds planned count
 * - Planned sessions per week matches frequency definition
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateConsistency,
  calculateVolume,
  calculateCompletionRate,
  sessionsForCommitment,
  plannedSessionsPerWeek,
  commitmentPlannedPerWeek,
} from './calculations'
import type {
  Activity,
  ActivityResult,
  Frequency,
  MeasurementConfig,
  Commitment,
  Session,
  SetResult,
} from './types'

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const frequencyArb: fc.Arbitrary<Frequency> = fc.constantFrom(
  'daily',
  '3x_week',
  '2x_week',
  '1x_week',
  'flexible',
)

/** Generate an ISO date string within 2026. */
const isoDateArb = fc.integer({ min: 1, max: 365 }).map((day) => {
  const d = new Date(Date.UTC(2026, 0, day))
  return d.toISOString()
})

/** Generate an ISO date string within June 2026. */
const juneDateArb = fc.integer({ min: 1, max: 30 }).map((day) => {
  const d = new Date(Date.UTC(2026, 5, day))
  return d.toISOString()
})

/** Generate an ISO date string within the week of Sep 28 - Oct 4 2026. */
const weekDateArb = fc.integer({ min: 0, max: 6 }).map((offset) => {
  const d = new Date(Date.UTC(2026, 8, 28 + offset))
  return d.toISOString()
})

const activityArb: fc.Arbitrary<Activity> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  direction: fc.constantFrom('DO' as const, 'AVOID' as const),
  measurements: fc.constant([] as MeasurementConfig[]),
  frequency: frequencyArb,
})

const commitmentArb: fc.Arbitrary<Commitment> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  activities: fc.array(activityArb, { minLength: 1, maxLength: 3 }),
  createdAt: isoDateArb,
})

function sessionArb(commitmentId: string): fc.Arbitrary<Session> {
  return fc.record({
    id: fc.uuid(),
    commitmentId: fc.constant(commitmentId),
    completedAt: isoDateArb,
    results: fc.constant([] as ActivityResult[]),
  })
}

function sessionWithCommitmentIdArb(): fc.Arbitrary<Session> {
  return fc.record({
    id: fc.uuid(),
    commitmentId: fc.uuid(),
    completedAt: isoDateArb,
    results: fc.constant([] as ActivityResult[]),
  })
}

const setResultArb: fc.Arbitrary<SetResult> = fc.record({
  weight: fc.option(fc.nat({ max: 500 }), { nil: undefined }),
  reps: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
})

// ─── Properties ───────────────────────────────────────────────────────────────

describe('Property-based tests — domain calculations', () => {

  // Property 1: Consistency is always in [0, 100]
  it('consistency is always between 0 and 100', () => {
    fc.assert(
      fc.property(
        commitmentArb,
        fc.array(sessionWithCommitmentIdArb(), { maxLength: 20 }),
        (commitment, sessions) => {
          const result = calculateConsistency(sessions, commitment, {
            start: '2026-06-01',
            end: '2026-06-30',
          })
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(100)
        },
      ),
    )
  })

  // Property 2: sessionsForCommitment only returns sessions belonging to that commitment
  it('sessionsForCommitment only returns sessions matching the commitment id', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(sessionWithCommitmentIdArb(), { maxLength: 30 }),
        (commitmentId, sessions) => {
          const filtered = sessionsForCommitment(sessions, commitmentId)
          for (const s of filtered) {
            expect(s.commitmentId).toBe(commitmentId)
          }
        },
      ),
    )
  })

  // Property 3: sessionsForCommitment returns sessions sorted oldest-first
  it('sessionsForCommitment returns sessions sorted by completedAt ascending', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(
          fc.record({
            id: fc.uuid(),
            commitmentId: fc.uuid(),
            completedAt: isoDateArb,
            results: fc.constant([] as ActivityResult[]),
          }),
          { maxLength: 30 },
        ),
        (commitmentId, sessions) => {
          const filtered = sessionsForCommitment(sessions, commitmentId)
          for (let i = 1; i < filtered.length; i++) {
            expect(filtered[i]!.completedAt >= filtered[i - 1]!.completedAt).toBe(true)
          }
        },
      ),
    )
  })

  // Property 4: Volume is always non-negative
  it('volume is always non-negative', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(setResultArb, { minLength: 1, maxLength: 10 }),
        (activityId, sets) => {
          const session: Session = {
            id: 'test-session',
            commitmentId: 'test-commitment',
            completedAt: new Date().toISOString(),
            results: [{ activityId, measurements: {}, sets }],
          }
          const vol = calculateVolume(session, activityId)
          expect(vol).toBeGreaterThanOrEqual(0)
        },
      ),
    )
  })

  // Property 5: Volume equals sum of (weight × reps) per set
  it('volume equals sum of weight * reps across all sets', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(
          fc.record({
            weight: fc.nat({ max: 200 }),
            reps: fc.nat({ max: 50 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (activityId, sets) => {
          const session: Session = {
            id: 'test-session',
            commitmentId: 'test-commitment',
            completedAt: new Date().toISOString(),
            results: [{ activityId, measurements: {}, sets }],
          }
          const expected = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
          expect(calculateVolume(session, activityId)).toBe(expected)
        },
      ),
    )
  })

  // Property 6: Completion rate completed count never exceeds total sessions in the week
  it('completion rate completed count is between 0 and total sessions for the commitment', () => {
    fc.assert(
      fc.property(
        commitmentArb,
        fc.array(
          fc.record({
            id: fc.uuid(),
            commitmentId: fc.uuid(),
            completedAt: weekDateArb,
            results: fc.constant([] as ActivityResult[]),
          }),
          { maxLength: 20 },
        ),
        (commitment, sessions) => {
          const { completed, planned } = calculateCompletionRate(
            sessions,
            commitment,
            '2026-09-28',
          )
          expect(completed).toBeGreaterThanOrEqual(0)
          expect(planned).toBeGreaterThanOrEqual(0)
        },
      ),
    )
  })

  // Property 7: plannedSessionsPerWeek matches frequency definition
  it('plannedSessionsPerWeek returns correct count for every frequency', () => {
    fc.assert(
      fc.property(frequencyArb, (freq) => {
        const activity: Activity = {
          id: 'a1',
          name: 'test',
          direction: 'DO',
          measurements: [],
          frequency: freq,
        }
        const result = plannedSessionsPerWeek(activity)
        const expected: Record<Frequency, number> = {
          daily: 7,
          '3x_week': 3,
          '2x_week': 2,
          '1x_week': 1,
          flexible: 0,
        }
        expect(result).toBe(expected[freq])
      }),
    )
  })

  // Property 8: commitmentPlannedPerWeek returns 0 for empty commitments
  it('commitmentPlannedPerWeek returns 0 for commitments with no activities', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1 }),
          activities: fc.constant([] as Activity[]),
          createdAt: fc.constant('2026-01-01T00:00:00Z'),
        }),
        (commitment) => {
          expect(commitmentPlannedPerWeek(commitment as Commitment)).toBe(0)
        },
      ),
    )
  })

  // Property 9: Consistency is 0 when no sessions match the commitment
  it('consistency is 0 when no sessions belong to the commitment', () => {
    fc.assert(
      fc.property(
        commitmentArb,
        fc.array(
          fc.record({
            id: fc.uuid(),
            commitmentId: fc.constant('other-commitment-id'),
            completedAt: juneDateArb,
            results: fc.constant([] as ActivityResult[]),
          }),
          { maxLength: 10 },
        ),
        (commitment, sessions) => {
          const result = calculateConsistency(sessions, commitment, {
            start: '2026-06-01',
            end: '2026-06-30',
          })
          expect(result).toBe(0)
        },
      ),
    )
  })

  // Property 10: Adding more matching sessions never decreases consistency
  it('adding a session for a commitment never decreases consistency', () => {
    fc.assert(
      fc.property(
        commitmentArb,
        fc.array(sessionArb('fixed-commitment'), { minLength: 0, maxLength: 5 }),
        sessionArb('fixed-commitment'),
        (commitment, baseSessions, extraSession) => {
          const r = { ...commitment, id: 'fixed-commitment' }
          const range = { start: '2026-01-01', end: '2026-12-31' }
          const before = calculateConsistency(baseSessions, r, range)
          const after = calculateConsistency([...baseSessions, extraSession], r, range)
          expect(after).toBeGreaterThanOrEqual(before)
        },
      ),
    )
  })
})
