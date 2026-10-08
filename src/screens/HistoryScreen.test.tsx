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
  STRENGTH_ROUTINE,
  makeStrengthSession,
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
    seedStore({ routines: [STRENGTH_ROUTINE], sessions: [] })
    render(<StoreWrapper><HistoryScreen navigate={vi.fn()} /></StoreWrapper>)
    expect(screen.getByTestId('history-empty')).toBeInTheDocument()
    expect(screen.getByText(/your history starts here/i)).toBeInTheDocument()
  })
})

describe('HistoryScreen — with sessions', () => {
  function setup() {
    const session1 = makeStrengthSession(
      STRENGTH_ROUTINE.id,
      'act-bench',
      daysAgo(5),
      60,
      8,
    )
    const session2 = makeStrengthSession(
      STRENGTH_ROUTINE.id,
      'act-bench',
      daysAgo(2),
      65,
      8,
    )
    const session3 = makeStrengthSession(
      STRENGTH_ROUTINE.id,
      'act-bench',
      daysAgo(0),
      70,
      8,
    )
    const sessions = [session1, session2, session3]
    seedStore({ routines: [STRENGTH_ROUTINE], sessions })
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

  it('expands inline detail when clicking a session', async () => {
    const { sessions } = setup()
    const user = userEvent.setup()
    await user.click(screen.getByTestId(`history-entry-${sessions[0]!.id}`))
    expect(screen.getByTestId(`history-detail-${sessions[0]!.id}`)).toBeInTheDocument()
  })

  it('shows activity results in the inline detail', async () => {
    const { sessions } = setup()
    const user = userEvent.setup()
    await user.click(screen.getByTestId(`history-entry-${sessions[0]!.id}`))
    expect(
      screen.getByTestId(`detail-result-act-bench`),
    ).toBeInTheDocument()
  })

  it('collapses detail when clicking the same session again', async () => {
    const { sessions } = setup()
    const user = userEvent.setup()
    await user.click(screen.getByTestId(`history-entry-${sessions[0]!.id}`))
    expect(screen.getByTestId(`history-detail-${sessions[0]!.id}`)).toBeInTheDocument()
    await user.click(screen.getByTestId(`history-entry-${sessions[0]!.id}`))
    expect(screen.queryByTestId(`history-detail-${sessions[0]!.id}`)).not.toBeInTheDocument()
  })
})
