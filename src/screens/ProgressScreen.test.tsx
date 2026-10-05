/**
 * ProgressScreen tests.
 *
 * - Rendering with data (consistency, performance entries)
 * - Not-enough-data state
 * - Trend chart presence when sufficient data exists
 */

import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProgressScreen } from './ProgressScreen'
import {
  RUNNING_ROUTINE,
  makeRunningSession,
  daysAgo,
  seedStore,
  clearStore,
} from './__tests__/fixtures'

afterEach(() => {
  clearStore()
})

describe('ProgressScreen — not enough data', () => {
  it('shows "Not enough data yet" with no sessions', () => {
    seedStore({ routines: [RUNNING_ROUTINE], sessions: [] })
    render(<ProgressScreen navigate={vi.fn()} />)
    expect(screen.getByTestId('progress-not-enough-data')).toBeInTheDocument()
    expect(screen.getByText(/not enough data yet/i)).toBeInTheDocument()
  })

  it('shows "Not enough data yet" with only 1 session', () => {
    const session = makeRunningSession(
      RUNNING_ROUTINE.id,
      'act-run',
      daysAgo(1),
      5,
      30,
    )
    seedStore({ routines: [RUNNING_ROUTINE], sessions: [session] })
    render(<ProgressScreen navigate={vi.fn()} />)
    expect(screen.getByTestId('progress-not-enough-data')).toBeInTheDocument()
  })

  it('shows "Not enough data yet" with no routines', () => {
    seedStore({ routines: [], sessions: [] })
    render(<ProgressScreen navigate={vi.fn()} />)
    expect(screen.getByTestId('progress-not-enough-data')).toBeInTheDocument()
  })
})

describe('ProgressScreen — with data', () => {
  function setup() {
    const sessions = [
      makeRunningSession(RUNNING_ROUTINE.id, 'act-run', daysAgo(14), 4.5, 28),
      makeRunningSession(RUNNING_ROUTINE.id, 'act-run', daysAgo(7), 5.0, 30),
      makeRunningSession(RUNNING_ROUTINE.id, 'act-run', daysAgo(1), 5.5, 29),
    ]
    seedStore({ routines: [RUNNING_ROUTINE], sessions })
    render(<ProgressScreen navigate={vi.fn()} />)
    return { sessions }
  }

  it('renders the Progress heading', () => {
    setup()
    expect(
      screen.getByRole('heading', { name: /progress/i }),
    ).toBeInTheDocument()
  })

  it('does not show not-enough-data state', () => {
    setup()
    expect(
      screen.queryByTestId('progress-not-enough-data'),
    ).not.toBeInTheDocument()
  })

  it('shows performance entries', () => {
    setup()
    const entries = screen.queryAllByTestId('progress-performance-entry')
    expect(entries.length).toBeGreaterThan(0)
  })

  it('renders at least one trend chart', () => {
    setup()
    const charts = screen.queryAllByTestId('trend-chart')
    expect(charts.length).toBeGreaterThan(0)
  })
})
