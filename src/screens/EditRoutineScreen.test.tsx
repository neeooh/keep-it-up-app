/**
 * EditRoutineScreen tests — Approach C (unified day picker with presets).
 *
 * - Save persists updated values
 * - Delete removes routine
 * - Cancel button removed (back arrow handles navigation)
 * - Pre-population of fields from existing routine
 * - Preset pills select corresponding days
 * - Frequency is derived from day count
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EditRoutineScreen } from './EditRoutineScreen'
import {
  STRENGTH_ROUTINE,
  makeStrengthSession,
  daysAgo,
  seedStore,
  clearStore,
  StoreWrapper,
} from './__tests__/fixtures'
import { STORAGE_KEY } from '../store/useAppStore'

afterEach(() => {
  clearStore()
})

describe('EditRoutineScreen — not found', () => {
  it('shows error when routineId is null', () => {
    seedStore({ routines: [], sessions: [] })
    render(<StoreWrapper><EditRoutineScreen navigate={vi.fn()} routineId={null} /></StoreWrapper>)
    expect(screen.getByText(/routine not found/i)).toBeInTheDocument()
  })

  it('shows error when routineId does not match', () => {
    seedStore({ routines: [], sessions: [] })
    render(<StoreWrapper><EditRoutineScreen navigate={vi.fn()} routineId="nonexistent" /></StoreWrapper>)
    expect(screen.getByText(/routine not found/i)).toBeInTheDocument()
  })
})

describe('EditRoutineScreen — pre-population', () => {
  it('pre-populates the routine name', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />
      </StoreWrapper>,
    )
    const input = screen.getByTestId('edit-name') as HTMLInputElement
    expect(input.value).toBe('Strength Training')
  })

  it('pre-selects the scheduled days from the routine', () => {
    const routineWithDays = {
      ...STRENGTH_ROUTINE,
      id: 'routine-with-days',
      activities: STRENGTH_ROUTINE.activities.map((a) => ({
        ...a,
        scheduledDays: [1, 3, 5] as (1 | 2 | 3 | 4 | 5 | 6 | 7)[],
      })),
    }
    seedStore({ routines: [routineWithDays], sessions: [] })
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId="routine-with-days" />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('edit-day-1')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('edit-day-3')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('edit-day-5')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('edit-day-2')).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('EditRoutineScreen — save', () => {
  it('saves updated routine name and navigates to dashboard', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={navigate} routineId={STRENGTH_ROUTINE.id} />
      </StoreWrapper>,
    )

    const input = screen.getByTestId('edit-name') as HTMLInputElement
    await user.clear(input)
    await user.type(input, 'Upper Body')

    await user.click(screen.getByTestId('save-button'))

    expect(navigate).toHaveBeenCalledWith('dashboard')

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.routines[0].name).toBe('Upper Body')
    // BUG-005: activity names must NOT be overwritten by the routine name
    expect(state.routines[0].activities[0].name).toBe('Bench Press')
  })

  it('derives frequency from selected days and saves it', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />
      </StoreWrapper>,
    )

    // Select Tue and Thu (2 days → 2x_week)
    await user.click(screen.getByTestId('edit-day-2'))
    await user.click(screen.getByTestId('edit-day-4'))
    await user.click(screen.getByTestId('save-button'))

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.routines[0].activities[0].frequency).toBe('2x_week')
    expect(state.routines[0].activities[0].scheduledDays).toEqual([2, 4])
  })
})

describe('EditRoutineScreen — cancel button removed', () => {
  it('does not render a cancel button in the footer', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />
      </StoreWrapper>,
    )
    expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument()
  })
})

describe('EditRoutineScreen — delete', () => {
  it('shows confirmation dialog when delete is clicked', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />
      </StoreWrapper>,
    )

    await user.click(screen.getByTestId('delete-routine-button'))
    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument()
  })

  it('deletes routine and sessions on confirm', async () => {
    const session = makeStrengthSession(
      STRENGTH_ROUTINE.id,
      'act-bench',
      daysAgo(1),
      60,
      8,
    )
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [session] })
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={navigate} routineId={STRENGTH_ROUTINE.id} />
      </StoreWrapper>,
    )

    await user.click(screen.getByTestId('delete-routine-button'))
    await user.click(screen.getByTestId('delete-confirm'))

    // Store should be empty
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.routines).toHaveLength(0)
    expect(state.sessions).toHaveLength(0)

    // Navigates to welcome (no routines left)
    expect(navigate).toHaveBeenCalledWith('welcome')
  })

  it('cancels deletion when cancel is clicked in dialog', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />
      </StoreWrapper>,
    )

    await user.click(screen.getByTestId('delete-routine-button'))
    await user.click(screen.getByTestId('delete-cancel'))

    // Routine still exists
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.routines).toHaveLength(1)
  })
})

describe('EditRoutineScreen — preferred time buttons', () => {
  it('renders all four time option buttons', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('edit-time-morning')).toBeInTheDocument()
    expect(screen.getByTestId('edit-time-afternoon')).toBeInTheDocument()
    expect(screen.getByTestId('edit-time-evening')).toBeInTheDocument()
    expect(screen.getByTestId('edit-time-anytime')).toBeInTheDocument()
  })

  it('no time button is selected when routine has no preferredTime', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('edit-time-morning')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('edit-time-afternoon')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('edit-time-evening')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('edit-time-anytime')).toHaveAttribute('aria-pressed', 'false')
  })

  it('pre-selects the time button when routine has preferredTime', () => {
    const routineWithTime = {
      ...STRENGTH_ROUTINE,
      id: 'routine-with-time',
      activities: STRENGTH_ROUTINE.activities.map((a) => ({
        ...a,
        preferredTime: 'Evening',
      })),
    }
    seedStore({ routines: [routineWithTime], sessions: [] })
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId="routine-with-time" />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('edit-time-evening')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('edit-time-morning')).toHaveAttribute('aria-pressed', 'false')
  })

  it('clicking a time button selects it and saves the value', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />
      </StoreWrapper>,
    )

    await user.click(screen.getByTestId('edit-time-morning'))
    expect(screen.getByTestId('edit-time-morning')).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByTestId('save-button'))

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.routines[0].activities[0].preferredTime).toBe('Morning')
  })

  it('clicking a selected time button deselects it', async () => {
    const routineWithTime = {
      ...STRENGTH_ROUTINE,
      id: 'routine-with-time',
      activities: STRENGTH_ROUTINE.activities.map((a) => ({
        ...a,
        preferredTime: 'Morning',
      })),
    }
    seedStore({ routines: [routineWithTime], sessions: [] })
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId="routine-with-time" />
      </StoreWrapper>,
    )

    await user.click(screen.getByTestId('edit-time-morning'))
    expect(screen.getByTestId('edit-time-morning')).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByTestId('save-button'))

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.routines[0].activities[0].preferredTime).toBeUndefined()
  })
})

describe('EditRoutineScreen — preset pills', () => {
  it('tapping "Every day" preset selects all 7 days', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />
      </StoreWrapper>,
    )

    await user.click(screen.getByTestId('edit-preset-every-day'))

    for (let d = 1; d <= 7; d++) {
      expect(screen.getByTestId(`edit-day-${d}`)).toHaveAttribute('aria-pressed', 'true')
    }
  })

  it('tapping "3×/week" preset selects Mon, Wed, Fri', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />
      </StoreWrapper>,
    )

    await user.click(screen.getByTestId('edit-preset-3-week'))

    expect(screen.getByTestId('edit-day-1')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('edit-day-3')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('edit-day-5')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('edit-day-2')).toHaveAttribute('aria-pressed', 'false')
  })

  it('preset pill highlights when selection matches', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />
      </StoreWrapper>,
    )

    // Select Mon, Wed, Fri manually
    await user.click(screen.getByTestId('edit-day-1'))
    await user.click(screen.getByTestId('edit-day-3'))
    await user.click(screen.getByTestId('edit-day-5'))

    const preset = screen.getByTestId('edit-preset-3-week')
    expect(preset.className).toContain('bg-brand')
  })
})
