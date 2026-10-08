/**
 * DashboardScreen tests — Today screen.
 *
 * - Empty state renders create-routine prompt
 * - Daily completion summary (X of Y completed)
 * - Activity cards with correct states
 * - Start / Log another button behavior
 * - Activity sorting by preferred time and duration
 * - "Create a routine" navigates to welcome
 * - Multiple routines each get their own activity card
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DashboardScreen } from './DashboardScreen'
import {
  STRENGTH_ROUTINE,
  RUNNING_ROUTINE,
  makeStrengthSession,
  daysAgo,
  seedStore,
  clearStore,
  StoreWrapper,
} from './__tests__/fixtures'

afterEach(() => {
  clearStore()
})

describe('DashboardScreen — empty state', () => {
  it('renders empty state when no routines exist', () => {
    seedStore({ routines: [], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('dashboard-empty')).toBeInTheDocument()
    expect(screen.getByText(/no routines yet/i)).toBeInTheDocument()
  })

  it('has a "Create a routine" button that navigates to welcome', async () => {
    seedStore({ routines: [], sessions: [] })
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={navigate}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    await user.click(screen.getByTestId('create-routine-button'))
    expect(navigate).toHaveBeenCalledWith('welcome')
  })
})

describe('DashboardScreen — daily completion summary', () => {
  it('shows "0 of N completed" when no sessions exist today', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('completion-text')).toHaveTextContent(/0 of \d+ completed/)
    expect(screen.getByTestId('daily-summary')).toBeInTheDocument()
    expect(screen.getByTestId('completion-bar')).toBeInTheDocument()
  })

  it('shows correct count when a session was completed today', () => {
    const nowIso = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('completion-text')).toHaveTextContent(/1 of \d+ completed/)
  })
})

describe('DashboardScreen — activity cards', () => {
  function setup() {
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(2), 60, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    const navigate = vi.fn()
    const onStartSession = vi.fn()
    const onEditRoutine = vi.fn()
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={navigate}
          onStartSession={onStartSession}
          onEditRoutine={onEditRoutine}
        />
      </StoreWrapper>,
    )
    return { navigate, onStartSession, onEditRoutine }
  }

  it('renders a page header with today\'s date when sessions exist', () => {
    setup()
    const weekday = new Date().toLocaleDateString('en-GB', { weekday: 'long' })
    expect(
      screen.getByRole('heading', { name: new RegExp(weekday, 'i') }),
    ).toBeInTheDocument()
  })

  it('renders an activity card for each activity', () => {
    setup()
    expect(screen.getByTestId('activity-card-act-bench')).toBeInTheDocument()
  })

  it('shows "Log" button for incomplete activities', () => {
    setup()
    const btn = screen.getByTestId(`log-session-button-${STRENGTH_ROUTINE.id}`)
    expect(btn).toHaveTextContent('Log')
  })

  it('calls onStartSession with the correct routine ID', async () => {
    const user = userEvent.setup()
    const { onStartSession } = setup()
    await user.click(screen.getByTestId(`log-session-button-${STRENGTH_ROUTINE.id}`))
    expect(onStartSession).toHaveBeenCalledWith(STRENGTH_ROUTINE.id)
  })

  it('shows edit button for each routine', () => {
    setup()
    expect(
      screen.getByTestId(`edit-routine-button-${STRENGTH_ROUTINE.id}`),
    ).toBeInTheDocument()
  })

  it('calls onEditRoutine with the correct ID when edit is clicked', async () => {
    const user = userEvent.setup()
    const { onEditRoutine } = setup()
    await user.click(screen.getByTestId(`edit-routine-button-${STRENGTH_ROUTINE.id}`))
    expect(onEditRoutine).toHaveBeenCalledWith(STRENGTH_ROUTINE.id)
  })
})

describe('DashboardScreen — completed activity state', () => {
  it('shows "Completed" on the same line as the tick icon', () => {
    const nowIso = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Log another')).toBeInTheDocument()
  })

  it('shows session measurements on the completed card', () => {
    const nowIso = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    // Strength session with 3 sets of 60kg x 8 = 1440kg volume
    expect(screen.getByText(/1440 kg volume/)).toBeInTheDocument()
  })

  it('shows delta when a previous session exists', () => {
    const nowIso = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(2), 50, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    // 50*8*3=1200 → 60*8*3=1440: +20%
    expect(screen.getByTestId('activity-delta-act-bench')).toBeInTheDocument()
    expect(screen.getByText(/\+20%/)).toBeInTheDocument()
  })

  it('does not show delta when no previous session exists', () => {
    const nowIso = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.queryByTestId('activity-delta-act-bench')).not.toBeInTheDocument()
  })
})

describe('DashboardScreen — multiple routines', () => {
  function setupMulti() {
    seedStore({ routines: [STRENGTH_ROUTINE, RUNNING_ROUTINE], sessions: [] })
    const navigate = vi.fn()
    const onStartSession = vi.fn()
    const onEditRoutine = vi.fn()
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={navigate}
          onStartSession={onStartSession}
          onEditRoutine={onEditRoutine}
        />
      </StoreWrapper>,
    )
    return { navigate, onStartSession, onEditRoutine }
  }

  it('renders an activity card for each routine\'s activities', () => {
    setupMulti()
    expect(screen.getByTestId('activity-card-act-bench')).toBeInTheDocument()
    expect(screen.getByTestId('activity-card-act-run')).toBeInTheDocument()
  })

  it('renders a log-session button for each routine', () => {
    setupMulti()
    expect(
      screen.getByTestId(`log-session-button-${STRENGTH_ROUTINE.id}`),
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(`log-session-button-${RUNNING_ROUTINE.id}`),
    ).toBeInTheDocument()
  })

  it('renders an edit button for each routine', () => {
    setupMulti()
    expect(
      screen.getByTestId(`edit-routine-button-${STRENGTH_ROUTINE.id}`),
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(`edit-routine-button-${RUNNING_ROUTINE.id}`),
    ).toBeInTheDocument()
  })

  it('calls onStartSession with the correct ID for each routine', async () => {
    const user = userEvent.setup()
    const { onStartSession } = setupMulti()
    await user.click(screen.getByTestId(`log-session-button-${RUNNING_ROUTINE.id}`))
    expect(onStartSession).toHaveBeenCalledWith(RUNNING_ROUTINE.id)
  })

  it('calls onEditRoutine with the correct ID when edit is clicked', async () => {
    const user = userEvent.setup()
    const { onEditRoutine } = setupMulti()
    await user.click(screen.getByTestId(`edit-routine-button-${STRENGTH_ROUTINE.id}`))
    expect(onEditRoutine).toHaveBeenCalledWith(STRENGTH_ROUTINE.id)
  })
})

describe('DashboardScreen — no analytics sections', () => {
  it('does not render Momentum, This Week, or Progress sections', () => {
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(2), 60, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(5), 65, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.queryByText('Momentum')).not.toBeInTheDocument()
    expect(screen.queryByText('This week')).not.toBeInTheDocument()
    expect(screen.queryByTestId('overall-consistency')).not.toBeInTheDocument()
  })
})

describe('DashboardScreen — remind button', () => {
  it('shows remind button next to Log for incomplete activities', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('remind-button-act-bench')).toBeInTheDocument()
    expect(screen.getByText('Remind')).toBeInTheDocument()
  })

  it('opens remind menu on click', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    await user.click(screen.getByTestId('remind-button-act-bench'))
    expect(screen.getByTestId('remind-menu-act-bench')).toBeInTheDocument()
    expect(screen.getByText('15 min')).toBeInTheDocument()
    expect(screen.getByText('1 hour')).toBeInTheDocument()
    expect(screen.getByText('This evening')).toBeInTheDocument()
  })

  it('does not show remind button for completed activities', () => {
    const nowIso = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.queryByTestId('remind-button-act-bench')).not.toBeInTheDocument()
  })

  it('Log and Remind buttons share the row (both visible)', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    const logBtn = screen.getByTestId(`log-session-button-${STRENGTH_ROUTINE.id}`)
    const remindBtn = screen.getByTestId('remind-button-act-bench')
    // Both should be in the same parent row
    expect(logBtn.parentElement).toBe(remindBtn.closest('div')?.parentElement)
  })
})

describe('DashboardScreen — activity sorting', () => {
  it('sorts completed activities below incomplete ones', () => {
    const nowIso = new Date().toISOString()
    // Strength routine has a session today (completed), Running does not
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE, RUNNING_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
          onEditRoutine={vi.fn()}
        />
      </StoreWrapper>,
    )
    const cards = screen.getAllByTestId(/^activity-card-/)
    // Running (incomplete) should appear before Bench Press (completed)
    expect(cards[0]).toHaveAttribute('data-testid', 'activity-card-act-run')
    expect(cards[1]).toHaveAttribute('data-testid', 'activity-card-act-bench')
  })
})
