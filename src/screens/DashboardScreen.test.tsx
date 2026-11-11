/**
 * DashboardScreen tests — Today screen.
 *
 * - Empty state renders create-commitment prompt
 * - Daily completion summary (X of Y completed)
 * - Activity cards with correct states
 * - Start / Log another button behavior
 * - Activity sorting by preferred time and duration
 * - "Create a commitment" navigates to welcome
 * - Multiple commitments each get their own activity card
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DashboardScreen } from './DashboardScreen'
import {
  STRENGTH_COMMITMENT,
  RUNNING_COMMITMENT,
  AVOID_COMMITMENT,
  makeStrengthSession,
  makeAvoidSession,
  daysAgo,
  seedStore,
  clearStore,
  StoreWrapper,
} from './__tests__/fixtures'
import type { Commitment, DayOfWeek } from '../domain/types'

afterEach(() => {
  clearStore()
})

describe('DashboardScreen — empty state', () => {
  it('renders empty state when no commitments exist', () => {
    seedStore({ commitments: [], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('dashboard-empty')).toBeInTheDocument()
    expect(screen.getByText(/no commitments yet/i)).toBeInTheDocument()
  })

  it('has a "Create a commitment" button that navigates to welcome', async () => {
    seedStore({ commitments: [], sessions: [] })
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
    await user.click(screen.getByTestId('create-commitment-button'))
    expect(navigate).toHaveBeenCalledWith('welcome')
  })
})

describe('DashboardScreen — daily completion summary', () => {
  it('shows "0 of N completed" when no sessions exist today', () => {
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions: [] })
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
  })

  it('shows correct count when a session was completed today', () => {
    const nowIso = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ commitments: [STRENGTH_COMMITMENT, RUNNING_COMMITMENT], sessions })
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
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', daysAgo(2), 60, 8),
    ]
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions })
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

  it('renders a greeting when sessions exist', () => {
    setup()
    expect(
      screen.getByText(/good (morning|afternoon|evening)/i),
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

  it('calls onStartSession with the correct commitment ID', async () => {
    const user = userEvent.setup()
    const { onStartSession } = setup()
    await user.click(screen.getByTestId(`activity-card-act-bench`))
    expect(onStartSession).toHaveBeenCalledWith(STRENGTH_COMMITMENT.id)
  })
})

describe('DashboardScreen — completed activity state', () => {
  it('shows Done badge and Log again link', () => {
    const nowIso = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('completed-badge-act-bench')).toHaveTextContent('Done')
    const logBtn = screen.getByTestId(`log-session-button-${STRENGTH_COMMITMENT.id}`)
    expect(logBtn).toHaveTextContent('Log again')
  })

  it('shows session measurements on the completed card', () => {
    const nowIso = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions })
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
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', daysAgo(2), 50, 8),
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions })
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
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions })
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

describe('DashboardScreen — multiple commitments', () => {
  function setupMulti() {
    seedStore({ commitments: [STRENGTH_COMMITMENT, RUNNING_COMMITMENT], sessions: [] })
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

  it('renders an activity card for each commitment\'s activities', () => {
    setupMulti()
    expect(screen.getByTestId('activity-card-act-bench')).toBeInTheDocument()
    expect(screen.getByTestId('activity-card-act-run')).toBeInTheDocument()
  })

  it('renders a tappable card for each commitment', () => {
    setupMulti()
    expect(
      screen.getByTestId(`activity-card-act-bench`),
    ).toBeInTheDocument()
    expect(
      screen.getByTestId(`activity-card-act-run`),
    ).toBeInTheDocument()
  })

  it('calls onStartSession with the correct ID for each commitment', async () => {
    const user = userEvent.setup()
    const { onStartSession } = setupMulti()
    await user.click(screen.getByTestId(`activity-card-act-run`))
    expect(onStartSession).toHaveBeenCalledWith(RUNNING_COMMITMENT.id)
  })
})

describe('DashboardScreen — no analytics sections', () => {
  it('does not render Momentum, This Week, or Progress sections', () => {
    const sessions = [
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', daysAgo(2), 60, 8),
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', daysAgo(5), 65, 8),
    ]
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions })
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
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId(`remind-button-${STRENGTH_COMMITMENT.id}`)).toBeInTheDocument()
  })

  it('opens remind menu on click', async () => {
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions: [] })
    const user = userEvent.setup()
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    await user.click(screen.getByTestId(`remind-button-${STRENGTH_COMMITMENT.id}`))
    expect(screen.getByTestId(`remind-menu-${STRENGTH_COMMITMENT.id}`)).toBeInTheDocument()
    expect(screen.getByText('15 min')).toBeInTheDocument()
    expect(screen.getByText('1 hour')).toBeInTheDocument()
    expect(screen.getByText('This evening')).toBeInTheDocument()
  })

  it('does not show remind button for completed activities', () => {
    const nowIso = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.queryByTestId(`remind-button-${STRENGTH_COMMITMENT.id}`)).not.toBeInTheDocument()
  })

  it('overflow menu button is inside the tappable card', () => {
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    const card = screen.getByTestId(`activity-card-act-bench`)
    const remindBtn = screen.getByTestId(`remind-button-${STRENGTH_COMMITMENT.id}`)
    expect(card.contains(remindBtn)).toBe(true)
  })
})

describe('DashboardScreen — activity sorting', () => {
  it('sorts completed activities below incomplete ones', () => {
    const nowIso = new Date().toISOString()
    // Strength commitment has a session today (completed), Running does not
    const sessions = [
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ commitments: [STRENGTH_COMMITMENT, RUNNING_COMMITMENT], sessions })
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
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions: [] })
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

  it('does NOT show when commitment was created today', () => {
    const newRoutine: Commitment = {
      ...STRENGTH_COMMITMENT,
      createdAt: new Date().toISOString(),
    }
    // Provide an old session from another commitment so sessions.length > 0
    const sessions = [
      makeStrengthSession('other-commitment', 'other-act', daysAgo(3), 50, 8),
    ]
    seedStore({ commitments: [newRoutine], sessions })
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
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', daysAgo(3), 50, 8),
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions })
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

  it('shows banner when a daily commitment was missed yesterday', () => {
    // AVOID_COMMITMENT has frequency 'daily'
    const sessions = [
      makeAvoidSession(AVOID_COMMITMENT.id, 'act-no-fast-food', daysAgo(3), true),
    ]
    seedStore({ commitments: [AVOID_COMMITMENT], sessions })
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

  it('shows tomorrow preview for a commitment with daily frequency', () => {
    setupFakeTime()
    // AVOID_COMMITMENT has frequency 'daily' — scheduled today AND tomorrow
    seedStore({ commitments: [AVOID_COMMITMENT], sessions: [] })
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
    const commitment: Commitment = {
      id: 'commitment-wed-thu',
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
    seedStore({ commitments: [commitment], sessions: [] })
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

  it('does NOT show tomorrow preview when no commitments are scheduled for tomorrow', () => {
    setupFakeTime()
    // Scheduled only on Wednesday (3) — shows today, but tomorrow (Thu 4) has nothing
    const WEDNESDAY_DOW: DayOfWeek = 3
    const commitment: Commitment = {
      id: 'commitment-wed-only',
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
    seedStore({ commitments: [commitment], sessions: [] })
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

  it('excludes commitments with no scheduledDays and non-daily frequency', () => {
    setupFakeTime()
    // STRENGTH_COMMITMENT: frequency '3x_week', no scheduledDays
    // RUNNING_COMMITMENT: frequency '2x_week', no scheduledDays
    // Both show on today's list (buildTodayCards treats empty scheduledDays as "every day")
    // but buildTomorrowNames excludes them because it cannot predict non-daily + no days
    seedStore({ commitments: [STRENGTH_COMMITMENT, RUNNING_COMMITMENT], sessions: [] })
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
    seedStore({ commitments: [RUNNING_COMMITMENT], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    // RUNNING_COMMITMENT has distance target 5 km (highest priority)
    expect(screen.getByText('5 km target')).toBeInTheDocument()
  })

  it('shows duration target for a DO activity with duration-only measurement', () => {
    const durationOnlyRoutine: Commitment = {
      id: 'commitment-meditation',
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
    seedStore({ commitments: [durationOnlyRoutine], sessions: [] })
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
    seedStore({ commitments: [AVOID_COMMITMENT], sessions: [] })
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

  it('shows exercise names for a multi-activity commitment', () => {
    const multiRoutine: Commitment = {
      id: 'commitment-multi',
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
    seedStore({ commitments: [multiRoutine], sessions: [] })
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
  it('shows Log [commitment name] button when a daily commitment was missed yesterday', () => {
    // AVOID_COMMITMENT has frequency 'daily' and was created 30 days ago
    const sessions = [
      makeAvoidSession(AVOID_COMMITMENT.id, 'act-no-fast-food', daysAgo(3), true),
    ]
    seedStore({ commitments: [AVOID_COMMITMENT], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('missed-yesterday')).toBeInTheDocument()
    expect(screen.getByTestId(`log-yesterday-${AVOID_COMMITMENT.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`log-yesterday-${AVOID_COMMITMENT.id}`)).toHaveTextContent('Log No Fast Food')
  })

  it('calls onStartSession with commitment id and yesterday date when Log button is clicked', async () => {
    const sessions = [
      makeAvoidSession(AVOID_COMMITMENT.id, 'act-no-fast-food', daysAgo(3), true),
    ]
    seedStore({ commitments: [AVOID_COMMITMENT], sessions })
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
    await user.click(screen.getByTestId(`log-yesterday-${AVOID_COMMITMENT.id}`))
    const expectedYesterday = (() => {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - 1)
      return d.toISOString().slice(0, 10)
    })()
    expect(onStartSession).toHaveBeenCalledWith(AVOID_COMMITMENT.id, expectedYesterday)
  })
})

describe('DashboardScreen — time-of-day grouping', () => {
  it('shows time-group headers when activities span multiple time slots', () => {
    const morningRoutine: Commitment = {
      id: 'commitment-morning',
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
    const eveningRoutine: Commitment = {
      id: 'commitment-evening',
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
    seedStore({ commitments: [morningRoutine, eveningRoutine], sessions: [] })
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
    const morningA: Commitment = {
      id: 'commitment-morning-a',
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
    const morningB: Commitment = {
      id: 'commitment-morning-b',
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
    seedStore({ commitments: [morningA, morningB], sessions: [] })
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
    const morningRoutine: Commitment = {
      id: 'commitment-grp-morning',
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
    const afternoonRoutine: Commitment = {
      id: 'commitment-grp-afternoon',
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
    const noTimeRoutine: Commitment = {
      id: 'commitment-grp-anytime',
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
      commitments: [morningRoutine, afternoonRoutine, noTimeRoutine],
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

describe('DashboardScreen — streak counter', () => {
  it('shows "Active for X days" when sessions exist but streak < 2', () => {
    const sessions = [
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', daysAgo(5), 60, 8),
    ]
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('streak-counter')).toHaveTextContent(/Active for \d+ days?/)
  })

  it('is hidden when no sessions exist', () => {
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions: [] })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.queryByTestId('streak-counter')).not.toBeInTheDocument()
  })
})

describe('DashboardScreen — completion message', () => {
  it('shows "All done for today" when all activities are completed', () => {
    const nowIso = new Date().toISOString()
    const sessions = [
      makeStrengthSession(STRENGTH_COMMITMENT.id, 'act-bench', nowIso, 60, 8),
    ]
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions })
    render(
      <StoreWrapper>
        <DashboardScreen
          navigate={vi.fn()}
          onStartSession={vi.fn()}
        />
      </StoreWrapper>,
    )
    expect(screen.getByTestId('completion-text')).toHaveTextContent('All done for today')
  })
})
