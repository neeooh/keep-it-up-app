/**
 * Predefined activity template catalogue.
 *
 * Templates are pure data — presets that provide sensible defaults a user
 * can modify during onboarding.  They are not fixed domain objects.
 *
 * Source of truth: mvp_product_spec.md sections 5 and 6.
 */

import type { Direction, Frequency, MeasurementConfig } from './types'

// ─── Template type ────────────────────────────────────────────────────────────

/**
 * A template provides the defaults for a new Activity.
 * All fields are optional because the user can change any of them.
 */
export interface ActivityTemplate {
  /** Stable identifier used to look up a template. */
  id: string
  /** Display name shown on the template card. */
  label: string
  /** Category used for grouping in the UI. */
  category: TemplateCategory
  direction: Direction
  defaultName: string
  defaultMeasurements: MeasurementConfig[]
  defaultFrequency: Frequency
  /** Suggested challenge duration in days. */
  suggestedChallengeDays?: 30 | 60 | 90
  /**
   * True for the "Create your own" sentinel.
   * When selected the user fills in every field from scratch.
   */
  isCustom?: boolean
}

export type TemplateCategory =
  | 'exercise'
  | 'personal_development'
  | 'daily_life'
  | 'breaking_habits'
  | 'custom'

// ─── Template catalogue ───────────────────────────────────────────────────────

// Exercise ────────────────────────────────────────────────────────────────────

const strengthWorkout: ActivityTemplate = {
  id: 'strength-workout',
  label: 'Strength workout',
  category: 'exercise',
  direction: 'DO',
  defaultName: 'Strength workout',
  defaultMeasurements: [
    { type: 'sets', target: 3 },
    { type: 'reps', target: 10 },
    { type: 'weight', unit: 'kg' },
  ],
  defaultFrequency: '3x_week',
}

const running: ActivityTemplate = {
  id: 'running',
  label: 'Running',
  category: 'exercise',
  direction: 'DO',
  defaultName: 'Running',
  defaultMeasurements: [
    { type: 'distance', unit: 'km', target: 5 },
    { type: 'duration', unit: 'min', target: 30 },
  ],
  defaultFrequency: '2x_week',
}

const walking: ActivityTemplate = {
  id: 'walking',
  label: 'Walking',
  category: 'exercise',
  direction: 'DO',
  defaultName: 'Walking',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 30 },
  ],
  defaultFrequency: '3x_week',
}

const cycling: ActivityTemplate = {
  id: 'cycling',
  label: 'Cycling',
  category: 'exercise',
  direction: 'DO',
  defaultName: 'Cycling',
  defaultMeasurements: [
    { type: 'distance', unit: 'km', target: 20 },
    { type: 'duration', unit: 'min', target: 45 },
  ],
  defaultFrequency: '2x_week',
}

const swimming: ActivityTemplate = {
  id: 'swimming',
  label: 'Swimming',
  category: 'exercise',
  direction: 'DO',
  defaultName: 'Swimming',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 30 },
  ],
  defaultFrequency: '2x_week',
}

const yoga: ActivityTemplate = {
  id: 'yoga',
  label: 'Yoga',
  category: 'exercise',
  direction: 'DO',
  defaultName: 'Yoga',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 30 },
  ],
  defaultFrequency: '3x_week',
}

const stretching: ActivityTemplate = {
  id: 'stretching',
  label: 'Stretching',
  category: 'exercise',
  direction: 'DO',
  defaultName: 'Stretching',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 15 },
  ],
  defaultFrequency: 'daily',
}

// Personal development ────────────────────────────────────────────────────────

const reading: ActivityTemplate = {
  id: 'reading',
  label: 'Reading',
  category: 'personal_development',
  direction: 'DO',
  defaultName: 'Reading',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 20 },
  ],
  defaultFrequency: 'daily',
}

const learning: ActivityTemplate = {
  id: 'learning',
  label: 'Learning',
  category: 'personal_development',
  direction: 'DO',
  defaultName: 'Learning',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 30 },
  ],
  defaultFrequency: 'daily',
}

const practiceSkill: ActivityTemplate = {
  id: 'practice-skill',
  label: 'Practice a skill',
  category: 'personal_development',
  direction: 'DO',
  defaultName: 'Practice a skill',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 20 },
  ],
  defaultFrequency: '3x_week',
}

const meditation: ActivityTemplate = {
  id: 'meditation',
  label: 'Meditation',
  category: 'personal_development',
  direction: 'DO',
  defaultName: 'Meditation',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 10 },
  ],
  defaultFrequency: 'daily',
}

const journaling: ActivityTemplate = {
  id: 'journaling',
  label: 'Journaling',
  category: 'personal_development',
  direction: 'DO',
  defaultName: 'Journaling',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 10 },
  ],
  defaultFrequency: 'daily',
}

// Daily life ──────────────────────────────────────────────────────────────────

const morningRoutine: ActivityTemplate = {
  id: 'morning-routine',
  label: 'Morning routine',
  category: 'daily_life',
  direction: 'DO',
  defaultName: 'Morning routine',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 30 },
  ],
  defaultFrequency: 'daily',
}

const eveningRoutine: ActivityTemplate = {
  id: 'evening-routine',
  label: 'Evening routine',
  category: 'daily_life',
  direction: 'DO',
  defaultName: 'Evening routine',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 30 },
  ],
  defaultFrequency: 'daily',
}

const goOutside: ActivityTemplate = {
  id: 'go-outside',
  label: 'Go outside',
  category: 'daily_life',
  direction: 'DO',
  defaultName: 'Go outside',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 20 },
  ],
  defaultFrequency: 'daily',
}

// Breaking habits ─────────────────────────────────────────────────────────────

const noSmoking: ActivityTemplate = {
  id: 'no-smoking',
  label: 'No smoking',
  category: 'breaking_habits',
  direction: 'AVOID',
  defaultName: 'No smoking',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  suggestedChallengeDays: 30,
}

const noFastFood: ActivityTemplate = {
  id: 'no-fast-food',
  label: 'No fast food',
  category: 'breaking_habits',
  direction: 'AVOID',
  defaultName: 'No fast food',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  suggestedChallengeDays: 30,
}

const noSocialMedia: ActivityTemplate = {
  id: 'no-social-media',
  label: 'No social media',
  category: 'breaking_habits',
  direction: 'AVOID',
  defaultName: 'No social media',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
}

const noAlcohol: ActivityTemplate = {
  id: 'no-alcohol',
  label: 'No alcohol',
  category: 'breaking_habits',
  direction: 'AVOID',
  defaultName: 'No alcohol',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  suggestedChallengeDays: 30,
}

const noUnnecessarySpending: ActivityTemplate = {
  id: 'no-unnecessary-spending',
  label: 'No unnecessary spending',
  category: 'breaking_habits',
  direction: 'AVOID',
  defaultName: 'No unnecessary spending',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
}

// Custom sentinel ─────────────────────────────────────────────────────────────

/** Always present — lets the user define an activity from scratch. */
export const customTemplate: ActivityTemplate = {
  id: 'custom',
  label: 'Something else',
  category: 'custom',
  direction: 'DO',
  defaultName: '',
  defaultMeasurements: [],
  defaultFrequency: '3x_week',
  isCustom: true,
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/** All exercise templates (DO direction). */
export const exerciseTemplates: ActivityTemplate[] = [
  strengthWorkout,
  running,
  walking,
  cycling,
  swimming,
  yoga,
  stretching,
]

/** All personal development templates (DO direction). */
export const personalDevelopmentTemplates: ActivityTemplate[] = [
  reading,
  learning,
  practiceSkill,
  meditation,
  journaling,
]

/** All daily life templates (DO direction). */
export const dailyLifeTemplates: ActivityTemplate[] = [
  morningRoutine,
  eveningRoutine,
  goOutside,
]

/** All breaking-habits templates (AVOID direction). */
export const breakingHabitsTemplates: ActivityTemplate[] = [
  noSmoking,
  noFastFood,
  noSocialMedia,
  noAlcohol,
  noUnnecessarySpending,
]

/** All DO templates across all categories, followed by the custom sentinel. */
export const doTemplates: ActivityTemplate[] = [
  ...exerciseTemplates,
  ...personalDevelopmentTemplates,
  ...dailyLifeTemplates,
  customTemplate,
]

/** All AVOID templates, followed by the custom sentinel. */
export const avoidTemplates: ActivityTemplate[] = [
  ...breakingHabitsTemplates,
  customTemplate,
]

/** Every template in the catalogue, including the custom sentinel. */
export const allTemplates: ActivityTemplate[] = [
  ...exerciseTemplates,
  ...personalDevelopmentTemplates,
  ...dailyLifeTemplates,
  ...breakingHabitsTemplates,
  customTemplate,
]

/**
 * Look up a template by its stable id.
 * Returns undefined when no match is found.
 */
export function findTemplate(id: string): ActivityTemplate | undefined {
  return allTemplates.find((t) => t.id === id)
}

/**
 * Return the templates appropriate for the chosen direction,
 * always including the custom sentinel at the end.
 */
export function templatesForDirection(direction: Direction): ActivityTemplate[] {
  return direction === 'DO' ? doTemplates : avoidTemplates
}
