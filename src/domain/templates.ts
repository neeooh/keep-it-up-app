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
 * Return short positive-outcome badges for the given activity.
 * Each badge is a concise outcome phrase (2–4 words).
 * Used as inline selectable pills on PlanReview and EditRoutine screens.
 */
export function motivationOptions(templateId?: string | null, activityName?: string): string[] {
  const byTemplate: Record<string, string[]> = {
    'strength-workout': ['Feel strong', 'Build discipline', 'Look my best', 'Gain confidence'],
    'running': ['Run a 10K', 'Feel free', 'More energy', 'Clear my head'],
    'walking': ['Move more', 'Fresh air daily', 'Clear my head', 'Feel grounded'],
    'cycling': ['Explore more', 'Stay active', 'Build endurance', 'Feel free'],
    'swimming': ['Feel weightless', 'Full-body strength', 'Clear my mind', 'Stay fit'],
    'yoga': ['Feel calm', 'Less stress', 'Stay flexible', 'Start centered'],
    'stretching': ['Feel loose', 'Prevent injury', 'Move better', 'Morning ritual'],
    'reading': ['Learn more', 'Screen-free time', 'Finish more books', 'Grow daily'],
    'learning': ['Grow my skills', 'Stay sharp', 'Invest in myself', 'Stay curious'],
    'practice-skill': ['Improve weekly', 'Master my craft', 'Stay dedicated', 'See progress'],
    'meditation': ['Calm mind', 'Less stress', 'More clarity', 'Inner peace'],
    'journaling': ['Know myself', 'Process thoughts', 'Track growth', 'Daily reflection'],
    'go-outside': ['Fresh air', 'Feel alive', 'Break the cycle', 'Daylight daily'],
    'no-smoking': ['Breathe free', 'Protect my health', 'Stay in control', 'Save money'],
    'no-fast-food': ['Eat clean', 'More energy', 'Feel lighter', 'Save money'],
    'no-social-media': ['Reclaim time', 'More focus', 'Be present', 'Less noise'],
    'no-alcohol': ['Clear mornings', 'Better sleep', 'Sharp mind', 'Stay in control'],
    'no-unnecessary-spending': ['Save more', 'Spend with purpose', 'Peace of mind', 'Stay intentional'],
  }

  if (templateId && byTemplate[templateId]) {
    return byTemplate[templateId]
  }

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

  return ['Be consistent', 'Feel proud', 'Build discipline', 'Better myself']
}

/**
 * Return a deeply personal, emotionally honest placeholder for the
 * free-text motivation field. These speak to the raw human reason
 * underneath the rational goals — the thing you would say to yourself
 * when no one is listening.
 */
export function emotionalPlaceholder(templateId?: string | null, activityName?: string): string {
  const byTemplate: Record<string, string> = {
    'strength-workout': 'I am tired of feeling weak and unsure of myself',
    'running': 'I need to outrun the version of me that gave up',
    'walking': 'I have been stuck inside my own head for too long',
    'cycling': 'I need to feel the wind and remember I am alive',
    'swimming': 'I want to feel weightless, even just for a moment',
    'yoga': 'My body carries everything and I never let it rest',
    'stretching': 'I wake up stiff and tired and I want that to stop',
    'reading': 'I have been numbing myself with screens and I want my mind back',
    'learning': 'I am afraid of standing still while the world moves on',
    'practice-skill': 'I need to prove to myself that I can still grow',
    'meditation': 'My mind will not stop and I need to find some peace',
    'journaling': 'I have things inside me that I have never said out loud',
    'go-outside': 'I have been hiding from the world and I need to step back in',
    'no-smoking': 'I am scared of what this is doing to me',
    'no-fast-food': 'I do not recognise the person I see in the mirror',
    'no-social-media': 'I have been comparing myself to everyone and it is breaking me',
    'no-alcohol': 'I do not like who I become when I drink',
    'no-unnecessary-spending': 'I am anxious every time I check my account',
  }

  if (templateId && byTemplate[templateId]) return byTemplate[templateId]

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

  return 'Something needs to change and this is where I start'
}
