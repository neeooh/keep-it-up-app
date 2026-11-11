/**
 * PlanScreen tests.
 *
 * - Empty state when no commitments exist
 * - Summary stats (commitment count and sessions/week)
 * - Weekly grid with dots for scheduled commitments
 * - "any day" for commitments without scheduled days
 * - Commitment cards with name, frequency, and scheduled days
 * - Challenge progress for commitments with challenges
 * - Commitment cards call onEditCommitment on click
 * - Add commitment buttons navigate to welcome
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlanScreen } from './PlanScreen'
import {
  seedStore,
  clearStore,
  StoreWrapper,
} from './__tests__/fixtures'
import type { AppState, Commitment, DayOfWeek } from '../domain/types'

afterEach(() => {
  clearStore()
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup(state: AppState, onEditCommitment = vi.fn()) {
  seedStore(state)
  const navigate = vi.fn()
  render(
    <StoreWrapper>
      <PlanScreen navigate={navigate} onEditCommitment={onEditCommitment} />
    </StoreWrapper>,
  )
  return { navigate, onEditCommitment }
}

function makeCommitment(overrides: Partial<Commitment & { frequency?: string; scheduledDays?: number[]; preferredTime?: string }> = {}): Commitment {
  return {
    id: overrides.id ?? 'r1',
    name: overrides.name ?? 'Test commitment',
    createdAt: overrides.createdAt ?? '2026-10-01T10:00:00Z',
    challengeDurationDays: overrides.challengeDurationDays,
    challengeStartDate: overrides.challengeStartDate,
    activities: overrides.activities ?? [{
      id: 'a1',
      name: overrides.name ?? 'Test commitment',
      direction: 'DO' as const,
      measurements: [{ type: 'duration' as const, target: 30 }],
      frequency: (overrides as Record<string, unknown>).frequency as 'daily' | '3x_week' | '2x_week' | '1x_week' | 'flexible' ?? '3x_week',
      scheduledDays: (overrides as Record<string, unknown>).scheduledDays as DayOfWeek[] | undefined,
      preferredTime: (overrides as Record<string, unknown>).preferredTime as string | undefined,
    }],
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PlanScreen — empty state', () => {
  it('renders empty state when no commitments exist', () => {
    setup({ commitments: [], sessions: [] })
    expect(screen.getByTestId('plan-empty')).toBeInTheDocument()
    expect(screen.getByText(/no commitments yet/i)).toBeInTheDocument()
  })

  it('empty state "Create a commitment" button navigates to welcome', async () => {
    const user = userEvent.setup()
    const { navigate } = setup({ commitments: [], sessions: [] })
    await user.click(screen.getByRole('button', { name: /create a commitment/i }))
    expect(navigate).toHaveBeenCalledWith('add-commitment')
  })
})

describe('PlanScreen — summary stats', () => {
  it('shows correct commitment count and sessions/week', () => {
    const commitments = [
      makeCommitment({ id: 'r1', name: 'Running', frequency: '3x_week' }),
      makeCommitment({ id: 'r2', name: 'Meditation', frequency: 'daily' }),
    ]
    setup({ commitments, sessions: [] })

    const summary = screen.getByTestId('plan-summary')
    expect(summary).toHaveTextContent('2 commitments')
    // 3x_week = 3, daily = 7 → 10 sessions/week
    expect(summary).toHaveTextContent('10 sessions/week')
  })

  it('shows singular "commitment" for one commitment', () => {
    const commitments = [makeCommitment({ id: 'r1', name: 'Running', frequency: '1x_week' })]
    setup({ commitments, sessions: [] })

    const summary = screen.getByTestId('plan-summary')
    expect(summary).toHaveTextContent('1 commitment')
    expect(summary).toHaveTextContent('1 sessions/week')
  })
})

describe('PlanScreen — weekly grid', () => {
  it('shows dots for scheduled days in the grid', () => {
    const commitments = [
      makeCommitment({
        id: 'r1',
        name: 'Running',
        frequency: '3x_week',
        scheduledDays: [1, 3, 5],
      }),
    ]
    setup({ commitments, sessions: [] })

    const grid = screen.getByTestId('weekly-grid')
    const row = within(grid).getByTestId('grid-row-r1')
    const dots = within(row).getAllByLabelText('scheduled')
    expect(dots).toHaveLength(3)
  })

  it('shows all 7 dots for a daily commitment', () => {
    const commitments = [
      makeCommitment({ id: 'r1', name: 'Meditation', frequency: 'daily' }),
    ]
    setup({ commitments, sessions: [] })

    const row = screen.getByTestId('grid-row-r1')
    const dots = within(row).getAllByLabelText('scheduled')
    expect(dots).toHaveLength(7)
  })

  it('shows "any day" for commitments without scheduled days', () => {
    const commitments = [
      makeCommitment({ id: 'r1', name: 'Reading', frequency: 'flexible' }),
    ]
    setup({ commitments, sessions: [] })

    const row = screen.getByTestId('grid-row-r1')
    expect(within(row).getByText('any day')).toBeInTheDocument()
  })
})

describe('PlanScreen — commitment cards', () => {
  it('shows commitment name and frequency', () => {
    const commitments = [
      makeCommitment({ id: 'r1', name: 'Running', frequency: '2x_week' }),
    ]
    setup({ commitments, sessions: [] })

    const card = screen.getByTestId('plan-commitment-r1')
    expect(within(card).getByText('Running')).toBeInTheDocument()
    expect(within(card).getByText(/2× per week/)).toBeInTheDocument()
  })

  it('shows scheduled days on the commitment card', () => {
    const commitments = [
      makeCommitment({
        id: 'r1',
        name: 'Running',
        frequency: '3x_week',
        scheduledDays: [1, 3, 5],
      }),
    ]
    setup({ commitments, sessions: [] })

    const card = screen.getByTestId('plan-commitment-r1')
    expect(within(card).getByText(/Mon, Wed, Fri/)).toBeInTheDocument()
  })

  it('shows challenge progress for a commitment with a challenge', () => {
    const commitments = [
      makeCommitment({
        id: 'r1',
        name: 'Running',
        frequency: '3x_week',
        challengeDurationDays: 30,
        challengeStartDate: '2026-10-01',
      }),
    ]
    setup({ commitments, sessions: [] })

    const card = screen.getByTestId('plan-commitment-r1')
    expect(within(card).getByText(/30-day challenge/)).toBeInTheDocument()
  })

  it('calls onEditCommitment when a commitment card is clicked', async () => {
    const user = userEvent.setup()
    const commitments = [
      makeCommitment({ id: 'r1', name: 'Running', frequency: '3x_week' }),
    ]
    const { onEditCommitment } = setup({ commitments, sessions: [] })

    await user.click(screen.getByTestId('plan-commitment-r1'))
    expect(onEditCommitment).toHaveBeenCalledWith('r1')
  })
})

describe('PlanScreen — add commitment buttons', () => {
  it('header add button navigates to welcome', async () => {
    const user = userEvent.setup()
    const commitments = [makeCommitment({ id: 'r1', name: 'Running' })]
    const { navigate } = setup({ commitments, sessions: [] })

    await user.click(screen.getByTestId('plan-add-commitment-button'))
    expect(navigate).toHaveBeenCalledWith('add-commitment')
  })

  it('bottom add button navigates to welcome', async () => {
    const user = userEvent.setup()
    const commitments = [makeCommitment({ id: 'r1', name: 'Running' })]
    const { navigate } = setup({ commitments, sessions: [] })

    await user.click(screen.getByTestId('plan-add-commitment-bottom'))
    expect(navigate).toHaveBeenCalledWith('add-commitment')
  })
})
