/**
 * WeeklyReviewScreen tests.
 *
 * - Rendering with data
 * - Conditional reduce suggestion (consistency < 50% and active > 7 days)
 * - "Keep my plan" navigates to dashboard
 * - "Adjust my plan" routes to the edit screen (where frequency changes happen)
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { WeeklyReviewScreen } from './WeeklyReviewScreen'
import {
  STRENGTH_ROUTINE,
  makeStrengthSession,
  daysAgo,
  seedStore,
  clearStore,
  StoreWrapper,
} from './__tests__/fixtures'

afterEach(() => {
  clearStore()
})

describe('WeeklyReviewScreen — rendering', () => {
  function setup() {
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(1), 60, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(3), 65, 8),
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

  it('shows consistency percentage', () => {
    setup()
    expect(screen.getByTestId('review-consistency')).toBeInTheDocument()
  })

  it('shows momentum stat', () => {
    setup()
    expect(screen.getByTestId('review-momentum')).toBeInTheDocument()
  })
})

describe('WeeklyReviewScreen — "Keep my plan" navigation', () => {
  it('navigates to dashboard when "Keep my plan" is clicked', async () => {
    seedStore({
      routines: [STRENGTH_ROUTINE],
      sessions: [
        makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(1), 60, 8),
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

describe('WeeklyReviewScreen — "Adjust my plan" routes to edit', () => {
  it('calls onEditRoutine with the primary routine ID (where frequency changes happen now)', async () => {
    seedStore({
      routines: [STRENGTH_ROUTINE],
      sessions: [
        makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(1), 60, 8),
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

describe('WeeklyReviewScreen — conditional suggestions', () => {
  it('shows reduce suggestion when consistency is below 50% and active > 7 days', () => {
    // One session, older than 7 days, so the age gate passes and the
    // week has low completion against a 3x_week plan.
    seedStore({
      routines: [STRENGTH_ROUTINE],
      sessions: [
        makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(10), 50, 8),
      ],
    })
    render(
      <StoreWrapper>
        <WeeklyReviewScreen navigate={vi.fn()} onEditRoutine={vi.fn()} />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('reduce-suggestion')).toBeInTheDocument()
  })

  it('does not show reduce suggestion when many sessions are completed this week', () => {
    const now = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', now, 60, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', now, 60, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', now, 60, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <WeeklyReviewScreen navigate={vi.fn()} onEditRoutine={vi.fn()} />
      </StoreWrapper>,
    )
    // 3 sessions this week for a 3x_week routine = 100% consistency
    expect(screen.queryByTestId('reduce-suggestion')).not.toBeInTheDocument()
  })
})
