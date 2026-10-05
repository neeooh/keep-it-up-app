/**
 * ActiveSessionScreen tests.
 *
 * - Incomplete session validation (button disabled)
 * - AVOID stayedOnTrack recording
 * - addSession receives correct ActivityResult[]
 * - Pre-fill from last session for strength
 * - Routine-not-found error state
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ActiveSessionScreen } from './ActiveSessionScreen'
import {
  STRENGTH_ROUTINE,
  RUNNING_ROUTINE,
  AVOID_ROUTINE,
  makeStrengthSession,
  daysAgo,
  seedStore,
  clearStore,
} from './__tests__/fixtures'
import { STORAGE_KEY } from '../store/useAppStore'

afterEach(() => {
  clearStore()
})

describe('ActiveSessionScreen — routine not found', () => {
  it('shows error state when routineId does not match any routine', () => {
    seedStore({ routines: [], sessions: [] })
    render(
      <ActiveSessionScreen navigate={vi.fn()} routineId="nonexistent" />,
    )
    expect(screen.getByText(/routine not found/i)).toBeInTheDocument()
  })

  it('shows error state when routineId is null', () => {
    seedStore({ routines: [], sessions: [] })
    render(<ActiveSessionScreen navigate={vi.fn()} routineId={null} />)
    expect(screen.getByText(/routine not found/i)).toBeInTheDocument()
  })

  it('"Back to dashboard" button navigates', async () => {
    seedStore({ routines: [], sessions: [] })
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(<ActiveSessionScreen navigate={navigate} routineId={null} />)
    await user.click(screen.getByTestId('back-to-dashboard'))
    expect(navigate).toHaveBeenCalledWith('dashboard')
  })
})

describe('ActiveSessionScreen — strength activity', () => {
  it('renders set rows for a strength activity', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <ActiveSessionScreen
        navigate={vi.fn()}
        routineId={STRENGTH_ROUTINE.id}
      />,
    )
    expect(screen.getByTestId('set-row-0')).toBeInTheDocument()
  })

  it('complete button is disabled when no sets are filled', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <ActiveSessionScreen
        navigate={vi.fn()}
        routineId={STRENGTH_ROUTINE.id}
      />,
    )
    expect(screen.getByTestId('complete-session-button')).toBeDisabled()
  })

  it('pre-fills from last session', () => {
    const lastSession = makeStrengthSession(
      STRENGTH_ROUTINE.id,
      'act-bench',
      daysAgo(2),
      70,
      8,
    )
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [lastSession] })
    render(
      <ActiveSessionScreen
        navigate={vi.fn()}
        routineId={STRENGTH_ROUTINE.id}
      />,
    )
    // Should have pre-filled weight inputs with 70
    const weightInput = screen.getByTestId('set-weight-0') as HTMLInputElement
    expect(weightInput.value).toBe('70')
  })

  it('saves a complete strength session', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(
      <ActiveSessionScreen
        navigate={navigate}
        routineId={STRENGTH_ROUTINE.id}
      />,
    )

    // Fill in first set
    await user.type(screen.getByTestId('set-weight-0'), '60')
    await user.type(screen.getByTestId('set-reps-0'), '8')

    // Button should be enabled now
    const btn = screen.getByTestId('complete-session-button')
    expect(btn).not.toBeDisabled()

    await user.click(btn)

    // Should navigate to dashboard
    expect(navigate).toHaveBeenCalledWith('dashboard')

    // Verify session was saved in localStorage
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.sessions).toHaveLength(1)
    expect(state.sessions[0].routineId).toBe(STRENGTH_ROUTINE.id)
    expect(state.sessions[0].results[0].sets.length).toBeGreaterThan(0)
  })
})

describe('ActiveSessionScreen — metric activity', () => {
  it('renders metric inputs for running', () => {
    seedStore({ routines: [RUNNING_ROUTINE], sessions: [] })
    render(
      <ActiveSessionScreen
        navigate={vi.fn()}
        routineId={RUNNING_ROUTINE.id}
      />,
    )
    expect(screen.getByTestId('metric-distance')).toBeInTheDocument()
    expect(screen.getByTestId('metric-duration')).toBeInTheDocument()
  })

  it('complete button is disabled when no measurements filled', () => {
    seedStore({ routines: [RUNNING_ROUTINE], sessions: [] })
    render(
      <ActiveSessionScreen
        navigate={vi.fn()}
        routineId={RUNNING_ROUTINE.id}
      />,
    )
    expect(screen.getByTestId('complete-session-button')).toBeDisabled()
  })

  it('saves a complete metric session', async () => {
    seedStore({ routines: [RUNNING_ROUTINE], sessions: [] })
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(
      <ActiveSessionScreen
        navigate={navigate}
        routineId={RUNNING_ROUTINE.id}
      />,
    )

    await user.type(screen.getByTestId('metric-distance'), '5.2')

    await user.click(screen.getByTestId('complete-session-button'))
    expect(navigate).toHaveBeenCalledWith('dashboard')

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.sessions[0].results[0].measurements.distance).toBe(5.2)
  })
})

describe('ActiveSessionScreen — AVOID activity', () => {
  it('renders the stay-on-track buttons', () => {
    seedStore({ routines: [AVOID_ROUTINE], sessions: [] })
    render(
      <ActiveSessionScreen
        navigate={vi.fn()}
        routineId={AVOID_ROUTINE.id}
      />,
    )
    expect(screen.getByTestId('avoid-yes')).toBeInTheDocument()
    expect(screen.getByTestId('avoid-no')).toBeInTheDocument()
  })

  it('complete button is disabled until stayedOnTrack is set', () => {
    seedStore({ routines: [AVOID_ROUTINE], sessions: [] })
    render(
      <ActiveSessionScreen
        navigate={vi.fn()}
        routineId={AVOID_ROUTINE.id}
      />,
    )
    expect(screen.getByTestId('complete-session-button')).toBeDisabled()
  })

  it('records stayedOnTrack = true', async () => {
    seedStore({ routines: [AVOID_ROUTINE], sessions: [] })
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(
      <ActiveSessionScreen
        navigate={navigate}
        routineId={AVOID_ROUTINE.id}
      />,
    )

    await user.click(screen.getByTestId('avoid-yes'))
    await user.click(screen.getByTestId('complete-session-button'))

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.sessions[0].results[0].stayedOnTrack).toBe(true)
  })

  it('records stayedOnTrack = false', async () => {
    seedStore({ routines: [AVOID_ROUTINE], sessions: [] })
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(
      <ActiveSessionScreen
        navigate={navigate}
        routineId={AVOID_ROUTINE.id}
      />,
    )

    await user.click(screen.getByTestId('avoid-no'))
    await user.click(screen.getByTestId('complete-session-button'))

    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(state.sessions[0].results[0].stayedOnTrack).toBe(false)
  })
})
