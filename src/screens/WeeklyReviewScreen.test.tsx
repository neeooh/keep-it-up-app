/**
 * WeeklyReviewScreen tests.
 *
 * The Review screen now shows the most recently completed week
 * (last Monday–Sunday), not the current week.
 *
 * - Countdown empty state when no sessions exist in the previous week
 * - Rendering with data placed in the previous week
 * - Conditional reduce suggestion (consistency < 50% and active > 7 days)
 * - "Keep my plan" navigates to dashboard
 * - "Adjust my plan" routes to the edit screen
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { WeeklyReviewScreen } from './WeeklyReviewScreen'
import {
  STRENGTH_ROUTINE,
  makeStrengthSession,
  seedStore,
  clearStore,
  StoreWrapper,
} from './__tests__/fixtures'

afterEach(() => {
  clearStore()
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return an ISO date string for a day in the previous week (0 = Monday). */
function lastWeekDay(dayOffset: number): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const thisMonday = new Date(now)
  thisMonday.setUTCDate(now.getUTCDate() + diff)
  // Go to last week's Monday then add offset
  const target = new Date(thisMonday)
  target.setUTCDate(thisMonday.getUTCDate() - 7 + dayOffset)
  return target.toISOString()
}

// ─── Empty / countdown state ──────────────────────────────────────────────────

describe('WeeklyReviewScreen — empty state', () => {
  it('shows countdown when no sessions exist', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <WeeklyReviewScreen navigate={vi.fn()} onEditRoutine={vi.fn()} />
      </StoreWrapper>,
    )
    expect(screen.getByText(/your weekly review/i)).toBeInTheDocument()
    expect(screen.getByText(/your first review will be ready/i)).toBeInTheDocument()
    expect(screen.getByTestId('review-countdown')).toBeInTheDocument()
  })

  it('shows countdown when sessions exist but none in previous week', () => {
    // Session from today (current week, not previous week)
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', new Date().toISOString(), 60, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <WeeklyReviewScreen navigate={vi.fn()} onEditRoutine={vi.fn()} />
      </StoreWrapper>,
    )
    expect(screen.getByText(/no sessions were logged last week/i)).toBeInTheDocument()
    expect(screen.getByTestId('review-countdown')).toBeInTheDocument()
  })
})

// ─── Rendering with previous-week data ────────────────────────────────────────

describe('WeeklyReviewScreen — rendering', () => {
  function setup() {
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', lastWeekDay(0), 60, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', lastWeekDay(2), 65, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    const navigate = vi.fn()
    const onEditRoutine = vi.fn()
    render(
      <StoreWrapper>
        <WeeklyReviewScreen navigate={navigate} onEditRoutine={onEditRoutine} />
      </StoreWrapper>,
    )
    return { navigate, onEditRoutine }
  }

  it('renders "Your week" heading', () => {
    setup()
    expect(
      screen.getByRole('heading', { name: /your week/i }),
    ).toBeInTheDocument()
  })

  it('shows the date range of the previous week', () => {
    setup()
    // The description should contain a date range like "30 Sep – 6 Oct"
    const header = screen.getByRole('heading', { name: /your week/i }).closest('div')
    expect(header?.textContent).toMatch(/\d+\s\w+\s–\s\d+\s\w+/)
  })

  it('shows consistency percentage', () => {
    setup()
    expect(screen.getByTestId('review-consistency')).toBeInTheDocument()
  })

  it('shows momentum stat', () => {
    setup()
    expect(screen.getByTestId('review-momentum')).toBeInTheDocument()
  })
})

// ─── "Keep my plan" navigation ────────────────────────────────────────────────

describe('WeeklyReviewScreen — "Keep my plan" navigation', () => {
  it('navigates to dashboard when "Keep my plan" is clicked', async () => {
    seedStore({
      routines: [STRENGTH_ROUTINE],
      sessions: [
        makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', lastWeekDay(1), 60, 8),
      ],
    })
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <WeeklyReviewScreen navigate={navigate} onEditRoutine={vi.fn()} />
      </StoreWrapper>,
    )
    await user.click(screen.getByTestId('keep-routine-button'))
    expect(navigate).toHaveBeenCalledWith('dashboard')
  })
})

// ─── "Adjust my plan" routes to edit ──────────────────────────────────────────

describe('WeeklyReviewScreen — "Adjust my plan" routes to edit', () => {
  it('calls onEditRoutine with the primary routine ID', async () => {
    seedStore({
      routines: [STRENGTH_ROUTINE],
      sessions: [
        makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', lastWeekDay(0), 60, 8),
      ],
    })
    const onEditRoutine = vi.fn()
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <WeeklyReviewScreen navigate={vi.fn()} onEditRoutine={onEditRoutine} />
      </StoreWrapper>,
    )
    await user.click(screen.getByTestId('edit-routine-button'))
    expect(onEditRoutine).toHaveBeenCalledWith(STRENGTH_ROUTINE.id)
  })
})

// ─── Conditional suggestions ──────────────────────────────────────────────────

describe('WeeklyReviewScreen — conditional suggestions', () => {
  it('shows reduce suggestion when last week consistency is below 50% and active > 7 days', () => {
    // One session in last week + one older session to pass the 7-day age gate.
    // 1 of 3 planned = 33% consistency.
    seedStore({
      routines: [STRENGTH_ROUTINE],
      sessions: [
        makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', lastWeekDay(0), 50, 8),
        // Old session to satisfy activeDays > 7
        makeStrengthSession(
          STRENGTH_ROUTINE.id,
          'act-bench',
          new Date(Date.now() - 20 * 86_400_000).toISOString(),
          50,
          8,
        ),
      ],
    })
    render(
      <StoreWrapper>
        <WeeklyReviewScreen navigate={vi.fn()} onEditRoutine={vi.fn()} />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('reduce-suggestion')).toBeInTheDocument()
  })

  it('does not show reduce suggestion when last week was fully completed', () => {
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', lastWeekDay(0), 60, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', lastWeekDay(2), 60, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', lastWeekDay(4), 60, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <WeeklyReviewScreen navigate={vi.fn()} onEditRoutine={vi.fn()} />
      </StoreWrapper>,
    )
    // 3 sessions last week for a 3x_week routine = 100% consistency
    expect(screen.queryByTestId('reduce-suggestion')).not.toBeInTheDocument()
  })
})
