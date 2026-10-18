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
  /** Default preferred time of day. Applied to draft during onboarding. */
  defaultPreferredTime?: string
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
  defaultPreferredTime: 'Morning',
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
  defaultPreferredTime: 'Morning',
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
  defaultPreferredTime: 'Evening',
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
  defaultPreferredTime: 'Morning',
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
  defaultPreferredTime: 'Morning',
}

// Daily life ──────────────────────────────────────────────────────────────────

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
  defaultPreferredTime: 'Morning',
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

/**
 * Determine whether a template requires the configure-activity screen.
 *
 * Returns true for:
 * - null (no template — user must type a name)
 * - custom templates (isCustom: true — user must type a name)
 * - strength templates (has 'sets' measurement — user builds exercise list)
 *
 * Returns false for everything else: the template already provides a name
 * and sensible measurement defaults, so the configure screen adds no value.
 */
export function needsConfigureScreen(template: ActivityTemplate | null | undefined): boolean {
  if (!template) return true
  if (template.isCustom) return true
  return template.defaultMeasurements.some((m) => m.type === 'sets')
}

/**
 * Return predefined motivation options for the given activity.
 * Each option starts with "I want to..." and is specific to the template
 * or activity name. The last option is always a custom free-text sentinel.
 *
 * Used as selectable badges on the PlanReview and EditRoutine screens.
 */
export function motivationOptions(templateId?: string | null, activityName?: string): string[] {
  // Match by template ID first (most specific).
  const byTemplate: Record<string, string[]> = {
    'strength-workout': [
      'I want to feel strong and confident',
      'I want to build discipline through training',
      'I want to look and feel my best',
    ],
    'running': [
      'I want to run a 10K',
      'I want to feel that runner\'s freedom',
      'I want more energy throughout the day',
    ],
    'walking': [
      'I want to clear my head every day',
      'I want to move more and sit less',
      'I want fresh air and daylight daily',
    ],
    'cycling': [
      'I want to explore new places on two wheels',
      'I want a fun way to stay active',
      'I want to build endurance',
    ],
    'swimming': [
      'I want a workout that clears my mind',
      'I want to build full-body strength',
      'I want to feel weightless and free',
    ],
    'yoga': [
      'I want to feel calm and flexible',
      'I want to reduce stress and tension',
      'I want to start my day centered',
    ],
    'stretching': [
      'I want to start every day feeling loose',
      'I want to prevent stiffness and injury',
      'I want to move better as I age',
    ],
    'reading': [
      'I want to learn more and grow',
      'I want to unwind without a screen',
      'I want to finish more books this year',
    ],
    'learning': [
      'I want to grow my skills',
      'I want to invest in myself',
      'I want to stay curious and sharp',
    ],
    'practice-skill': [
      'I want to get noticeably better each week',
      'I want to master something I care about',
      'I want to prove to myself I can improve',
    ],
    'meditation': [
      'I want a calmer mind',
      'I want less stress and more clarity',
      'I want to respond rather than react',
    ],
    'journaling': [
      'I want to understand myself better',
      'I want to process my thoughts on paper',
      'I want to track my growth over time',
    ],
    'go-outside': [
      'I want fresh air and daylight every day',
      'I want to break the indoor cycle',
      'I want to feel connected to the world',
    ],
    'no-smoking': [
      'I want to breathe freely again',
      'I want to protect my health',
      'I want to prove I am in control',
    ],
    'no-fast-food': [
      'I want to feel better about what I eat',
      'I want more energy and less sluggishness',
      'I want to save money and eat well',
    ],
    'no-social-media': [
      'I want to reclaim my time',
      'I want more focus and less distraction',
      'I want to be present in real life',
    ],
    'no-alcohol': [
      'I want clearer mornings',
      'I want sharper thinking and better sleep',
      'I want to prove I do not need it',
    ],
    'no-unnecessary-spending': [
      'I want to save for something that matters',
      'I want to be intentional with my money',
      'I want financial peace of mind',
    ],
  }

  if (templateId && byTemplate[templateId]) {
    return byTemplate[templateId]
  }

  // Fallback: match by activity name keywords.
  const name = activityName?.toLowerCase() ?? ''
  if (name.includes('meditat')) return byTemplate['meditation']!
  if (name.includes('journal')) return byTemplate['journaling']!
  if (name.includes('read')) return byTemplate['reading']!
  if (name.includes('yoga')) return byTemplate['yoga']!
  if (name.includes('run')) return byTemplate['running']!
  if (name.includes('walk')) return byTemplate['walking']!
  if (name.includes('swim')) return byTemplate['swimming']!
  if (name.includes('stretch')) return byTemplate['stretching']!
  if (name.includes('smok')) return byTemplate['no-smoking']!
  if (name.includes('alcohol') || name.includes('drink')) return byTemplate['no-alcohol']!
  if (name.includes('social media')) return byTemplate['no-social-media']!

  // Generic fallback
  return [
    'I want to build a better version of myself',
    'I want to prove I can stay consistent',
    'I want to feel proud of showing up',
  ]
}
