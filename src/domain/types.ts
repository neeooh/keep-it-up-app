// ─── Core enumerations ────────────────────────────────────────────────────────

/** Whether the activity is something to do or something to avoid. */
export type Direction = 'DO' | 'AVOID'

/** The supported measurement dimensions for an activity. */
export type MeasurementType =
  | 'duration'
  | 'distance'
  | 'quantity'
  | 'sets'
  | 'reps'
  | 'weight'

/** How often the user intends to perform the routine. */
export type Frequency = 'daily' | '3x_week' | '2x_week' | '1x_week' | 'flexible'

/** ISO day-of-week (1 = Monday … 7 = Sunday, matching date-fns). */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7

/** Supported optional challenge durations (days). */
export type ChallengeDuration = 30 | 60 | 90

// ─── Activity configuration ───────────────────────────────────────────────────

/**
 * One measurement dimension within an activity, e.g. "distance in km,
 * target 5".  Not all fields are relevant to every measurement type.
 */
export interface MeasurementConfig {
  type: MeasurementType
  /** Human-readable unit label, e.g. "km", "min", "kg". */
  unit?: string
  /** The intended target value for this measurement. */
  target?: number
}

/**
 * A specific behaviour within a routine.
 * Activities are generic — the same type models running, reading, and
 * "no smoking" without requiring separate domain objects.
 */
export interface Activity {
  id: string
  name: string
  direction: Direction
  measurements: MeasurementConfig[]
  frequency: Frequency
  /** Preferred days, e.g. [1, 3, 5] for Mon/Wed/Fri. Optional. */
  scheduledDays?: DayOfWeek[]
  /** Free-text time preference, e.g. "morning". Optional. */
  preferredTime?: string
}

// ─── Routine ──────────────────────────────────────────────────────────────────

/**
 * A repeatable plan containing one or more activities.
 */
export interface Routine {
  id: string
  name: string
  activities: Activity[]
  /** ISO 8601 date-time string of when the routine was created. */
  createdAt: string
  /** If set, this routine is part of a fixed-duration challenge. */
  challengeDurationDays?: ChallengeDuration
  /** ISO 8601 date string (YYYY-MM-DD) when the challenge started. */
  challengeStartDate?: string
}

// ─── Session recording ────────────────────────────────────────────────────────

/**
 * The result for a single set within a strength exercise.
 */
export interface SetResult {
  weight?: number
  reps?: number
}

/**
 * The measurements recorded for one activity during a session.
 * Not all fields are populated — only those relevant to the activity.
 */
export interface ActivityResult {
  activityId: string
  /**
   * Scalar measurement values keyed by type.
   * e.g. { duration: 31, distance: 5.2 }
   */
  measurements: Partial<Record<MeasurementType, number>>
  /**
   * Per-set breakdown for weight-bearing exercises.
   * When present, the scalar 'sets', 'reps', 'weight' values in
   * `measurements` represent totals/averages and may be omitted.
   */
  sets?: SetResult[]
  /**
   * For AVOID activities: did the user stay on track?
   * true = success (avoided the behaviour), false = slipped.
   */
  stayedOnTrack?: boolean
}

/**
 * A completed occurrence of a routine.
 * An incomplete session (abandoned mid-way) must not be saved as a Session.
 */
export interface Session {
  id: string
  routineId: string
  /** ISO 8601 date-time string of when the session was completed. */
  completedAt: string
  results: ActivityResult[]
}

// ─── Application state ────────────────────────────────────────────────────────

/**
 * The complete application state that is persisted to localStorage.
 */
export interface AppState {
  routines: Routine[]
  sessions: Session[]
}

// ─── Calculation helpers ──────────────────────────────────────────────────────

/** A date range used as input to consistency calculations. */
export interface DateRange {
  /** ISO 8601 date string (YYYY-MM-DD). */
  start: string
  /** ISO 8601 date string (YYYY-MM-DD). */
  end: string
}

/** A single data point for trend charts. */
export interface TrendPoint {
  /** ISO 8601 date string of the session. */
  date: string
  value: number
}

/** Summary of one routine's performance for a given week. */
export interface WeeklySummaryEntry {
  routineId: string
  routineName: string
  /** Number of sessions completed this week. */
  completed: number
  /** Number of sessions planned this week (derived from frequency). */
  planned: number
  /** completed / planned, clamped to [0, 1]. */
  consistencyRate: number
}

/** Full weekly review data. */
export interface WeeklySummary {
  /** ISO 8601 date string (YYYY-MM-DD) for Monday of the reviewed week. */
  weekStart: string
  entries: WeeklySummaryEntry[]
  /** Overall consistency across all routines, 0–100. */
  overallConsistency: number
  /** Sessions completed in the last 6 weeks window. */
  recentCompleted: number
  /** Sessions planned in the last 6 weeks window. */
  recentPlanned: number
}

/** Progress delta for a single measurement within an activity. */
export interface ProgressEntry {
  activityId: string
  activityName: string
  metric: MeasurementType
  firstValue: number
  latestValue: number
  /** Percentage change, positive = improvement. */
  deltaPercent: number
}

/** Challenge progress snapshot. */
export interface ChallengeProgress {
  /** Total challenge duration in days. */
  totalDays: ChallengeDuration
  /** How many days have elapsed since challengeStartDate (clamped to totalDays). */
  elapsedDays: number
  /** How many sessions have been completed within the challenge window. */
  completedSessions: number
  /** Completion rate: completedSessions / totalDays, clamped to [0, 1]. */
  completionRate: number
  /** Whether the challenge end date has been reached. */
  isComplete: boolean
}
