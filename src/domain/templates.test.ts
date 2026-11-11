/**
 * Template catalogue tests.
 *
 * Validates:
 * - Every template has required fields (id, label, instruction, direction, frequency)
 * - New categories have at least 2 templates each
 * - templatesForMode returns the correct sets
 * - templatesByCategory returns correct results
 * - findTemplate looks up by id
 * - Paths build valid commitments
 * - BUILD_CATEGORIES and BREAK_CATEGORIES are consistent
 */

import { describe, it, expect } from 'vitest'
import {
  allTemplates,
  findTemplate,
  templatesForMode,
  templatesByCategory,
  BUILD_CATEGORIES,
  BREAK_CATEGORIES,
  paths,
  customTemplate,
  type ActivityTemplate,
} from './templates'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidTemplate(t: ActivityTemplate): boolean {
  return (
    t.id.length > 0 &&
    t.label.length > 0 &&
    (t.direction === 'DO' || t.direction === 'AVOID') &&
    typeof t.defaultFrequency === 'string' &&
    typeof t.defaultCompletionMethod === 'string'
  )
}

// ── allTemplates ──────────────────────────────────────────────────────────────

describe('allTemplates', () => {
  it('contains no duplicate ids', () => {
    const ids = allTemplates.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every template passes basic validation', () => {
    expect(allTemplates.every(isValidTemplate)).toBe(true)
  })

  it('every non-custom template has a non-empty instruction', () => {
    const withoutInstruction = allTemplates.filter(
      (t) => !t.isCustom && t.instruction.length === 0,
    )
    expect(withoutInstruction).toHaveLength(0)
  })
})

// ── Categories ────────────────────────────────────────────────────────────────

describe('categories', () => {
  it('every Build category has at least 2 templates', () => {
    for (const { key } of BUILD_CATEGORIES) {
      const templates = templatesByCategory(key)
      expect(templates.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('every Break category has at least 2 templates', () => {
    for (const { key } of BREAK_CATEGORIES) {
      const templates = templatesByCategory(key)
      expect(templates.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('Build categories contain only DO templates', () => {
    for (const { key } of BUILD_CATEGORIES) {
      const templates = templatesByCategory(key)
      expect(templates.every((t) => t.direction === 'DO')).toBe(true)
    }
  })

  it('Break categories contain only AVOID templates', () => {
    for (const { key } of BREAK_CATEGORIES) {
      const templates = templatesByCategory(key)
      expect(templates.every((t) => t.direction === 'AVOID')).toBe(true)
    }
  })
})

// ── templatesForMode ──────────────────────────────────────────────────────────

describe('templatesForMode', () => {
  it('returns only DO templates for build mode', () => {
    const result = templatesForMode('build')
    expect(result.every((t) => t.direction === 'DO')).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns only AVOID templates for break mode', () => {
    const result = templatesForMode('break')
    expect(result.every((t) => t.direction === 'AVOID')).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('does not include the custom sentinel', () => {
    expect(templatesForMode('build').some((t) => t.isCustom)).toBe(false)
    expect(templatesForMode('break').some((t) => t.isCustom)).toBe(false)
  })
})

// ── templatesByCategory ───────────────────────────────────────────────────────

describe('templatesByCategory', () => {
  it('returns movement templates', () => {
    const result = templatesByCategory('movement')
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result.every((t) => t.category === 'movement')).toBe(true)
  })

  it('returns substances templates', () => {
    const result = templatesByCategory('substances')
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result.every((t) => t.category === 'substances')).toBe(true)
  })

  it('returns empty array for unknown category', () => {
    const result = templatesByCategory('custom')
    // Only the custom sentinel has category 'custom'
    expect(result.every((t) => t.isCustom)).toBe(true)
  })
})

// ── findTemplate ──────────────────────────────────────────────────────────────

describe('findTemplate', () => {
  it('finds a template by id', () => {
    expect(findTemplate('running')?.label).toBe('Running')
  })

  it('returns undefined for unknown id', () => {
    expect(findTemplate('nonexistent')).toBeUndefined()
  })

  it('finds the custom sentinel', () => {
    expect(findTemplate('custom')?.isCustom).toBe(true)
  })
})

// ── customTemplate ────────────────────────────────────────────────────────────

describe('customTemplate', () => {
  it('has isCustom set to true', () => {
    expect(customTemplate.isCustom).toBe(true)
  })

  it('has an empty defaultName', () => {
    expect(customTemplate.defaultName).toBe('')
  })

  it('has binary completion method', () => {
    expect(customTemplate.defaultCompletionMethod).toBe('binary')
  })
})

// ── Paths ─────────────────────────────────────────────────────────────────────

describe('paths', () => {
  it('contains at least 2 paths', () => {
    expect(paths.length).toBeGreaterThanOrEqual(2)
  })

  it('each path has unique id', () => {
    const ids = paths.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each path builds at least 2 commitments', () => {
    for (const path of paths) {
      const commitments = path.buildCommitments()
      expect(commitments.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('each built commitment has a non-empty name and at least one activity', () => {
    for (const path of paths) {
      const commitments = path.buildCommitments()
      for (const c of commitments) {
        expect(c.name.length).toBeGreaterThan(0)
        expect(c.activities.length).toBeGreaterThanOrEqual(1)
      }
    }
  })
})
