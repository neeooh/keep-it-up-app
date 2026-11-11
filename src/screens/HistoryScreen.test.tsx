/**
 * HistoryScreen tests.
 *
 * - Sessions ordered newest-first
 * - Empty state
 * - Detail sheet opens on click
 * - Activity results displayed in detail
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HistoryScreen } from './HistoryScreen'
import {
  STRENGTH_COMMITMENT,
  RUNNING_COMMITMENT,
  AVOID_COMMITMENT,
  makeStrengthSession,
  makeRunningSession,
  makeAvoidSession,
  daysAgo,
  seedStore,
  clearStore,
  StoreWrapper,
} from './__tests__/fixtures'

afterEach(() => {
  clearStore()
})

describe('HistoryScreen — empty state', () => {
  it('shows empty state when no sessions exist', () => {
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions: [] })
    render(<StoreWrapper><HistoryScreen navigate={vi.fn()} /></StoreWrapper>)
    expect(screen.getByTestId('history-empty')).toBeInTheDocument()
    expect(screen.getByText(/your history starts here/i)).toBeInTheDocument()
  })
})

describe('HistoryScreen — with sessions', () => {
  function setup() {
    const session1 = makeStrengthSession(
      STRENGTH_COMMITMENT.id,
      'act-bench',
      daysAgo(5),
      60,
      8,
    )
    const session2 = makeStrengthSession(
      STRENGTH_COMMITMENT.id,
      'act-bench',
      daysAgo(2),
      65,
      8,
    )
    const session3 = makeStrengthSession(
      STRENGTH_COMMITMENT.id,
      'act-bench',
      daysAgo(0),
      70,
      8,
    )
    const sessions = [session1, session2, session3]
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions })
    const navigate = vi.fn()
    render(<StoreWrapper><HistoryScreen navigate={navigate} /></StoreWrapper>)
    return { navigate, sessions }
  }

  it('renders all session entries', () => {
    const { sessions } = setup()
    for (const session of sessions) {
      expect(
        screen.getByTestId(`history-entry-${session.id}`),
      ).toBeInTheDocument()
    }
  })

  it('orders sessions newest-first', () => {
    const { sessions } = setup()
    const entries = screen.getAllByTestId(/^history-entry-/)
    // The newest session (daysAgo(0)) should be first
    expect(entries[0]).toHaveAttribute(
      'data-testid',
      `history-entry-${sessions[2]!.id}`,
    )
    // The oldest session (daysAgo(5)) should be last
    expect(entries[entries.length - 1]).toHaveAttribute(
      'data-testid',
      `history-entry-${sessions[0]!.id}`,
    )
  })

  it('expands to show logged date and actions when clicked', async () => {
    const { sessions } = setup()
    const user = userEvent.setup()
    await user.click(screen.getByTestId(`history-entry-${sessions[0]!.id}`))
    expect(screen.getByTestId(`history-detail-${sessions[0]!.id}`)).toBeInTheDocument()
    expect(screen.getByText(/Logged/i)).toBeInTheDocument()
    expect(screen.getByTestId(`edit-session-${sessions[0]!.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`delete-session-${sessions[0]!.id}`)).toBeInTheDocument()
  })

  it('does not show per-activity detail in expanded view (measurements are in summary)', async () => {
    const { sessions } = setup()
    const user = userEvent.setup()
    await user.click(screen.getByTestId(`history-entry-${sessions[0]!.id}`))
    // Measurements are in the summary line, not duplicated in the expanded detail
    expect(screen.queryByTestId('detail-result-act-bench')).not.toBeInTheDocument()
  })

  it('collapses detail when clicking the same session again', async () => {
    const { sessions } = setup()
    const user = userEvent.setup()
    await user.click(screen.getByTestId(`history-entry-${sessions[0]!.id}`))
    expect(screen.getByTestId(`history-detail-${sessions[0]!.id}`)).toBeInTheDocument()
    await user.click(screen.getByTestId(`history-entry-${sessions[0]!.id}`))
    expect(screen.queryByTestId(`history-detail-${sessions[0]!.id}`)).not.toBeInTheDocument()
  })

  it('shows delete confirmation when delete is clicked', async () => {
    const { sessions } = setup()
    const user = userEvent.setup()
    await user.click(screen.getByTestId(`history-entry-${sessions[0]!.id}`))
    await user.click(screen.getByTestId(`delete-session-${sessions[0]!.id}`))
    expect(screen.getByText(/delete this session/i)).toBeInTheDocument()
    expect(screen.getByTestId(`confirm-delete-${sessions[0]!.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`cancel-delete-${sessions[0]!.id}`)).toBeInTheDocument()
  })
})

describe('HistoryScreen — edit session dialog', () => {
  it('opens edit dialog when Edit button is clicked (does not navigate)', async () => {
    const session = makeStrengthSession(
      STRENGTH_COMMITMENT.id,
      'act-bench',
      daysAgo(0),
      70,
      8,
    )
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions: [session] })
    const navigate = vi.fn()
    const user = userEvent.setup()
    render(<StoreWrapper><HistoryScreen navigate={navigate} /></StoreWrapper>)

    // Expand the entry
    await user.click(screen.getByTestId(`history-entry-${session.id}`))
    // Click Edit
    await user.click(screen.getByTestId(`edit-session-${session.id}`))

    // Dialog should appear
    expect(screen.getByTestId('edit-session-dialog')).toBeInTheDocument()
    expect(screen.getByText('Edit session')).toBeInTheDocument()
    // Should NOT have navigated
    expect(navigate).not.toHaveBeenCalled()
  })

  it('pre-fills strength set values from the existing session', async () => {
    const session = makeStrengthSession(
      STRENGTH_COMMITMENT.id,
      'act-bench',
      daysAgo(0),
      75,
      10,
    )
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions: [session] })
    const user = userEvent.setup()
    render(<StoreWrapper><HistoryScreen navigate={vi.fn()} /></StoreWrapper>)

    await user.click(screen.getByTestId(`history-entry-${session.id}`))
    await user.click(screen.getByTestId(`edit-session-${session.id}`))

    // The first set should be pre-filled with weight=75, reps=10
    const weightInput = screen.getByTestId('edit-set-weight-0') as HTMLInputElement
    const repsInput = screen.getByTestId('edit-set-reps-0') as HTMLInputElement
    expect(weightInput.value).toBe('75')
    expect(repsInput.value).toBe('10')
  })

  it('saves edited session when Save changes is clicked', async () => {
    const session = makeStrengthSession(
      STRENGTH_COMMITMENT.id,
      'act-bench',
      daysAgo(0),
      60,
      8,
    )
    seedStore({ commitments: [STRENGTH_COMMITMENT], sessions: [session] })
    const user = userEvent.setup()
    render(<StoreWrapper><HistoryScreen navigate={vi.fn()} /></StoreWrapper>)

    // Expand → Edit
    await user.click(screen.getByTestId(`history-entry-${session.id}`))
    await user.click(screen.getByTestId(`edit-session-${session.id}`))

    // Change the weight on set 0
    const weightInput = screen.getByTestId('edit-set-weight-0')
    await user.clear(weightInput)
    await user.type(weightInput, '80')

    // Save
    await user.click(screen.getByTestId('edit-session-save'))

    // Dialog should close
    expect(screen.queryByTestId('edit-session-dialog')).not.toBeInTheDocument()

    // The summary in the list should now reflect 80 kg
    expect(screen.getByText(/80 kg/)).toBeInTheDocument()
  })

  it('opens edit dialog for a metric session and pre-fills values', async () => {
    const session = makeRunningSession(
      RUNNING_COMMITMENT.id,
      'act-run',
      daysAgo(0),
      5.2,
      31,
    )
    seedStore({ commitments: [RUNNING_COMMITMENT], sessions: [session] })
    const user = userEvent.setup()
    render(<StoreWrapper><HistoryScreen navigate={vi.fn()} /></StoreWrapper>)

    await user.click(screen.getByTestId(`history-entry-${session.id}`))
    await user.click(screen.getByTestId(`edit-session-${session.id}`))

    expect(screen.getByTestId('edit-session-dialog')).toBeInTheDocument()
    const distanceInput = screen.getByTestId('edit-metric-distance') as HTMLInputElement
    const durationInput = screen.getByTestId('edit-metric-duration') as HTMLInputElement
    expect(distanceInput.value).toBe('5.2')
    expect(durationInput.value).toBe('31')
  })

  it('opens edit dialog for an AVOID session and pre-fills stayedOnTrack', async () => {
    const session = makeAvoidSession(
      AVOID_COMMITMENT.id,
      'act-no-fast-food',
      daysAgo(0),
      true,
    )
    seedStore({ commitments: [AVOID_COMMITMENT], sessions: [session] })
    const user = userEvent.setup()
    render(<StoreWrapper><HistoryScreen navigate={vi.fn()} /></StoreWrapper>)

    await user.click(screen.getByTestId(`history-entry-${session.id}`))
    await user.click(screen.getByTestId(`edit-session-${session.id}`))

    expect(screen.getByTestId('edit-session-dialog')).toBeInTheDocument()
    // The "Yes" button should be pressed
    expect(screen.getByTestId('edit-avoid-yes')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('edit-avoid-no')).toHaveAttribute('aria-pressed', 'false')
  })
})
