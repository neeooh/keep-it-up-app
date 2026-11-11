import { describe, it, expect } from 'vitest'
import { exportJSON, exportCSV, exportMarkdown } from './export'
import type { AppState } from './types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const EMPTY_STATE: AppState = { commitments: [], sessions: [] }

const STATE_WITH_DATA: AppState = {
  commitments: [
    {
      id: 'r1',
      name: 'Strength Training',
      createdAt: '2024-01-01T00:00:00.000Z',
      activities: [
        {
          id: 'a1',
          name: 'Bench Press',
          direction: 'DO',
          measurements: [
            { type: 'sets', target: 3 },
            { type: 'reps', target: 8 },
            { type: 'weight', unit: 'kg' },
          ],
          frequency: '3x_week',
        },
      ],
    },
    {
      id: 'r2',
      name: 'No Fast Food',
      createdAt: '2024-01-05T00:00:00.000Z',
      activities: [
        {
          id: 'a2',
          name: 'No Fast Food',
          direction: 'AVOID',
          measurements: [],
          frequency: 'daily',
        },
      ],
    },
    {
      id: 'r3',
      name: 'Running',
      createdAt: '2024-01-03T00:00:00.000Z',
      activities: [
        {
          id: 'a3',
          name: 'Running',
          direction: 'DO',
          measurements: [
            { type: 'distance', unit: 'km', target: 5 },
            { type: 'duration', unit: 'min', target: 30 },
          ],
          frequency: '2x_week',
        },
      ],
    },
  ],
  sessions: [
    {
      id: 's1',
      commitmentId: 'r1',
      completedAt: '2024-01-10T08:00:00.000Z',
      results: [
        {
          activityId: 'a1',
          measurements: {},
          sets: [
            { weight: 60, reps: 8 },
            { weight: 60, reps: 8 },
            { weight: 60, reps: 6 },
          ],
        },
      ],
    },
    {
      id: 's2',
      commitmentId: 'r2',
      completedAt: '2024-01-10T20:00:00.000Z',
      results: [
        {
          activityId: 'a2',
          measurements: {},
          stayedOnTrack: true,
        },
      ],
    },
    {
      id: 's3',
      commitmentId: 'r3',
      completedAt: '2024-01-11T07:00:00.000Z',
      results: [
        {
          activityId: 'a3',
          measurements: { distance: 5.2, duration: 31 },
        },
      ],
    },
  ],
}

// ─── JSON export ──────────────────────────────────────────────────────────────

describe('exportJSON', () => {
  it('returns valid JSON matching the input state', () => {
    const json = exportJSON(STATE_WITH_DATA)
    const parsed = JSON.parse(json)
    expect(parsed.commitments).toHaveLength(3)
    expect(parsed.sessions).toHaveLength(3)
    expect(parsed.commitments[0].name).toBe('Strength Training')
  })

  it('handles empty state', () => {
    const json = exportJSON(EMPTY_STATE)
    const parsed = JSON.parse(json)
    expect(parsed.commitments).toHaveLength(0)
    expect(parsed.sessions).toHaveLength(0)
  })
})

// ─── CSV export ───────────────────────────────────────────────────────────────

describe('exportCSV', () => {
  it('produces a header row and one row per activity result', () => {
    const csv = exportCSV(STATE_WITH_DATA)
    const lines = csv.split('\n')
    // Header + 3 result rows (one per session result)
    expect(lines).toHaveLength(4)
    expect(lines[0]).toContain('Date,Commitment,Activity,Direction')
  })

  it('includes strength set data', () => {
    const csv = exportCSV(STATE_WITH_DATA)
    expect(csv).toContain('Bench Press')
    expect(csv).toContain('60 kg × 8')
  })

  it('includes metric data', () => {
    const csv = exportCSV(STATE_WITH_DATA)
    expect(csv).toContain('Running')
    expect(csv).toContain('5.2 km')
    expect(csv).toContain('31 min')
  })

  it('includes AVOID data', () => {
    const csv = exportCSV(STATE_WITH_DATA)
    expect(csv).toContain('No Fast Food')
    expect(csv).toContain('Yes')
  })

  it('handles empty state', () => {
    const csv = exportCSV(EMPTY_STATE)
    const lines = csv.split('\n')
    expect(lines).toHaveLength(1) // header only
  })

  it('escapes values with commas', () => {
    const state: AppState = {
      commitments: [{
        id: 'r1',
        name: 'My commitment, with commas',
        createdAt: '2024-01-01T00:00:00Z',
        activities: [{
          id: 'a1',
          name: 'Activity',
          direction: 'DO',
          measurements: [{ type: 'duration', unit: 'min' }],
          frequency: 'daily',
        }],
      }],
      sessions: [{
        id: 's1',
        commitmentId: 'r1',
        completedAt: '2024-01-02T00:00:00Z',
        results: [{ activityId: 'a1', measurements: { duration: 30 } }],
      }],
    }
    const csv = exportCSV(state)
    expect(csv).toContain('"My commitment, with commas"')
  })
})

// ─── Markdown export ──────────────────────────────────────────────────────────

describe('exportMarkdown', () => {
  it('contains a title and export date', () => {
    const md = exportMarkdown(STATE_WITH_DATA)
    expect(md).toContain('# Keep It Up — Data Export')
    expect(md).toContain('Exported on')
  })

  it('lists commitments', () => {
    const md = exportMarkdown(STATE_WITH_DATA)
    expect(md).toContain('### Strength Training')
    expect(md).toContain('### No Fast Food')
    expect(md).toContain('### Running')
  })

  it('lists session history', () => {
    const md = exportMarkdown(STATE_WITH_DATA)
    expect(md).toContain('## Session History')
    expect(md).toContain('3 sessions total.')
  })

  it('includes strength session details', () => {
    const md = exportMarkdown(STATE_WITH_DATA)
    expect(md).toContain('Bench Press')
    expect(md).toContain('60 kg')
  })

  it('includes metric session details', () => {
    const md = exportMarkdown(STATE_WITH_DATA)
    expect(md).toContain('5.2 km')
    expect(md).toContain('31 min')
  })

  it('includes AVOID session details', () => {
    const md = exportMarkdown(STATE_WITH_DATA)
    expect(md).toContain('✓ Stayed on track')
  })

  it('handles empty state', () => {
    const md = exportMarkdown(EMPTY_STATE)
    expect(md).toContain('No commitments.')
    expect(md).toContain('No sessions recorded.')
  })
})
