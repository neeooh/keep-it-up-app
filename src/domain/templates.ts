/**
 * Predefined activity template catalogue.
 *
 * Templates are pure data — presets that provide sensible defaults a user
 * can modify when creating a commitment.  They are not fixed domain objects.
 */

import type { Commitment, CompletionMethod, Direction, Frequency, MeasurementConfig } from './types'

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
  /** Clear instruction for what the user should do. */
  instruction: string
  defaultMeasurements: MeasurementConfig[]
  defaultFrequency: Frequency
  /** How this commitment is marked complete. Defaults to 'binary'. */
  defaultCompletionMethod: CompletionMethod
  /** Default preferred time of day. Applied during creation. */
  defaultPreferredTime?: string
  /** Suggested challenge duration in days. */
  suggestedChallengeDays?: 30 | 60 | 90
  /**
   * True for the "Create your own" sentinel.
   * When selected the user fills in every field from scratch.
   */
  isCustom?: boolean
}

// ─── Categories ───────────────────────────────────────────────────────────────

export type TemplateCategory =
  // Build (DO) categories
  | 'movement'
  | 'mindfulness'
  | 'learning'
  | 'personal_growth'
  | 'relationships'
  | 'self_care'
  // Break (AVOID) categories
  | 'substances'
  | 'food'
  | 'digital'
  | 'behaviour'
  // Sentinel
  | 'custom'

/** Categories shown in Build mode. */
export const BUILD_CATEGORIES: { key: TemplateCategory; label: string }[] = [
  { key: 'movement', label: 'Movement' },
  { key: 'mindfulness', label: 'Mindfulness' },
  { key: 'learning', label: 'Learning' },
  { key: 'personal_growth', label: 'Personal growth' },
  { key: 'relationships', label: 'Relationships' },
  { key: 'self_care', label: 'Self-care' },
]

/** Categories shown in Break mode. */
export const BREAK_CATEGORIES: { key: TemplateCategory; label: string }[] = [
  { key: 'substances', label: 'Substances' },
  { key: 'food', label: 'Food' },
  { key: 'digital', label: 'Digital' },
  { key: 'behaviour', label: 'Behaviour' },
]

// ─── Build templates ──────────────────────────────────────────────────────────

// Movement ────────────────────────────────────────────────────────────────────

const strengthWorkout: ActivityTemplate = {
  id: 'strength-workout',
  label: 'Strength workout',
  category: 'movement',
  direction: 'DO',
  defaultName: 'Strength workout',
  instruction: 'Complete a strength training session.',
  defaultMeasurements: [
    { type: 'sets', target: 3 },
    { type: 'reps', target: 10 },
    { type: 'weight', unit: 'kg' },
  ],
  defaultFrequency: '3x_week',
  defaultCompletionMethod: 'detailed',
}

const running: ActivityTemplate = {
  id: 'running',
  label: 'Running',
  category: 'movement',
  direction: 'DO',
  defaultName: 'Running',
  instruction: 'Go for a run.',
  defaultMeasurements: [
    { type: 'distance', unit: 'km', target: 5 },
    { type: 'duration', unit: 'min', target: 30 },
  ],
  defaultFrequency: '2x_week',
  defaultCompletionMethod: 'binary',
}

const walking: ActivityTemplate = {
  id: 'walking',
  label: 'Walking',
  category: 'movement',
  direction: 'DO',
  defaultName: 'Walking',
  instruction: 'Go for a walk.',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 30 },
  ],
  defaultFrequency: '3x_week',
  defaultCompletionMethod: 'binary',
}

const cycling: ActivityTemplate = {
  id: 'cycling',
  label: 'Cycling',
  category: 'movement',
  direction: 'DO',
  defaultName: 'Cycling',
  instruction: 'Go for a bike ride.',
  defaultMeasurements: [
    { type: 'distance', unit: 'km', target: 20 },
    { type: 'duration', unit: 'min', target: 45 },
  ],
  defaultFrequency: '2x_week',
  defaultCompletionMethod: 'binary',
}

const swimming: ActivityTemplate = {
  id: 'swimming',
  label: 'Swimming',
  category: 'movement',
  direction: 'DO',
  defaultName: 'Swimming',
  instruction: 'Swim some laps.',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 30 },
  ],
  defaultFrequency: '2x_week',
  defaultCompletionMethod: 'binary',
}

const stretching: ActivityTemplate = {
  id: 'stretching',
  label: 'Stretching',
  category: 'movement',
  direction: 'DO',
  defaultName: 'Stretching',
  instruction: 'Stretch your body for a few minutes.',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 15 },
  ],
  defaultFrequency: 'daily',
  defaultPreferredTime: 'Morning',
  defaultCompletionMethod: 'binary',
}

// Mindfulness ─────────────────────────────────────────────────────────────────

const meditation: ActivityTemplate = {
  id: 'meditation',
  label: 'Meditation',
  category: 'mindfulness',
  direction: 'DO',
  defaultName: 'Meditation',
  instruction: 'Sit quietly and focus on your breathing.',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 10 },
  ],
  defaultFrequency: 'daily',
  defaultPreferredTime: 'Morning',
  defaultCompletionMethod: 'binary',
}

const yoga: ActivityTemplate = {
  id: 'yoga',
  label: 'Yoga',
  category: 'mindfulness',
  direction: 'DO',
  defaultName: 'Yoga',
  instruction: 'Do a yoga session.',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 30 },
  ],
  defaultFrequency: '3x_week',
  defaultPreferredTime: 'Morning',
  defaultCompletionMethod: 'binary',
}

const gratitude: ActivityTemplate = {
  id: 'gratitude',
  label: 'Gratitude',
  category: 'mindfulness',
  direction: 'DO',
  defaultName: 'Gratitude',
  instruction: 'Write down three things you are grateful for.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  defaultPreferredTime: 'Evening',
  defaultCompletionMethod: 'binary',
}

// Learning ────────────────────────────────────────────────────────────────────

const reading: ActivityTemplate = {
  id: 'reading',
  label: 'Reading',
  category: 'learning',
  direction: 'DO',
  defaultName: 'Reading',
  instruction: 'Read for a while.',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 20 },
  ],
  defaultFrequency: 'daily',
  defaultPreferredTime: 'Evening',
  defaultCompletionMethod: 'binary',
}

const learningTemplate: ActivityTemplate = {
  id: 'learning',
  label: 'Learning',
  category: 'learning',
  direction: 'DO',
  defaultName: 'Learning',
  instruction: 'Study or learn something new.',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 30 },
  ],
  defaultFrequency: 'daily',
  defaultCompletionMethod: 'binary',
}

const practiceSkill: ActivityTemplate = {
  id: 'practice-skill',
  label: 'Practice a skill',
  category: 'learning',
  direction: 'DO',
  defaultName: 'Practice a skill',
  instruction: 'Practise your chosen skill.',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 20 },
  ],
  defaultFrequency: '3x_week',
  defaultCompletionMethod: 'binary',
}

// Personal growth ─────────────────────────────────────────────────────────────

const journaling: ActivityTemplate = {
  id: 'journaling',
  label: 'Journaling',
  category: 'personal_growth',
  direction: 'DO',
  defaultName: 'Journaling',
  instruction: 'Write honestly about what is on your mind.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  defaultPreferredTime: 'Morning',
  defaultCompletionMethod: 'binary',
}

const goOutside: ActivityTemplate = {
  id: 'go-outside',
  label: 'Go outside',
  category: 'personal_growth',
  direction: 'DO',
  defaultName: 'Go outside',
  instruction: 'Step outside and spend time in fresh air.',
  defaultMeasurements: [
    { type: 'duration', unit: 'min', target: 20 },
  ],
  defaultFrequency: 'daily',
  defaultPreferredTime: 'Morning',
  defaultCompletionMethod: 'binary',
}

const eveningReflection: ActivityTemplate = {
  id: 'evening-reflection',
  label: 'Evening reflection',
  category: 'personal_growth',
  direction: 'DO',
  defaultName: 'Evening reflection',
  instruction: 'Think about one thing you did well today.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  defaultPreferredTime: 'Evening',
  defaultCompletionMethod: 'binary',
}

// Relationships ───────────────────────────────────────────────────────────────

const callAFriend: ActivityTemplate = {
  id: 'call-a-friend',
  label: 'Call a friend',
  category: 'relationships',
  direction: 'DO',
  defaultName: 'Call a friend',
  instruction: 'Call or message someone you care about.',
  defaultMeasurements: [],
  defaultFrequency: '1x_week',
  defaultCompletionMethod: 'binary',
}

const qualityTime: ActivityTemplate = {
  id: 'quality-time',
  label: 'Quality time',
  category: 'relationships',
  direction: 'DO',
  defaultName: 'Quality time',
  instruction: 'Spend focused time with someone important to you.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  defaultPreferredTime: 'Evening',
  defaultCompletionMethod: 'binary',
}

const actOfKindness: ActivityTemplate = {
  id: 'act-of-kindness',
  label: 'Act of kindness',
  category: 'relationships',
  direction: 'DO',
  defaultName: 'Act of kindness',
  instruction: 'Do one deliberate kind thing for someone else.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  defaultCompletionMethod: 'binary',
}

// Self-care ───────────────────────────────────────────────────────────────────

const skinCare: ActivityTemplate = {
  id: 'skin-care',
  label: 'Skin care',
  category: 'self_care',
  direction: 'DO',
  defaultName: 'Skin care',
  instruction: 'Do your skin care routine.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  defaultPreferredTime: 'Morning',
  defaultCompletionMethod: 'binary',
}

const sleepByTen: ActivityTemplate = {
  id: 'sleep-by-ten',
  label: 'Sleep by 10 PM',
  category: 'self_care',
  direction: 'DO',
  defaultName: 'Sleep by 10 PM',
  instruction: 'Be in bed with lights off by 10 PM.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  defaultPreferredTime: 'Evening',
  defaultCompletionMethod: 'binary',
}

const drinkWater: ActivityTemplate = {
  id: 'drink-water',
  label: 'Drink water',
  category: 'self_care',
  direction: 'DO',
  defaultName: 'Drink water',
  instruction: 'Drink at least 2 litres of water today.',
  defaultMeasurements: [
    { type: 'quantity', target: 2 },
  ],
  defaultFrequency: 'daily',
  defaultCompletionMethod: 'binary',
}

// ─── Break templates ──────────────────────────────────────────────────────────

// Substances ──────────────────────────────────────────────────────────────────

const noSmoking: ActivityTemplate = {
  id: 'no-smoking',
  label: 'No smoking',
  category: 'substances',
  direction: 'AVOID',
  defaultName: 'No smoking',
  instruction: 'Avoid smoking today.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  suggestedChallengeDays: 30,
  defaultCompletionMethod: 'binary',
}

const noAlcohol: ActivityTemplate = {
  id: 'no-alcohol',
  label: 'No alcohol',
  category: 'substances',
  direction: 'AVOID',
  defaultName: 'No alcohol',
  instruction: 'Avoid alcohol today.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  suggestedChallengeDays: 30,
  defaultCompletionMethod: 'binary',
}

// Food ────────────────────────────────────────────────────────────────────────

const noFastFood: ActivityTemplate = {
  id: 'no-fast-food',
  label: 'No fast food',
  category: 'food',
  direction: 'AVOID',
  defaultName: 'No fast food',
  instruction: 'Avoid fast food today.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  suggestedChallengeDays: 30,
  defaultCompletionMethod: 'binary',
}

const noSnacking: ActivityTemplate = {
  id: 'no-snacking',
  label: 'No snacking',
  category: 'food',
  direction: 'AVOID',
  defaultName: 'No snacking',
  instruction: 'Avoid snacking between meals today.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  defaultCompletionMethod: 'binary',
}

// Digital ─────────────────────────────────────────────────────────────────────

const noSocialMedia: ActivityTemplate = {
  id: 'no-social-media',
  label: 'No social media',
  category: 'digital',
  direction: 'AVOID',
  defaultName: 'No social media',
  instruction: 'Avoid social media today.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  defaultCompletionMethod: 'binary',
}

const noScreensAfterTen: ActivityTemplate = {
  id: 'no-screens-after-ten',
  label: 'No screens after 10 PM',
  category: 'digital',
  direction: 'AVOID',
  defaultName: 'No screens after 10 PM',
  instruction: 'Put all screens away after 10 PM.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  defaultPreferredTime: 'Evening',
  defaultCompletionMethod: 'binary',
}

// Behaviour ───────────────────────────────────────────────────────────────────

const noUnnecessarySpending: ActivityTemplate = {
  id: 'no-unnecessary-spending',
  label: 'No unnecessary spending',
  category: 'behaviour',
  direction: 'AVOID',
  defaultName: 'No unnecessary spending',
  instruction: 'Avoid non-essential purchases today.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  defaultCompletionMethod: 'binary',
}

const noProcrastinating: ActivityTemplate = {
  id: 'no-procrastinating',
  label: 'No procrastinating',
  category: 'behaviour',
  direction: 'AVOID',
  defaultName: 'No procrastinating',
  instruction: 'Start your most important task first.',
  defaultMeasurements: [],
  defaultFrequency: 'daily',
  defaultPreferredTime: 'Morning',
  defaultCompletionMethod: 'binary',
}

// Custom sentinel ─────────────────────────────────────────────────────────────

/** Always present — lets the user define a commitment from scratch. */
export const customTemplate: ActivityTemplate = {
  id: 'custom',
  label: 'Create your own',
  category: 'custom',
  direction: 'DO',
  defaultName: '',
  instruction: '',
  defaultMeasurements: [],
  defaultFrequency: '3x_week',
  defaultCompletionMethod: 'binary',
  isCustom: true,
}

// ─── Template collections ─────────────────────────────────────────────────────

/** All Build (DO) templates by category. */
const buildTemplates: ActivityTemplate[] = [
  // Movement
  strengthWorkout, running, walking, cycling, swimming, stretching,
  // Mindfulness
  meditation, yoga, gratitude,
  // Learning
  reading, learningTemplate, practiceSkill,
  // Personal growth
  journaling, goOutside, eveningReflection,
  // Relationships
  callAFriend, qualityTime, actOfKindness,
  // Self-care
  skinCare, sleepByTen, drinkWater,
]

/** All Break (AVOID) templates by category. */
const breakTemplates: ActivityTemplate[] = [
  // Substances
  noSmoking, noAlcohol,
  // Food
  noFastFood, noSnacking,
  // Digital
  noSocialMedia, noScreensAfterTen,
  // Behaviour
  noUnnecessarySpending, noProcrastinating,
]

/** Every template in the catalogue, including the custom sentinel. */
export const allTemplates: ActivityTemplate[] = [
  ...buildTemplates,
  ...breakTemplates,
  customTemplate,
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/**
 * Look up a template by its stable id.
 * Returns undefined when no match is found.
 */
export function findTemplate(id: string): ActivityTemplate | undefined {
  return allTemplates.find((t) => t.id === id)
}

/**
 * Return templates for the given mode (Build or Break).
 * Build returns all DO templates. Break returns all AVOID templates.
 */
export function templatesForMode(mode: 'build' | 'break'): ActivityTemplate[] {
  return mode === 'build' ? buildTemplates : breakTemplates
}

/**
 * Return templates that belong to a specific category.
 */
export function templatesByCategory(category: TemplateCategory): ActivityTemplate[] {
  return allTemplates.filter((t) => t.category === category)
}

/**
 * Determine whether a template requires the detailed session screen.
 *
 * Returns true for:
 * - null (no template — user must type a name)
 * - custom templates (isCustom: true — user must type a name)
 * - strength templates (has 'sets' measurement — user builds exercise list)
 *
 * Returns false for everything else.
 */
export function needsConfigureScreen(template: ActivityTemplate | null | undefined): boolean {
  if (!template) return true
  if (template.isCustom) return true
  return template.defaultMeasurements.some((m) => m.type === 'sets')
}

// ─── Motivation helpers ───────────────────────────────────────────────────────

/**
 * Return short positive-outcome badges for the given activity.
 * Each badge is a concise outcome phrase (2-3 words). 7 options per
 * template to fill two rows of inline pills on a mobile viewport.
 * The user can select up to 3.
 */
export function motivationOptions(templateId?: string | null, activityName?: string): string[] {
  const byTemplate: Record<string, string[]> = {
    'strength-workout': ['Feel strong', 'Build muscle', 'More discipline', 'Look my best', 'Gain confidence', 'Push limits', 'Stay sharp'],
    'running': ['Run a 10K', 'Feel free', 'More energy', 'Clear my head', 'Lose weight', 'Sleep better', 'Beat stress'],
    'walking': ['Move more', 'Fresh air', 'Clear my head', 'Feel grounded', 'Less stress', 'Stay active', 'Think better'],
    'cycling': ['Explore more', 'Stay fit', 'Build endurance', 'Feel free', 'Save fuel', 'More energy', 'Beat stress'],
    'swimming': ['Feel weightless', 'Full-body fit', 'Clear my mind', 'Stay lean', 'More stamina', 'Less pain', 'Feel alive'],
    'yoga': ['Feel calm', 'Less stress', 'Stay flexible', 'Start centered', 'Sleep better', 'Breathe deep', 'Find balance'],
    'stretching': ['Feel loose', 'Less stiffness', 'Move better', 'Morning ritual', 'Prevent injury', 'More range', 'Feel younger'],
    'reading': ['Learn more', 'No screens', 'Finish books', 'Grow daily', 'Relax more', 'Stay curious', 'Feed my mind'],
    'learning': ['Grow skills', 'Stay sharp', 'Invest in me', 'Stay curious', 'Get ahead', 'Know more', 'Level up'],
    'practice-skill': ['Get better', 'See progress', 'Master it', 'Stay dedicated', 'Build skill', 'Prove myself', 'Stay focused'],
    'meditation': ['Calm mind', 'Less stress', 'More clarity', 'Inner peace', 'Sleep better', 'Stay present', 'Let go'],
    'journaling': ['Know myself', 'Clear thoughts', 'Track growth', 'Daily ritual', 'Less anxiety', 'Find clarity', 'Heal slowly'],
    'go-outside': ['Fresh air', 'Feel alive', 'See the sky', 'Break routine', 'More daylight', 'Move freely', 'Reset mind'],
    'gratitude': ['Feel grateful', 'See the good', 'More joy', 'Less worry', 'Sleep better', 'Stay positive', 'Notice more'],
    'evening-reflection': ['Know myself', 'End well', 'Learn daily', 'Sleep better', 'Less worry', 'Find peace', 'Grow slowly'],
    'call-a-friend': ['Stay close', 'Feel loved', 'Be present', 'Less lonely', 'Real talks', 'Give back', 'Stay human'],
    'quality-time': ['Be present', 'Feel close', 'Less screens', 'Build trust', 'More joy', 'Real life', 'Stay grounded'],
    'act-of-kindness': ['Feel good', 'Give back', 'Spread joy', 'Be present', 'More love', 'Stay human', 'Small wins'],
    'skin-care': ['Feel fresh', 'Look better', 'Self-love', 'Morning ritual', 'Take care', 'Glow up', 'Feel clean'],
    'sleep-by-ten': ['More rest', 'Better mornings', 'More energy', 'Think clearly', 'Less stress', 'Feel human', 'Stay sharp'],
    'drink-water': ['Stay hydrated', 'More energy', 'Clear skin', 'Feel better', 'Less tired', 'Think clearly', 'Simple win'],
    'no-smoking': ['Breathe free', 'Stay healthy', 'Save money', 'Stay in control', 'Smell better', 'More energy', 'Live longer'],
    'no-fast-food': ['Eat clean', 'More energy', 'Feel lighter', 'Save money', 'Look better', 'Clear skin', 'Stay sharp'],
    'no-snacking': ['Eat clean', 'Feel lighter', 'Less sugar', 'More control', 'Better meals', 'Save money', 'Stay sharp'],
    'no-social-media': ['Reclaim time', 'More focus', 'Be present', 'Less noise', 'Real life', 'Less anxiety', 'Think clearly'],
    'no-screens-after-ten': ['Better sleep', 'Calm evenings', 'Less blue light', 'More rest', 'Be present', 'Read instead', 'Wind down'],
    'no-alcohol': ['Clear mornings', 'Better sleep', 'Sharp mind', 'Stay in control', 'Save money', 'More energy', 'Feel proud'],
    'no-unnecessary-spending': ['Save more', 'Less stress', 'Be intentional', 'Peace of mind', 'Build wealth', 'Buy less', 'Feel free'],
    'no-procrastinating': ['Get it done', 'Less stress', 'Feel free', 'More time', 'Stay sharp', 'Prove it', 'Win mornings'],
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

  return ['Be consistent', 'Feel proud', 'Build discipline', 'Better myself', 'Stay focused', 'Show up daily', 'Prove it']
}

/** Maximum number of motivation badges the user can select. */
export const MAX_MOTIVATION_BADGES = 3

/**
 * Return a deeply personal placeholder for the free-text motivation field.
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
    'gratitude': 'I forget to see the good in my life and I want that to change',
    'evening-reflection': 'I rush through my days and never stop to think',
    'call-a-friend': 'I have been distant from the people who matter most',
    'quality-time': 'I am present in body but absent in mind too often',
    'act-of-kindness': 'I have been so focused on myself that I forgot about others',
    'skin-care': 'I have stopped taking care of myself and it shows',
    'sleep-by-ten': 'I stay up too late doing nothing and pay for it every morning',
    'drink-water': 'I neglect the simplest things that keep me well',
    'no-smoking': 'I am scared of what this is doing to me',
    'no-fast-food': 'I do not recognise the person I see in the mirror',
    'no-snacking': 'I eat when I am not hungry and I know why',
    'no-social-media': 'I have been comparing myself to everyone and it is breaking me',
    'no-screens-after-ten': 'I scroll until I cannot think and then I wonder why I cannot sleep',
    'no-alcohol': 'I do not like who I become when I drink',
    'no-unnecessary-spending': 'I am anxious every time I check my account',
    'no-procrastinating': 'I keep putting off the thing I know I need to do',
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

// ─── Paths ────────────────────────────────────────────────────────────────────

/**
 * A path is a curated collection of commitments inspired by a real person
 * or philosophy. The user taps one card and gets a fully configured set of
 * commitments without going through the creation form.
 */
export interface Path {
  /** Stable identifier. */
  id: string
  /** Display name shown on the card. */
  name: string
  /** Short tagline (1 line). */
  tagline: string
  /** Emoji or short icon hint for the card. */
  emoji: string
  /** The motivation text stored on each created commitment. */
  motivation: string
  /** Factory: builds one Commitment per activity with fresh IDs and timestamps. */
  buildCommitments: () => Commitment[]
}

/** Helper: build one commitment per activity definition, sharing the same motivation. */
function buildSeparateCommitments(
  motivation: string,
  activities: { name: string; description?: string; instruction?: string; direction: 'DO' | 'AVOID'; measurements: MeasurementConfig[]; frequency: Frequency; preferredTime?: string; scheduledDays?: (1|2|3|4|5|6|7)[] }[],
): Commitment[] {
  const now = new Date().toISOString()
  return activities.map((a) => ({
    id: crypto.randomUUID(),
    name: a.name,
    createdAt: now,
    motivation,
    activities: [{
      id: crypto.randomUUID(),
      name: a.name,
      description: a.description,
      instruction: a.instruction,
      direction: a.direction,
      measurements: a.measurements,
      frequency: a.frequency,
      preferredTime: a.preferredTime,
      scheduledDays: a.scheduledDays,
    }],
  }))
}

export const paths: Path[] = [
  {
    id: 'stoic',
    name: 'The Stoic',
    tagline: 'Discipline, reflection, and daily practice',
    emoji: '🏛️',
    motivation: 'You have power over your mind, not outside events. Realise this, and you will find strength.',
    buildCommitments: () => buildSeparateCommitments(
      'You have power over your mind, not outside events. Realise this, and you will find strength.',
      [
        { name: 'Morning journaling', description: 'Write 3 things on your mind', instruction: 'Write honestly about what is on your mind.', direction: 'DO', measurements: [{ type: 'duration', unit: 'min', target: 10 }], frequency: 'daily', preferredTime: 'Morning' },
        { name: 'Reading', description: 'A few pages of something meaningful', instruction: 'Read for a while.', direction: 'DO', measurements: [{ type: 'duration', unit: 'min', target: 20 }], frequency: 'daily', preferredTime: 'Evening' },
        { name: 'Walking', description: 'Move your body, clear your mind', instruction: 'Go for a walk.', direction: 'DO', measurements: [{ type: 'duration', unit: 'min', target: 30 }], frequency: 'daily', preferredTime: 'Morning' },
        { name: 'Evening reflection', description: 'What went well today?', instruction: 'Think about one thing you did well today.', direction: 'DO', measurements: [{ type: 'duration', unit: 'min', target: 10 }], frequency: 'daily', preferredTime: 'Evening' },
      ],
    ),
  },
  {
    id: 'jesus',
    name: 'The Carpenter',
    tagline: 'Service, stillness, and gratitude',
    emoji: '✝️',
    motivation: 'Love your neighbour as yourself. Start with showing up for your own life.',
    buildCommitments: () => buildSeparateCommitments(
      'Love your neighbour as yourself. Start with showing up for your own life.',
      [
        { name: 'Prayer or meditation', description: 'Be still and listen', instruction: 'Sit quietly and be still.', direction: 'DO', measurements: [{ type: 'duration', unit: 'min', target: 15 }], frequency: 'daily', preferredTime: 'Morning' },
        { name: 'Gratitude journaling', description: 'Write 3 things you are thankful for', instruction: 'Write down three things you are thankful for.', direction: 'DO', measurements: [{ type: 'duration', unit: 'min', target: 10 }], frequency: 'daily', preferredTime: 'Evening' },
        { name: 'Act of kindness', description: 'One deliberate act for someone else', instruction: 'Do one deliberate kind thing for someone else.', direction: 'DO', measurements: [{ type: 'quantity', target: 1 }], frequency: 'daily' },
        { name: 'Walking in nature', description: 'Step outside and be present', instruction: 'Go for a walk in nature.', direction: 'DO', measurements: [{ type: 'duration', unit: 'min', target: 20 }], frequency: '3x_week' },
      ],
    ),
  },
  {
    id: 'peterson',
    name: 'Peterson',
    tagline: 'Order, responsibility, and meaning',
    emoji: '🦞',
    motivation: 'Compare yourself to who you were yesterday, not to who someone else is today.',
    buildCommitments: () => buildSeparateCommitments(
      'Compare yourself to who you were yesterday, not to who someone else is today.',
      [
        { name: 'Clean your room', description: '15 minutes. One area. Start small.', instruction: 'Tidy one area of your space for 15 minutes.', direction: 'DO', measurements: [{ type: 'duration', unit: 'min', target: 15 }], frequency: 'daily', preferredTime: 'Morning' },
        { name: 'Reading', description: 'Something that challenges your thinking', instruction: 'Read something that challenges your thinking.', direction: 'DO', measurements: [{ type: 'duration', unit: 'min', target: 30 }], frequency: 'daily', preferredTime: 'Evening' },
        { name: 'Journaling', description: 'Write honestly about what matters', instruction: 'Write honestly about what matters to you.', direction: 'DO', measurements: [{ type: 'duration', unit: 'min', target: 15 }], frequency: 'daily', preferredTime: 'Evening' },
        { name: 'No unnecessary spending', description: 'Ask: do I need this or want this?', instruction: 'Avoid non-essential purchases today.', direction: 'AVOID', measurements: [], frequency: 'daily' },
      ],
    ),
  },
  {
    id: 'arnold',
    name: 'Arnold',
    tagline: 'Strength, volume, and no excuses',
    emoji: '💪',
    motivation: 'The mind is the limit. As long as the mind can envision that you can do something, you can do it.',
    buildCommitments: () => buildSeparateCommitments(
      'The mind is the limit. As long as the mind can envision that you can do something, you can do it.',
      [
        { name: 'Strength workout', description: 'Push yourself. Log every set.', instruction: 'Complete a strength training session.', direction: 'DO', measurements: [{ type: 'sets', target: 4 }, { type: 'reps', target: 10 }, { type: 'weight', unit: 'kg' }], frequency: 'daily', scheduledDays: [1, 2, 3, 4, 5, 6] },
        { name: 'Cardio', description: '30 minutes. No shortcuts.', instruction: 'Do 30 minutes of cardio.', direction: 'DO', measurements: [{ type: 'duration', unit: 'min', target: 30 }], frequency: '3x_week', scheduledDays: [2, 4, 6] },
        { name: 'No fast food', description: 'Fuel your body, not your cravings', instruction: 'Avoid fast food today.', direction: 'AVOID', measurements: [], frequency: 'daily' },
      ],
    ),
  },
]
