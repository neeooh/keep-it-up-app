/**
 * EditRoutineScreen tests.
 *
 * - Save persists updated values
 * - Delete removes routine
 * - Cancel leaves store unchanged
 * - Pre-population of fields from existing routine
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
} from './__tests__/fixtures'
import { STORAGE_KEY } from '../store/useAppStore'

afterEach(() => {
  clearStore()
})

describe('EditRoutineScreen — not found', () => {
  it('shows error when routineId is null', () => {
    seedStore({ routines: [], sessions: [] })
    render(<EditRoutineScreen navigate={vi.fn()} routineId={null} />)
    expect(screen.getByText(/routine not found/i)).toBeInTheDocument()
  })

  it('shows error when routineId does not match', () => {
    seedStore({ routines: [], sessions: [] })
    render(<EditRoutineScreen navigate={vi.fn()} routineId="nonexistent" />)
    expect(screen.getByText(/routine not found/i)).toBeInTheDocument()
  })
})

describe('EditRoutineScreen — pre-population', () => {
  it('pre-populates the routine name', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />,
    )
    const input = screen.getByTestId('edit-name') as HTMLInputElement
    expect(input.value).toBe('Strength Training')
  })

  it('pre-selects the current frequency', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />,
    )
    const radio = screen.getByTestId('edit-frequency-3x_week')
    expect(radio).toHaveAttribute('aria-checked', 'true')
  })
})

describe('EditRoutineScreen — save', () => {
  it('saves updated routine name and navigates to dashboard', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(
      <EditRoutineScreen navigate={navigate} routineId={STRENGTH_ROUTINE.id} />,
    )

    const input = screen.getByTestId('edit-name') as HTMLInputElement
    await user.clear(input)
    await user.type(input, 'Upper Body')

    await user.click(screen.getByTestId('save-button'))

    expect(navigate).toHaveBeenCalledWith('dashboard')

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.routines[0].name).toBe('Upper Body')
  })

  it('saves updated frequency', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const user = userEvent.setup()
    render(
      <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />,
    )

    await user.click(screen.getByTestId('edit-frequency-2x_week'))
    await user.click(screen.getByTestId('save-button'))

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.routines[0].activities[0].frequency).toBe('2x_week')
  })
})

describe('EditRoutineScreen — cancel', () => {
  it('navigates to dashboard without saving changes', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(
      <EditRoutineScreen navigate={navigate} routineId={STRENGTH_ROUTINE.id} />,
    )

    // Make a change
    const input = screen.getByTestId('edit-name') as HTMLInputElement
    await user.clear(input)
    await user.type(input, 'Changed Name')

    // Cancel
    await user.click(screen.getByTestId('cancel-button'))

    expect(navigate).toHaveBeenCalledWith('dashboard')

    // Store should still have original name
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.routines[0].name).toBe('Strength Training')
  })
})

describe('EditRoutineScreen — delete', () => {
  it('shows confirmation dialog when delete is clicked', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const user = userEvent.setup()
    render(
      <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />,
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
      <EditRoutineScreen navigate={navigate} routineId={STRENGTH_ROUTINE.id} />,
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
      <EditRoutineScreen navigate={vi.fn()} routineId={STRENGTH_ROUTINE.id} />,
    )

    await user.click(screen.getByTestId('delete-routine-button'))
    await user.click(screen.getByTestId('delete-cancel'))

    // Routine still exists
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.routines).toHaveLength(1)
  })
})
