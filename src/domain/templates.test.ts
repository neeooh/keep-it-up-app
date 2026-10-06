/**
 * Tests for src/domain/templates.ts
 *
 * Verifies:
 * - All templates from spec sections 5 and 6 are present
 * - Each template has a valid ActivityTemplate shape
 * - Spec-defined defaults match exactly
 * - The custom sentinel is always included in every direction list
 * - findTemplate and templatesForDirection behave correctly
 */

import { beforeAll, describe, expect, it } from 'vitest'
import {
  allTemplates,
  avoidTemplates,
  breakingHabitsTemplates,
  customTemplate,
  dailyLifeTemplates,
  doTemplates,
  exerciseTemplates,
  findTemplate,
  personalDevelopmentTemplates,
  templatesForDirection,
} from './templates'
import type { ActivityTemplate } from './templates'

// ─── Shape validator ──────────────────────────────────────────────────────────

function isValidTemplate(t: ActivityTemplate): boolean {
  return (
    typeof t.id === 'string' &&
    t.id.length > 0 &&
    typeof t.label === 'string' &&
    t.label.length > 0 &&
    typeof t.defaultName === 'string' &&
    (t.direction === 'DO' || t.direction === 'AVOID') &&
    Array.isArray(t.defaultMeasurements) &&
    typeof t.defaultFrequency === 'string' &&
    typeof t.category === 'string'
  )
}

// ─── Catalogue completeness ───────────────────────────────────────────────────

describe('exercise templates', () => {
  const ids = exerciseTemplates.map((t) => t.id)

  it('contains all 7 exercise templates from the spec', () => {
    expect(ids).toContain('strength-workout')
    expect(ids).toContain('running')
    expect(ids).toContain('walking')
    expect(ids).toContain('cycling')
    expect(ids).toContain('swimming')
    expect(ids).toContain('yoga')
    expect(ids).toContain('stretching')
    expect(exerciseTemplates).toHaveLength(7)
  })

  it('all exercise templates have direction DO', () => {
    expect(exerciseTemplates.every((t) => t.direction === 'DO')).toBe(true)
  })

  it('all exercise templates have valid shapes', () => {
    expect(exerciseTemplates.every(isValidTemplate)).toBe(true)
  })
})

describe('personal development templates', () => {
  const ids = personalDevelopmentTemplates.map((t) => t.id)

  it('contains all 5 personal development templates from the spec', () => {
    expect(ids).toContain('reading')
    expect(ids).toContain('learning')
    expect(ids).toContain('practice-skill')
    expect(ids).toContain('meditation')
    expect(ids).toContain('journaling')
    expect(personalDevelopmentTemplates).toHaveLength(5)
  })

  it('all personal development templates have direction DO', () => {
    expect(personalDevelopmentTemplates.every((t) => t.direction === 'DO')).toBe(true)
  })

  it('all personal development templates have valid shapes', () => {
    expect(personalDevelopmentTemplates.every(isValidTemplate)).toBe(true)
  })
})

describe('daily life templates', () => {
  const ids = dailyLifeTemplates.map((t) => t.id)

  it('contains all 3 daily life templates from the spec', () => {
    expect(ids).toContain('morning-routine')
    expect(ids).toContain('evening-routine')
    expect(ids).toContain('go-outside')
    expect(dailyLifeTemplates).toHaveLength(3)
  })

  it('all daily life templates have direction DO', () => {
    expect(dailyLifeTemplates.every((t) => t.direction === 'DO')).toBe(true)
  })

  it('all daily life templates have valid shapes', () => {
    expect(dailyLifeTemplates.every(isValidTemplate)).toBe(true)
  })
})

describe('breaking habits templates', () => {
  const ids = breakingHabitsTemplates.map((t) => t.id)

  it('contains all 5 breaking habits templates from the spec', () => {
    expect(ids).toContain('no-smoking')
    expect(ids).toContain('no-fast-food')
    expect(ids).toContain('no-social-media')
    expect(ids).toContain('no-alcohol')
    expect(ids).toContain('no-unnecessary-spending')
    expect(breakingHabitsTemplates).toHaveLength(5)
  })

  it('all breaking habits templates have direction AVOID', () => {
    expect(breakingHabitsTemplates.every((t) => t.direction === 'AVOID')).toBe(true)
  })

  it('all breaking habits templates have valid shapes', () => {
    expect(breakingHabitsTemplates.every(isValidTemplate)).toBe(true)
  })
})

// ─── Spec-defined defaults ────────────────────────────────────────────────────

describe('Running defaults (spec section 6)', () => {
  const running = findTemplate('running')!

  it('direction is DO', () => {
    expect(running.direction).toBe('DO')
  })

  it('has distance measurement with target 5 km', () => {
    const dist = running.defaultMeasurements.find((m) => m.type === 'distance')
    expect(dist).toBeDefined()
    expect(dist!.target).toBe(5)
    expect(dist!.unit).toBe('km')
  })

  it('has duration measurement', () => {
    const dur = running.defaultMeasurements.find((m) => m.type === 'duration')
    expect(dur).toBeDefined()
  })

  it('default frequency is 2x_week', () => {
    expect(running.defaultFrequency).toBe('2x_week')
  })
})

describe('Walking defaults (spec section 6)', () => {
  const walking = findTemplate('walking')!

  it('direction is DO', () => {
    expect(walking.direction).toBe('DO')
  })

  it('has duration measurement with target 30 min', () => {
    const dur = walking.defaultMeasurements.find((m) => m.type === 'duration')
    expect(dur).toBeDefined()
    expect(dur!.target).toBe(30)
    expect(dur!.unit).toBe('min')
  })

  it('default frequency is 3x_week', () => {
    expect(walking.defaultFrequency).toBe('3x_week')
  })
})

describe('Strength workout defaults (spec section 6)', () => {
  const strength = findTemplate('strength-workout')!

  it('direction is DO', () => {
    expect(strength.direction).toBe('DO')
  })

  it('has sets measurement with target 3', () => {
    const sets = strength.defaultMeasurements.find((m) => m.type === 'sets')
    expect(sets).toBeDefined()
    expect(sets!.target).toBe(3)
  })

  it('has reps measurement with target 10', () => {
    const reps = strength.defaultMeasurements.find((m) => m.type === 'reps')
    expect(reps).toBeDefined()
    expect(reps!.target).toBe(10)
  })

  it('has weight measurement', () => {
    const weight = strength.defaultMeasurements.find((m) => m.type === 'weight')
    expect(weight).toBeDefined()
  })

  it('default frequency is 3x_week', () => {
    expect(strength.defaultFrequency).toBe('3x_week')
  })
})

describe('Reading defaults (spec section 6)', () => {
  const reading = findTemplate('reading')!

  it('direction is DO', () => {
    expect(reading.direction).toBe('DO')
  })

  it('has duration measurement with target 20 min', () => {
    const dur = reading.defaultMeasurements.find((m) => m.type === 'duration')
    expect(dur).toBeDefined()
    expect(dur!.target).toBe(20)
  })

  it('default frequency is daily', () => {
    expect(reading.defaultFrequency).toBe('daily')
  })
})

describe('Meditation defaults (spec section 6)', () => {
  const meditation = findTemplate('meditation')!

  it('direction is DO', () => {
    expect(meditation.direction).toBe('DO')
  })

  it('has duration measurement with target 10 min', () => {
    const dur = meditation.defaultMeasurements.find((m) => m.type === 'duration')
    expect(dur).toBeDefined()
    expect(dur!.target).toBe(10)
  })

  it('default frequency is daily', () => {
    expect(meditation.defaultFrequency).toBe('daily')
  })
})

describe('No smoking defaults (spec section 6)', () => {
  const noSmoking = findTemplate('no-smoking')!

  it('direction is AVOID', () => {
    expect(noSmoking.direction).toBe('AVOID')
  })

  it('default frequency is daily', () => {
    expect(noSmoking.defaultFrequency).toBe('daily')
  })

  it('has a suggested challenge of 30 days', () => {
    expect(noSmoking.suggestedChallengeDays).toBe(30)
  })
})

describe('No fast food defaults (spec section 6)', () => {
  const noFastFood = findTemplate('no-fast-food')!

  it('direction is AVOID', () => {
    expect(noFastFood.direction).toBe('AVOID')
  })

  it('default frequency is daily', () => {
    expect(noFastFood.defaultFrequency).toBe('daily')
  })

  it('has a suggested challenge of 30 days', () => {
    expect(noFastFood.suggestedChallengeDays).toBe(30)
  })
})

// ─── Custom sentinel ──────────────────────────────────────────────────────────

describe('custom template sentinel', () => {
  it('has id "custom"', () => {
    expect(customTemplate.id).toBe('custom')
  })

  it('has isCustom set to true', () => {
    expect(customTemplate.isCustom).toBe(true)
  })

  it('is always the last item in doTemplates', () => {
    expect(doTemplates[doTemplates.length - 1]!.id).toBe('custom')
  })

  it('is always the last item in avoidTemplates', () => {
    expect(avoidTemplates[avoidTemplates.length - 1]!.id).toBe('custom')
  })

  it('is present in allTemplates', () => {
    expect(allTemplates.some((t) => t.id === 'custom')).toBe(true)
  })
})

// ─── allTemplates ─────────────────────────────────────────────────────────────

describe('allTemplates', () => {
  it('contains exactly 21 entries (20 predefined + 1 custom)', () => {
    // 7 exercise + 5 personal_development + 3 daily_life + 5 breaking_habits + 1 custom = 21
    expect(allTemplates).toHaveLength(21)
  })

  it('all template ids are unique', () => {
    const ids = allTemplates.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all templates have valid shapes', () => {
    expect(allTemplates.every(isValidTemplate)).toBe(true)
  })
})

// ─── doTemplates ─────────────────────────────────────────────────────────────

describe('doTemplates', () => {
  it('contains only DO direction templates (plus the custom sentinel)', () => {
    const nonDo = doTemplates.filter((t) => t.direction !== 'DO' && !t.isCustom)
    expect(nonDo).toHaveLength(0)
  })

  it('always ends with the custom sentinel', () => {
    expect(doTemplates[doTemplates.length - 1]!.isCustom).toBe(true)
  })
})

// ─── avoidTemplates ───────────────────────────────────────────────────────────

describe('avoidTemplates', () => {
  it('contains only AVOID direction templates (plus the custom sentinel)', () => {
    const nonAvoid = avoidTemplates.filter((t) => t.direction !== 'AVOID' && !t.isCustom)
    expect(nonAvoid).toHaveLength(0)
  })

  it('always ends with the custom sentinel', () => {
    expect(avoidTemplates[avoidTemplates.length - 1]!.isCustom).toBe(true)
  })
})

// ─── findTemplate ─────────────────────────────────────────────────────────────

describe('findTemplate', () => {
  it('returns the correct template by id', () => {
    const t = findTemplate('running')
    expect(t).toBeDefined()
    expect(t!.id).toBe('running')
    expect(t!.label).toBe('Running')
  })

  it('returns the custom template by id', () => {
    expect(findTemplate('custom')?.isCustom).toBe(true)
  })

  it('returns undefined for an unknown id', () => {
    expect(findTemplate('does-not-exist')).toBeUndefined()
  })
})

// ─── templatesForDirection ────────────────────────────────────────────────────

describe('templatesForDirection', () => {
  it('returns doTemplates for DO', () => {
    const result = templatesForDirection('DO')
    expect(result).toEqual(doTemplates)
  })

  it('returns avoidTemplates for AVOID', () => {
    const result = templatesForDirection('AVOID')
    expect(result).toEqual(avoidTemplates)
  })

  it('always includes the custom sentinel for DO', () => {
    expect(templatesForDirection('DO').some((t) => t.isCustom)).toBe(true)
  })

  it('always includes the custom sentinel for AVOID', () => {
    expect(templatesForDirection('AVOID').some((t) => t.isCustom)).toBe(true)
  })
})

// ─── needsConfigureScreen ─────────────────────────────────────────────────────

describe('needsConfigureScreen', () => {
  // Import at the top of this block to keep tests self-contained
  let needsConfigureScreen: typeof import('./templates').needsConfigureScreen

  beforeAll(async () => {
    const mod = await import('./templates')
    needsConfigureScreen = mod.needsConfigureScreen
  })

  it('returns true for null (no template)', () => {
    expect(needsConfigureScreen(null)).toBe(true)
  })

  it('returns true for undefined', () => {
    expect(needsConfigureScreen(undefined)).toBe(true)
  })

  it('returns true for the custom template', () => {
    expect(needsConfigureScreen(customTemplate)).toBe(true)
  })

  it('returns true for strength workout (has sets measurement)', () => {
    const strength = findTemplate('strength-workout')!
    expect(needsConfigureScreen(strength)).toBe(true)
  })

  it('returns false for running', () => {
    expect(needsConfigureScreen(findTemplate('running')!)).toBe(false)
  })

  it('returns false for walking', () => {
    expect(needsConfigureScreen(findTemplate('walking')!)).toBe(false)
  })

  it('returns false for reading', () => {
    expect(needsConfigureScreen(findTemplate('reading')!)).toBe(false)
  })

  it('returns false for meditation', () => {
    expect(needsConfigureScreen(findTemplate('meditation')!)).toBe(false)
  })

  it('returns false for no-smoking (AVOID)', () => {
    expect(needsConfigureScreen(findTemplate('no-smoking')!)).toBe(false)
  })

  it('returns false for no-alcohol (AVOID)', () => {
    expect(needsConfigureScreen(findTemplate('no-alcohol')!)).toBe(false)
  })

  it('returns false for yoga', () => {
    expect(needsConfigureScreen(findTemplate('yoga')!)).toBe(false)
  })

  it('returns false for all non-strength, non-custom templates', () => {
    const simple = allTemplates.filter(
      (t) => !t.isCustom && !t.defaultMeasurements.some((m) => m.type === 'sets'),
    )
    expect(simple.length).toBeGreaterThan(0)
    for (const t of simple) {
      expect(needsConfigureScreen(t)).toBe(false)
    }
  })
})
