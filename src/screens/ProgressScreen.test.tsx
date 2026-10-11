/**
 * ProgressScreen tests.
 *
 * - Rendering with data (consistency, performance entries)
 * - Not-enough-data state
 * - Trend chart presence when sufficient data exists
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProgressScreen } from './ProgressScreen'
import {
  RUNNING_ROUTINE,
  STRENGTH_ROUTINE,
  makeRunningSession,
  makeStrengthSession,
  daysAgo,
  seedStore,
  clearStore,
  StoreWrapper,
} from './__tests__/fixtures'

afterEach(() => {
  clearStore()
})

describe('ProgressScreen — not enough data', () => {
  it('shows "Not enough data yet" with no sessions', () => {
    seedStore({ routines: [RUNNING_ROUTINE], sessions: [] })
    render(<StoreWrapper><ProgressScreen navigate={vi.fn()} onEditRoutine={vi.fn()} /></StoreWrapper>)
    expect(screen.getByTestId('progress-not-enough-data')).toBeInTheDocument()
    expect(screen.getByText(/your progress charts will appear here/i)).toBeInTheDocument()
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
    render(<StoreWrapper><ProgressScreen navigate={vi.fn()} onEditRoutine={vi.fn()} /></StoreWrapper>)
    expect(screen.getByTestId('progress-not-enough-data')).toBeInTheDocument()
  })

  it('shows "Not enough data yet" with no routines', () => {
    seedStore({ routines: [], sessions: [] })
    render(<StoreWrapper><ProgressScreen navigate={vi.fn()} onEditRoutine={vi.fn()} /></StoreWrapper>)
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
    render(<StoreWrapper><ProgressScreen navigate={vi.fn()} onEditRoutine={vi.fn()} /></StoreWrapper>)
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

// ─── Weekly review integration ────────────────────────────────────────────────

/** Return an ISO date string for a day in the previous week (0 = Monday). */
function lastWeekDay(dayOffset: number): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const thisMonday = new Date(now)
  thisMonday.setUTCDate(now.getUTCDate() + diff)
  const target = new Date(thisMonday)
  target.setUTCDate(thisMonday.getUTCDate() - 7 + dayOffset)
  return target.toISOString()
}

describe('ProgressScreen — review countdown card', () => {
  it('shows the review countdown card in the empty state', () => {
    seedStore({ routines: [RUNNING_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <ProgressScreen navigate={vi.fn()} onEditRoutine={vi.fn()} />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('review-card-countdown')).toBeInTheDocument()
    expect(screen.getByText(/of 7 days/)).toBeInTheDocument()
  })

  it('shows the review countdown when not enough data for charts', () => {
    const session = makeRunningSession(RUNNING_ROUTINE.id, 'act-run', daysAgo(1), 5, 30)
    seedStore({ routines: [RUNNING_ROUTINE], sessions: [session] })
    render(
      <StoreWrapper>
        <ProgressScreen navigate={vi.fn()} onEditRoutine={vi.fn()} />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('progress-not-enough-data')).toBeInTheDocument()
    expect(screen.getByTestId('review-card-countdown')).toBeInTheDocument()
  })
})

describe('ProgressScreen — review ready card', () => {
  it('shows review-card-ready when sessions exist in the previous week', () => {
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', lastWeekDay(0), 60, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', lastWeekDay(2), 65, 8),
      // Need a third session to pass hasEnoughData >= 2 AND have data in full state
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(1), 70, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <ProgressScreen navigate={vi.fn()} onEditRoutine={vi.fn()} />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('review-card-ready')).toBeInTheDocument()
    expect(screen.getByText(/sessions completed/i)).toBeInTheDocument()
  })

  it('"Review your week" button calls navigate to weekly-review', async () => {
    const user = userEvent.setup()
    const navigate = vi.fn()
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', lastWeekDay(0), 60, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', lastWeekDay(2), 65, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(1), 70, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <ProgressScreen navigate={navigate} onEditRoutine={vi.fn()} />
      </StoreWrapper>,
    )
    await user.click(screen.getByTestId('review-week-button'))
    expect(navigate).toHaveBeenCalledWith('weekly-review')
  })
})

describe('ProgressScreen — past reviews', () => {
  it('shows past review weeks with session data', () => {
    // Create sessions in two past weeks
    const now = new Date()
    const day = now.getUTCDay()
    const diff = day === 0 ? -6 : 1 - day
    const thisMonday = new Date(now)
    thisMonday.setUTCDate(now.getUTCDate() + diff)

    const twoWeeksAgoMonday = new Date(thisMonday)
    twoWeeksAgoMonday.setUTCDate(thisMonday.getUTCDate() - 14)
    const twoWeeksAgoStr = twoWeeksAgoMonday.toISOString()

    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', lastWeekDay(0), 60, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', twoWeeksAgoStr, 55, 8),
      // Recent session so hasEnoughData
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(1), 70, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <ProgressScreen navigate={vi.fn()} onEditRoutine={vi.fn()} />
      </StoreWrapper>,
    )
    expect(screen.getByText('Past reviews')).toBeInTheDocument()
    // Should have at least one past review button (two weeks ago)
    const pastButtons = screen.getAllByTestId(/^past-review-/)
    expect(pastButtons.length).toBeGreaterThanOrEqual(1)
  })
})