/**
 * WeeklyReviewScreen tests.
 *
 * - Rendering with data
 * - Reduce frequency step-down
 * - Conditional suggestions (consistency < 50%)
 * - Keep routine navigates to dashboard
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
} from './__tests__/fixtures'
import { STORAGE_KEY } from '../store/useAppStore'

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
      <WeeklyReviewScreen navigate={navigate} onEditRoutine={onEditRoutine} />,
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

  it('shows reflection text', () => {
    setup()
    expect(screen.getByTestId('review-reflection')).toBeInTheDocument()
  })
})

describe('WeeklyReviewScreen — "Keep routine" navigation', () => {
  it('navigates to dashboard when "Keep routine" is clicked', async () => {
    seedStore({
      routines: [STRENGTH_ROUTINE],
      sessions: [
        makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(1), 60, 8),
      ],
    })
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(
      <WeeklyReviewScreen navigate={navigate} onEditRoutine={vi.fn()} />,
    )
    await user.click(screen.getByTestId('keep-routine-button'))
    expect(navigate).toHaveBeenCalledWith('dashboard')
  })
})

describe('WeeklyReviewScreen — reduce frequency', () => {
  it('steps down frequency from 3x to 2x when "Reduce frequency" is clicked', async () => {
    seedStore({
      routines: [STRENGTH_ROUTINE],
      sessions: [
        makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(1), 60, 8),
      ],
    })
    const user = userEvent.setup()
    render(
      <WeeklyReviewScreen navigate={vi.fn()} onEditRoutine={vi.fn()} />,
    )
    await user.click(screen.getByTestId('reduce-frequency-button'))

    // Verify the store was updated
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.routines[0].activities[0].frequency).toBe('2x_week')

    // Confirmation message
    expect(screen.getByTestId('reduced-confirmation')).toBeInTheDocument()
  })
})

describe('WeeklyReviewScreen — conditional suggestions', () => {
  it('shows reduce suggestion when consistency is below 50%', () => {
    // No sessions at all = 0% consistency
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <WeeklyReviewScreen navigate={vi.fn()} onEditRoutine={vi.fn()} />,
    )
    expect(screen.getByTestId('reduce-suggestion')).toBeInTheDocument()
  })

  it('does not show reduce suggestion when many sessions are completed this week', () => {
    // Place multiple sessions on today to guarantee they fall in the current week
    const now = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', now, 60, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', now, 60, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', now, 60, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <WeeklyReviewScreen navigate={vi.fn()} onEditRoutine={vi.fn()} />,
    )
    // 3 sessions this week for a 3x_week routine = 100% consistency
    expect(screen.queryByTestId('reduce-suggestion')).not.toBeInTheDocument()
  })
})

describe('WeeklyReviewScreen — edit routine', () => {
  it('calls onEditRoutine with the correct routine ID', async () => {
    seedStore({
      routines: [STRENGTH_ROUTINE],
      sessions: [
        makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(1), 60, 8),
      ],
    })
    const onEditRoutine = vi.fn()
    const user = userEvent.setup()
    render(
      <WeeklyReviewScreen navigate={vi.fn()} onEditRoutine={onEditRoutine} />,
    )
    await user.click(screen.getByTestId('edit-routine-button'))
    expect(onEditRoutine).toHaveBeenCalledWith(STRENGTH_ROUTINE.id)
  })
})
