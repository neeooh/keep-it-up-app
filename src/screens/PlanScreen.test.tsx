/**
 * PlanScreen tests.
 *
 * - Empty state when no routines exist
 * - Summary stats (routine count and sessions/week)
 * - Weekly grid with dots for scheduled routines
 * - "any day" for routines without scheduled days
 * - Routine cards with name, frequency, and scheduled days
 * - Challenge progress for routines with challenges
 * - Routine cards call onEditRoutine on click
 * - Add routine buttons navigate to welcome
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
import type { AppState, Routine } from '../domain/types'

afterEach(() => {
  clearStore()
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup(state: AppState, onEditRoutine = vi.fn()) {
  seedStore(state)
  const navigate = vi.fn()
  render(
    <StoreWrapper>
      <PlanScreen navigate={navigate} onEditRoutine={onEditRoutine} />
    </StoreWrapper>,
  )
  return { navigate, onEditRoutine }
}

function makeRoutine(overrides: Partial<Routine & { frequency?: string; scheduledDays?: number[]; preferredTime?: string }> = {}): Routine {
  return {
    id: overrides.id ?? 'r1',
    name: overrides.name ?? 'Test routine',
    createdAt: overrides.createdAt ?? '2026-10-01T10:00:00Z',
    challengeDurationDays: overrides.challengeDurationDays,
    challengeStartDate: overrides.challengeStartDate,
    activities: overrides.activities ?? [{
      id: 'a1',
      name: overrides.name ?? 'Test routine',
      direction: 'DO' as const,
      measurements: [{ type: 'duration' as const, target: 30 }],
      frequency: (overrides as Record<string, unknown>).frequency as 'daily' | '3x_week' | '2x_week' | '1x_week' | 'flexible' ?? '3x_week',
      scheduledDays: (overrides as Record<string, unknown>).scheduledDays as number[] | undefined,
      preferredTime: (overrides as Record<string, unknown>).preferredTime as string | undefined,
    }],
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PlanScreen — empty state', () => {
  it('renders empty state when no routines exist', () => {
    setup({ routines: [], sessions: [] })
    expect(screen.getByTestId('plan-empty')).toBeInTheDocument()
    expect(screen.getByText(/no routines yet/i)).toBeInTheDocument()
  })

  it('empty state "Create a routine" button navigates to welcome', async () => {
    const user = userEvent.setup()
    const { navigate } = setup({ routines: [], sessions: [] })
    await user.click(screen.getByRole('button', { name: /create a routine/i }))
    expect(navigate).toHaveBeenCalledWith('welcome')
  })
})

describe('PlanScreen — summary stats', () => {
  it('shows correct routine count and sessions/week', () => {
    const routines = [
      makeRoutine({ id: 'r1', name: 'Running', frequency: '3x_week' }),
      makeRoutine({ id: 'r2', name: 'Meditation', frequency: 'daily' }),
    ]
    setup({ routines, sessions: [] })

    const summary = screen.getByTestId('plan-summary')
    expect(summary).toHaveTextContent('2 routines')
    // 3x_week = 3, daily = 7 → 10 sessions/week
    expect(summary).toHaveTextContent('10 sessions/week')
  })

  it('shows singular "routine" for one routine', () => {
    const routines = [makeRoutine({ id: 'r1', name: 'Running', frequency: '1x_week' })]
    setup({ routines, sessions: [] })

    const summary = screen.getByTestId('plan-summary')
    expect(summary).toHaveTextContent('1 routine')
    expect(summary).toHaveTextContent('1 sessions/week')
  })
})

describe('PlanScreen — weekly grid', () => {
  it('shows dots for scheduled days in the grid', () => {
    const routines = [
      makeRoutine({
        id: 'r1',
        name: 'Running',
        frequency: '3x_week',
        scheduledDays: [1, 3, 5],
      }),
    ]
    setup({ routines, sessions: [] })

    const grid = screen.getByTestId('weekly-grid')
    const row = within(grid).getByTestId('grid-row-r1')
    const dots = within(row).getAllByLabelText('scheduled')
    expect(dots).toHaveLength(3)
  })

  it('shows all 7 dots for a daily routine', () => {
    const routines = [
      makeRoutine({ id: 'r1', name: 'Meditation', frequency: 'daily' }),
    ]
    setup({ routines, sessions: [] })

    const row = screen.getByTestId('grid-row-r1')
    const dots = within(row).getAllByLabelText('scheduled')
    expect(dots).toHaveLength(7)
  })

  it('shows "any day" for routines without scheduled days', () => {
    const routines = [
      makeRoutine({ id: 'r1', name: 'Reading', frequency: 'flexible' }),
    ]
    setup({ routines, sessions: [] })

    const row = screen.getByTestId('grid-row-r1')
    expect(within(row).getByText('any day')).toBeInTheDocument()
  })
})

describe('PlanScreen — routine cards', () => {
  it('shows routine name and frequency', () => {
    const routines = [
      makeRoutine({ id: 'r1', name: 'Running', frequency: '2x_week' }),
    ]
    setup({ routines, sessions: [] })

    const card = screen.getByTestId('plan-routine-r1')
    expect(within(card).getByText('Running')).toBeInTheDocument()
    expect(within(card).getByText(/2× per week/)).toBeInTheDocument()
  })

  it('shows scheduled days on the routine card', () => {
    const routines = [
      makeRoutine({
        id: 'r1',
        name: 'Running',
        frequency: '3x_week',
        scheduledDays: [1, 3, 5],
      }),
    ]
    setup({ routines, sessions: [] })

    const card = screen.getByTestId('plan-routine-r1')
    expect(within(card).getByText(/Mon, Wed, Fri/)).toBeInTheDocument()
  })

  it('shows challenge progress for a routine with a challenge', () => {
    const routines = [
      makeRoutine({
        id: 'r1',
        name: 'Running',
        frequency: '3x_week',
        challengeDurationDays: 30,
        challengeStartDate: '2026-10-01',
      }),
    ]
    setup({ routines, sessions: [] })

    const card = screen.getByTestId('plan-routine-r1')
    expect(within(card).getByText(/30-day challenge/)).toBeInTheDocument()
  })

  it('calls onEditRoutine when a routine card is clicked', async () => {
    const user = userEvent.setup()
    const routines = [
      makeRoutine({ id: 'r1', name: 'Running', frequency: '3x_week' }),
    ]
    const { onEditRoutine } = setup({ routines, sessions: [] })

    await user.click(screen.getByTestId('plan-routine-r1'))
    expect(onEditRoutine).toHaveBeenCalledWith('r1')
  })
})

describe('PlanScreen — add routine buttons', () => {
  it('header add button navigates to welcome', async () => {
    const user = userEvent.setup()
    const routines = [makeRoutine({ id: 'r1', name: 'Running' })]
    const { navigate } = setup({ routines, sessions: [] })

    await user.click(screen.getByTestId('plan-add-routine-button'))
    expect(navigate).toHaveBeenCalledWith('welcome')
  })

  it('bottom add button navigates to welcome', async () => {
    const user = userEvent.setup()
    const routines = [makeRoutine({ id: 'r1', name: 'Running' })]
    const { navigate } = setup({ routines, sessions: [] })

    await user.click(screen.getByTestId('plan-add-routine-bottom'))
    expect(navigate).toHaveBeenCalledWith('welcome')
  })
})
