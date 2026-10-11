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
  AVOID_ROUTINE,
  makeStrengthSession,
  makeAvoidSession,
  daysAgo,
  seedStore,
  clearStore,
  StoreWrapper,
} from './__tests__/fixtures'
import type { Routine, DayOfWeek } from '../domain/types'

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
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={navigate}
          onStartSession={onStartSession}
        />
      </StoreWrapper>,
    )
    return { navigate, onStartSession }
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

  it('shows tappable card for incomplete activities', () => {
    setup()
    const card = screen.getByTestId(`activity-card-act-bench`)
    expect(card.getAttribute('role')).toBe('button')
  })

  it('calls onStartSession with the correct routine ID', async () => {
    const user = userEvent.setup()
    const { onStartSession } = setup()
    await user.click(screen.getByTestId(`activity-card-act-bench`))
    expect(onStartSession).toHaveBeenCalledWith(STRENGTH_ROUTINE.id)
  })
})

describe('DashboardScreen — completed activity state', () => {
  it('shows Done badge and Log again link', () => {
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
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('completed-badge-act-bench')).toHaveTextContent('Done')
    const logBtn = screen.getByTestId(`log-session-button-${STRENGTH_ROUTINE.id}`)
    expect(logBtn).toHaveTextContent('Log again')
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
        />
      </StoreWrapper>,
    )
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
        />
      </StoreWrapper>,
    )
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
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={navigate}
          onStartSession={onStartSession}
        />
      </StoreWrapper>,
    )
    return { navigate, onStartSession }
  }

  it('renders an activity card for each routine\'s activities', () => {
    setupMulti()
    expect(screen.getByTestId('activity-card-act-bench')).toBeInTheDocument()
    expect(screen.getByTestId('activity-card-act-run')).toBeInTheDocument()
  })

  it('renders a tappable card for each routine', () => {
    setupMulti()
    expect(
      screen.getByTestId(`activity-card-act-bench`),
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(`activity-card-act-run`),
    ).toBeInTheDocument()
  })

  it('calls onStartSession with the correct ID for each routine', async () => {
    const user = userEvent.setup()
    const { onStartSession } = setupMulti()
    await user.click(screen.getByTestId(`activity-card-act-run`))
    expect(onStartSession).toHaveBeenCalledWith(RUNNING_ROUTINE.id)
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
        />
      </StoreWrapper>,
    )
    expect(screen.queryByText('Momentum')).not.toBeInTheDocument()
    expect(screen.queryByText('This week')).not.toBeInTheDocument()
    expect(screen.queryByTestId('overall-consistency')).not.toBeInTheDocument()
  })
})

describe('DashboardScreen — remind button', () => {
  it('shows overflow menu button for incomplete activities', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId(`remind-button-${STRENGTH_ROUTINE.id}`)).toBeInTheDocument()
  })

  it('opens remind menu on click', async () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    await user.click(screen.getByTestId(`remind-button-${STRENGTH_ROUTINE.id}`))
    expect(screen.getByTestId(`remind-menu-${STRENGTH_ROUTINE.id}`)).toBeInTheDocument()
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
        />
      </StoreWrapper>,
    )
    expect(screen.queryByTestId(`remind-button-${STRENGTH_ROUTINE.id}`)).not.toBeInTheDocument()
  })

  it('overflow menu button is inside the tappable card', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    const card = screen.getByTestId(`activity-card-act-bench`)
    const remindBtn = screen.getByTestId(`remind-button-${STRENGTH_ROUTINE.id}`)
    expect(card.contains(remindBtn)).toBe(true)
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
        />
      </StoreWrapper>,
    )
    const cards = screen.getAllByTestId(/^activity-card-/)
    // Running (incomplete) should appear before Bench Press (completed)
    expect(cards[0]).toHaveAttribute('data-testid', 'activity-card-act-run')
    expect(cards[1]).toHaveAttribute('data-testid', 'activity-card-act-bench')
  })
})

describe('DashboardScreen — missed-yesterday banner', () => {
  it('does NOT show when sessions is empty (first-time user)', () => {
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.queryByTestId('missed-yesterday')).not.toBeInTheDocument()
  })

  it('does NOT show when routine was created today', () => {
    const newRoutine: Routine = {
      ...STRENGTH_ROUTINE,
      createdAt: new Date().toISOString(),
    }
    // Provide an old session from another routine so sessions.length > 0
    const sessions = [
      makeStrengthSession('other-routine', 'other-act', daysAgo(3), 50, 8),
    ]
    seedStore({ routines: [newRoutine], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.queryByTestId('missed-yesterday')).not.toBeInTheDocument()
  })

  it('does NOT show when all activities are completed today', () => {
    const nowIso = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', daysAgo(3), 50, 8),
      makeStrengthSession(STRENGTH_ROUTINE.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.queryByTestId('missed-yesterday')).not.toBeInTheDocument()
  })

  it('shows banner when a daily routine was missed yesterday', () => {
    // AVOID_ROUTINE has frequency 'daily'
    const sessions = [
      makeAvoidSession(AVOID_ROUTINE.id, 'act-no-fast-food', daysAgo(3), true),
    ]
    seedStore({ routines: [AVOID_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('missed-yesterday')).toBeInTheDocument()
  })
})

describe('DashboardScreen — tomorrow preview', () => {
  // Set system time to Wednesday 2025-10-08 12:00 UTC.
  // Tomorrow is Thursday → ISO dow 4.
  const WEDNESDAY = new Date(Date.UTC(2025, 9, 8, 12, 0, 0))
  const THURSDAY_DOW: DayOfWeek = 4

  afterEach(() => {
    vi.useRealTimers()
    clearStore()
  })

  function setupFakeTime() {
    vi.useFakeTimers()
    vi.setSystemTime(WEDNESDAY)
  }

  it('shows tomorrow preview for a routine with daily frequency', () => {
    setupFakeTime()
    // AVOID_ROUTINE has frequency 'daily' — scheduled today AND tomorrow
    seedStore({ routines: [AVOID_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('tomorrow-preview')).toBeInTheDocument()
    const preview = screen.getByTestId('tomorrow-preview')
    expect(preview).toHaveTextContent(/No Fast Food/)
    expect(preview).toHaveTextContent(/1 activity/)
  })

  it('shows tomorrow preview when scheduledDays includes tomorrow', () => {
    setupFakeTime()
    // Wednesday = dow 3, Thursday = dow 4
    // Scheduled Wed + Thu so it appears on today's list AND tomorrow preview
    const WEDNESDAY_DOW: DayOfWeek = 3
    const routine: Routine = {
      id: 'routine-wed-thu',
      name: 'Wed-Thu Run',
      createdAt: '2025-09-01T00:00:00.000Z',
      activities: [
        {
          id: 'act-wed-thu-run',
          name: 'Run',
          direction: 'DO',
          measurements: [],
          frequency: '2x_week',
          scheduledDays: [WEDNESDAY_DOW, THURSDAY_DOW],
        },
      ],
    }
    seedStore({ routines: [routine], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('tomorrow-preview')).toBeInTheDocument()
    const preview = screen.getByTestId('tomorrow-preview')
    expect(preview).toHaveTextContent(/Wed-Thu Run/)
  })

  it('does NOT show tomorrow preview when no routines are scheduled for tomorrow', () => {
    setupFakeTime()
    // Scheduled only on Wednesday (3) — shows today, but tomorrow (Thu 4) has nothing
    const WEDNESDAY_DOW: DayOfWeek = 3
    const routine: Routine = {
      id: 'routine-wed-only',
      name: 'Wednesday Only',
      createdAt: '2025-09-01T00:00:00.000Z',
      activities: [
        {
          id: 'act-wed',
          name: 'Wednesday workout',
          direction: 'DO',
          measurements: [],
          frequency: '1x_week',
          scheduledDays: [WEDNESDAY_DOW],
        },
      ],
    }
    seedStore({ routines: [routine], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.queryByTestId('tomorrow-preview')).not.toBeInTheDocument()
  })

  it('excludes routines with no scheduledDays and non-daily frequency', () => {
    setupFakeTime()
    // STRENGTH_ROUTINE: frequency '3x_week', no scheduledDays
    // RUNNING_ROUTINE: frequency '2x_week', no scheduledDays
    // Both show on today's list (buildTodayCards treats empty scheduledDays as "every day")
    // but buildTomorrowNames excludes them because it cannot predict non-daily + no days
    seedStore({ routines: [STRENGTH_ROUTINE, RUNNING_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.queryByTestId('tomorrow-preview')).not.toBeInTheDocument()
  })
})

describe('DashboardScreen — primary target subtitle', () => {
  it('shows distance target for a DO activity with distance measurement', () => {
    seedStore({ routines: [RUNNING_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    // RUNNING_ROUTINE has distance target 5 km (highest priority)
    expect(screen.getByText('5 km target')).toBeInTheDocument()
  })

  it('shows duration target for a DO activity with duration-only measurement', () => {
    const durationOnlyRoutine: Routine = {
      id: 'routine-meditation',
      name: 'Meditation',
      createdAt: daysAgo(10),
      activities: [
        {
          id: 'act-meditate',
          name: 'Meditate',
          direction: 'DO',
          measurements: [{ type: 'duration', unit: 'min', target: 20 }],
          frequency: 'daily',
        },
      ],
    }
    seedStore({ routines: [durationOnlyRoutine], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByText('20 min target')).toBeInTheDocument()
  })

  it('shows no subtitle for an AVOID activity', () => {
    seedStore({ routines: [AVOID_ROUTINE], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.queryByText(/target/)).not.toBeInTheDocument()
  })

  it('shows exercise names for a multi-activity routine', () => {
    const multiRoutine: Routine = {
      id: 'routine-multi',
      name: 'Full Body',
      createdAt: daysAgo(10),
      activities: [
        {
          id: 'act-squat',
          name: 'Squat',
          direction: 'DO',
          measurements: [{ type: 'sets', target: 3 }, { type: 'reps', target: 10 }],
          frequency: '3x_week',
        },
        {
          id: 'act-deadlift',
          name: 'Deadlift',
          direction: 'DO',
          measurements: [{ type: 'sets', target: 3 }, { type: 'reps', target: 8 }],
          frequency: '3x_week',
        },
      ],
    }
    seedStore({ routines: [multiRoutine], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByText('Squat, Deadlift')).toBeInTheDocument()
  })
})

describe('DashboardScreen — missed-yesterday actionable buttons', () => {
  it('shows Log [routine name] button when a daily routine was missed yesterday', () => {
    // AVOID_ROUTINE has frequency 'daily' and was created 30 days ago
    const sessions = [
      makeAvoidSession(AVOID_ROUTINE.id, 'act-no-fast-food', daysAgo(3), true),
    ]
    seedStore({ routines: [AVOID_ROUTINE], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('missed-yesterday')).toBeInTheDocument()
    expect(screen.getByTestId(`log-yesterday-${AVOID_ROUTINE.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`log-yesterday-${AVOID_ROUTINE.id}`)).toHaveTextContent('Log No Fast Food')
  })

  it('calls onStartSession with routine id and yesterday date when Log button is clicked', async () => {
    const sessions = [
      makeAvoidSession(AVOID_ROUTINE.id, 'act-no-fast-food', daysAgo(3), true),
    ]
    seedStore({ routines: [AVOID_ROUTINE], sessions })
    const onStartSession = vi.fn()
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={onStartSession}
        />
      </StoreWrapper>,
    )
    await user.click(screen.getByTestId(`log-yesterday-${AVOID_ROUTINE.id}`))
    const expectedYesterday = (() => {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - 1)
      return d.toISOString().slice(0, 10)
    })()
    expect(onStartSession).toHaveBeenCalledWith(AVOID_ROUTINE.id, expectedYesterday)
  })
})

describe('DashboardScreen — time-of-day grouping', () => {
  it('shows time-group headers when activities span multiple time slots', () => {
    const morningRoutine: Routine = {
      id: 'routine-morning',
      name: 'Morning Meditation',
      createdAt: daysAgo(10),
      activities: [
        {
          id: 'act-meditate',
          name: 'Meditate',
          direction: 'DO',
          measurements: [{ type: 'duration', unit: 'min', target: 15 }],
          frequency: 'daily',
          preferredTime: 'Morning',
        },
      ],
    }
    const eveningRoutine: Routine = {
      id: 'routine-evening',
      name: 'Evening Reading',
      createdAt: daysAgo(10),
      activities: [
        {
          id: 'act-read',
          name: 'Read',
          direction: 'DO',
          measurements: [{ type: 'duration', unit: 'min', target: 30 }],
          frequency: 'daily',
          preferredTime: 'Evening',
        },
      ],
    }
    seedStore({ routines: [morningRoutine, eveningRoutine], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('time-group-morning')).toHaveTextContent('Morning')
    expect(screen.getByTestId('time-group-evening')).toHaveTextContent('Evening')
  })

  it('shows no time-group header when all activities share the same preferred time', () => {
    const morningA: Routine = {
      id: 'routine-morning-a',
      name: 'Stretch',
      createdAt: daysAgo(10),
      activities: [
        {
          id: 'act-stretch',
          name: 'Stretch',
          direction: 'DO',
          measurements: [],
          frequency: 'daily',
          preferredTime: 'Morning',
        },
      ],
    }
    const morningB: Routine = {
      id: 'routine-morning-b',
      name: 'Journal',
      createdAt: daysAgo(10),
      activities: [
        {
          id: 'act-journal',
          name: 'Journal',
          direction: 'DO',
          measurements: [],
          frequency: 'daily',
          preferredTime: 'Morning',
        },
      ],
    }
    seedStore({ routines: [morningA, morningB], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    // Both cards render, but no group header
    expect(screen.getByTestId('activity-card-act-stretch')).toBeInTheDocument()
    expect(screen.getByTestId('activity-card-act-journal')).toBeInTheDocument()
    expect(screen.queryByTestId('time-group-morning')).not.toBeInTheDocument()
  })

  it('groups mixed activities into correct time slots', () => {
    const morningRoutine: Routine = {
      id: 'routine-grp-morning',
      name: 'Yoga',
      createdAt: daysAgo(10),
      activities: [
        {
          id: 'act-yoga',
          name: 'Yoga',
          direction: 'DO',
          measurements: [],
          frequency: 'daily',
          preferredTime: 'Morning',
        },
      ],
    }
    const afternoonRoutine: Routine = {
      id: 'routine-grp-afternoon',
      name: 'Walk',
      createdAt: daysAgo(10),
      activities: [
        {
          id: 'act-walk',
          name: 'Walk',
          direction: 'DO',
          measurements: [],
          frequency: 'daily',
          preferredTime: 'Afternoon',
        },
      ],
    }
    const noTimeRoutine: Routine = {
      id: 'routine-grp-anytime',
      name: 'Drink Water',
      createdAt: daysAgo(10),
      activities: [
        {
          id: 'act-water',
          name: 'Drink Water',
          direction: 'DO',
          measurements: [],
          frequency: 'daily',
        },
      ],
    }
    seedStore({
      routines: [morningRoutine, afternoonRoutine, noTimeRoutine],
      sessions: [],
    })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('time-group-morning')).toBeInTheDocument()
    expect(screen.getByTestId('time-group-afternoon')).toBeInTheDocument()
    expect(screen.getByTestId('time-group-anytime')).toBeInTheDocument()
    // Verify the cards themselves still render
    expect(screen.getByTestId('activity-card-act-yoga')).toBeInTheDocument()
    expect(screen.getByTestId('activity-card-act-walk')).toBeInTheDocument()
    expect(screen.getByTestId('activity-card-act-water')).toBeInTheDocument()
  })
})