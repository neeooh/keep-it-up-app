/**
 * Pure deterministic domain calculation functions.
 *
 * All functions are side-effect free — they accept plain data and return plain
 * values.  They can be tested independently of any UI or browser API.
 *
 * Date handling uses ISO 8601 strings (YYYY-MM-DD or full ISO date-time).
 * Week calculations treat Monday as the first day of the week.
 */

import type {
  Activity,
  ActivityResult,
  ChallengeProgress,
  DateRange,
  MeasurementType,
  ProgressEntry,
  Routine,
  Session,
  TrendPoint,
  WeeklySummary,
  WeeklySummaryEntry,
} from './types'

// ─── Date utilities (no external deps) ───────────────────────────────────────

/** Parse an ISO date or date-time string and return a UTC midnight Date. */
function toDate(iso: string): Date {
  // Accept both "YYYY-MM-DD" and full ISO date-time strings.
  const datePart = iso.slice(0, 10)
  const [year, month, day] = datePart.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!))
}

/** Format a Date as "YYYY-MM-DD". */
function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Return the Monday of the week containing the given date.
 * Uses ISO week convention (Monday = start of week).
 */
function startOfISOWeek(d: Date): Date {
  const day = d.getUTCDay() // 0 = Sun, 1 = Mon …
  const diff = (day === 0 ? -6 : 1 - day) // days to subtract to reach Monday
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() + diff)
  return monday
}

/** Add `days` days to a Date, returning a new Date. */
function addDays(d: Date, days: number): Date {
  const result = new Date(d)
  result.setUTCDate(d.getUTCDate() + days)
  return result
}

/** Return the number of whole days between two dates (end - start). */
function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000)
}

// ─── Frequency helpers ────────────────────────────────────────────────────────

/**
 * Return how many sessions are planned for a routine in a 7-day week,
 * based on its first activity's frequency setting.
 * 'flexible' is treated as 0 planned (user decides each time).
 */
export function plannedSessionsPerWeek(activity: Activity): number {
  switch (activity.frequency) {
    case 'daily':
      return 7
    case '3x_week':
      return 3
    case '2x_week':
      return 2
    case '1x_week':
      return 1
    case 'flexible':
      return 0
  }
}

/**
 * Return the planned sessions per week for a routine.
 * Uses the first activity's frequency as the routine-level frequency.
 * Returns 0 for empty routines or flexible frequency.
 */
export function routinePlannedPerWeek(routine: Routine): number {
  const first = routine.activities[0]
  if (!first) return 0
  return plannedSessionsPerWeek(first)
}

// ─── Session helpers ──────────────────────────────────────────────────────────

/** Return sessions that belong to a given routine, sorted oldest-first. */
export function sessionsForRoutine(sessions: Session[], routineId: string): Session[] {
  return sessions
    .filter((s) => s.routineId === routineId)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
}

/** Return sessions completed within a date range (inclusive on both ends). */
export function sessionsInRange(sessions: Session[], range: DateRange): Session[] {
  const start = toDate(range.start).getTime()
  const end = toDate(range.end).getTime() + 86_400_000 - 1 // end of end day
  return sessions.filter((s) => {
    const t = new Date(s.completedAt).getTime()
    return t >= start && t <= end
  })
}

// ─── calculateConsistency ─────────────────────────────────────────────────────

/**
 * Calculate the consistency percentage for a routine over a date range.
 *
 * Consistency = completed sessions / planned sessions, expressed as a
 * percentage, clamped to [0, 100].
 *
 * Invariants:
 * - Result is always in [0, 100].
 * - Returns 0 when no sessions are planned (flexible frequency).
 * - Returns 0 when the date range is empty or before any sessions.
 */
export function calculateConsistency(
  sessions: Session[],
  routine: Routine,
  range: DateRange,
): number {
  const planned = routinePlannedPerWeek(routine)
  if (planned === 0) return 0

  const startDate = toDate(range.start)
  const endDate = toDate(range.end)
  const totalDays = daysBetween(startDate, endDate) + 1
  if (totalDays <= 0) return 0

  const totalWeeks = totalDays / 7
  const totalPlanned = totalWeeks * planned

  const completed = sessionsForRoutine(sessions, routine.id).filter((s) => {
    const t = new Date(s.completedAt).getTime()
    return (
      t >= startDate.getTime() &&
      t <= endDate.getTime() + 86_400_000 - 1
    )
  }).length

  const rate = totalPlanned > 0 ? completed / totalPlanned : 0
  return Math.min(100, Math.max(0, Math.round(rate * 100)))
}

// ─── calculateCompletionRate ──────────────────────────────────────────────────

/**
 * Return the completion rate for a routine in a given week as { completed, planned }.
 *
 * `weekStart` must be the Monday of the target week (YYYY-MM-DD).
 */
export function calculateCompletionRate(
  sessions: Session[],
  routine: Routine,
  weekStart: string,
): { completed: number; planned: number } {
  const monday = toDate(weekStart)
  const sunday = addDays(monday, 6)

  const planned = routinePlannedPerWeek(routine)
  const completed = sessionsForRoutine(sessions, routine.id).filter((s) => {
    const t = new Date(s.completedAt).getTime()
    return t >= monday.getTime() && t <= sunday.getTime() + 86_400_000 - 1
  }).length

  return { completed, planned }
}

// ─── calculateWeeklySummary ───────────────────────────────────────────────────

/**
 * Compute the full weekly summary for all routines in a given week.
 *
 * `weekStart` is the Monday of the week to summarise (YYYY-MM-DD).
 * The "recent" window covers the 6-week period ending on the Sunday of
 * the target week, used to compute the momentum stat.
 */
export function calculateWeeklySummary(
  sessions: Session[],
  routines: Routine[],
  weekStart: string,
): WeeklySummary {
  const monday = toDate(weekStart)
  const sunday = addDays(monday, 6)

  // 6-week recent window (42 days ending on Sunday)
  const recentStart = addDays(monday, -35) // 5 prior weeks + this week
  let recentCompleted = 0
  let recentPlanned = 0

  const entries: WeeklySummaryEntry[] = routines.map((routine) => {
    const { completed, planned } = calculateCompletionRate(sessions, routine, weekStart)
    const consistencyRate = planned > 0 ? Math.min(1, completed / planned) : 0

    // Recent window for this routine
    const weeklyPlanned = routinePlannedPerWeek(routine)
    recentPlanned += weeklyPlanned * 6
    recentCompleted += sessionsForRoutine(sessions, routine.id).filter((s) => {
      const t = new Date(s.completedAt).getTime()
      return (
        t >= recentStart.getTime() &&
        t <= sunday.getTime() + 86_400_000 - 1
      )
    }).length

    return {
      routineId: routine.id,
      routineName: routine.name,
      completed,
      planned,
      consistencyRate,
    }
  })

  const totalCompleted = entries.reduce((sum, e) => sum + e.completed, 0)
  const totalPlanned = entries.reduce((sum, e) => sum + e.planned, 0)
  const overallConsistency =
    totalPlanned > 0
      ? Math.min(100, Math.round((totalCompleted / totalPlanned) * 100))
      : 0

  return {
    weekStart,
    entries,
    overallConsistency,
    recentCompleted,
    recentPlanned,
  }
}

// ─── calculateVolume ──────────────────────────────────────────────────────────

/**
 * Calculate the total volume (kg) for a weight-bearing activity in a session.
 *
 * Volume = Σ (weight × reps) for each set.
 *
 * Invariants:
 * - Volume is always ≥ 0.
 * - Reordering sets does not change the total.
 * - Total volume equals the sum of individual set volumes.
 */
export function calculateVolume(session: Session, activityId: string): number {
  const result = session.results.find((r) => r.activityId === activityId)
  if (!result) return 0

  if (result.sets && result.sets.length > 0) {
    return result.sets.reduce((total, set) => {
      const w = set.weight ?? 0
      const r = set.reps ?? 0
      return total + w * r
    }, 0)
  }

  // Fallback: scalar measurements
  const weight = result.measurements['weight'] ?? 0
  const reps = result.measurements['reps'] ?? 0
  const sets = result.measurements['sets'] ?? 1
  return weight * reps * sets
}

// ─── calculateProgress ────────────────────────────────────────────────────────

/**
 * Calculate progress entries for an activity across all sessions.
 *
 * Compares the first recorded value against the latest recorded value for
 * each measurement type that appears in the activity's results.
 *
 * Invariants:
 * - Returns an empty array when fewer than two sessions exist.
 * - deltaPercent is 0 when the first value is 0 (avoids division by zero).
 * - Historical records do not alter past results.
 */
export function calculateProgress(
  sessions: Session[],
  activity: Activity,
): ProgressEntry[] {
  const relevant = sessions
    .filter((s) => s.results.some((r) => r.activityId === activity.id))
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))

  if (relevant.length < 2) return []

  const firstSession = relevant[0]!
  const latestSession = relevant[relevant.length - 1]!

  const firstResult = firstSession.results.find((r) => r.activityId === activity.id)!
  const latestResult = latestSession.results.find((r) => r.activityId === activity.id)!

  const entries: ProgressEntry[] = []

  const allMetrics = new Set<MeasurementType>([
    ...Object.keys(firstResult.measurements) as MeasurementType[],
    ...Object.keys(latestResult.measurements) as MeasurementType[],
  ])

  for (const metric of allMetrics) {
    const firstValue = firstResult.measurements[metric]
    const latestValue = latestResult.measurements[metric]

    if (firstValue === undefined || latestValue === undefined) continue

    const deltaPercent =
      firstValue !== 0
        ? Math.round(((latestValue - firstValue) / firstValue) * 100)
        : 0

    entries.push({
      activityId: activity.id,
      activityName: activity.name,
      metric,
      firstValue,
      latestValue,
      deltaPercent,
    })
  }

  return entries
}

// ─── calculateTrend ───────────────────────────────────────────────────────────

/**
 * Return a time-series of values for a specific metric of an activity,
 * ordered chronologically. Used for trend charts.
 *
 * For sets-based activities, returns the total volume per session when
 * metric is 'weight'.
 */
export function calculateTrend(
  sessions: Session[],
  activityId: string,
  metric: MeasurementType,
): TrendPoint[] {
  return sessions
    .filter((s) => s.results.some((r) => r.activityId === activityId))
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    .flatMap((session) => {
      const result = session.results.find((r) => r.activityId === activityId)
      if (!result) return []

      let value: number | undefined

      if (metric === 'weight' && result.sets && result.sets.length > 0) {
        // Use total volume for weight-based set activities
        value = calculateVolume(session, activityId)
      } else {
        value = result.measurements[metric]
      }

      if (value === undefined) return []

      return [{ date: session.completedAt.slice(0, 10), value }]
    })
}

// ─── calculateStreak ─────────────────────────────────────────────────────────

/**
 * Calculate the current consecutive-week streak for a routine.
 *
 * A streak is the number of consecutive calendar weeks (ending with the
 * most recent completed week, or the current week) in which the user met
 * or exceeded their planned session count.
 *
 * 'flexible' frequency routines always return 0.
 */
export function calculateStreak(sessions: Session[], routine: Routine): number {
  const planned = routinePlannedPerWeek(routine)
  if (planned === 0) return 0

  const routineSessions = sessionsForRoutine(sessions, routine.id)
  if (routineSessions.length === 0) return 0

  // Find the Monday of the current week
  const now = new Date()
  const thisMonday = startOfISOWeek(now)

  let streak = 0
  let weekMonday = thisMonday

  // Walk backwards week-by-week
  for (let i = 0; i < 52; i++) {
    const weekSunday = addDays(weekMonday, 6)
    const weekStart = weekMonday.getTime()
    const weekEnd = weekSunday.getTime() + 86_400_000 - 1

    const count = routineSessions.filter((s) => {
      const t = new Date(s.completedAt).getTime()
      return t >= weekStart && t <= weekEnd
    }).length

    if (count >= planned) {
      streak++
    } else if (i === 0) {
      // Current week is incomplete but not yet over — don't break
      // (only break if it's a past week that was missed)
    } else {
      break
    }

    weekMonday = addDays(weekMonday, -7)
  }

  return streak
}

// ─── calculateChallengeProgress ───────────────────────────────────────────────

/**
 * Calculate how far through a challenge a routine is.
 *
 * Invariants:
 * - elapsedDays is clamped to [0, totalDays].
 * - completionRate is clamped to [0, 1].
 * - Challenge progress cannot exceed the challenge duration.
 */
export function calculateChallengeProgress(
  routine: Routine,
  sessions: Session[],
  today: string = toDateString(new Date()),
): ChallengeProgress {
  const totalDays = routine.challengeDurationDays!
  const startDate = toDate(routine.challengeStartDate!)
  const endDate = addDays(startDate, totalDays - 1)
  const todayDate = toDate(today)

  const elapsedDays = Math.min(
    totalDays,
    Math.max(0, daysBetween(startDate, todayDate) + 1),
  )

  const completedSessions = sessionsForRoutine(sessions, routine.id).filter((s) => {
    const t = new Date(s.completedAt).getTime()
    return (
      t >= startDate.getTime() &&
      t <= endDate.getTime() + 86_400_000 - 1
    )
  }).length

  const completionRate = Math.min(1, completedSessions / totalDays)
  const isComplete = daysBetween(startDate, todayDate) >= totalDays

  return {
    totalDays,
    elapsedDays,
    completedSessions,
    completionRate,
    isComplete,
  }
}

// ─── calculatePersonalBest ────────────────────────────────────────────────────

/**
 * Find the personal best (maximum value) for a given metric of an activity
 * across all sessions.
 *
 * For 'weight' on sets-based activities, compares the maximum weight used
 * in any single set, not total volume.
 *
 * Returns undefined when no sessions contain the metric.
 */
export function calculatePersonalBest(
  sessions: Session[],
  activityId: string,
  metric: MeasurementType,
): number | undefined {
  let best: number | undefined

  for (const session of sessions) {
    const result = session.results.find((r) => r.activityId === activityId)
    if (!result) continue

    if (metric === 'weight' && result.sets && result.sets.length > 0) {
      for (const set of result.sets) {
        if (set.weight !== undefined) {
          best = best === undefined ? set.weight : Math.max(best, set.weight)
        }
      }
    } else {
      const value = result.measurements[metric]
      if (value !== undefined) {
        best = best === undefined ? value : Math.max(best, value)
      }
    }
  }

  return best
}
