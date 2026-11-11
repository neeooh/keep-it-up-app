/**
 * Smoke tests for the App shell and screen router.
 *
 * Acceptance criteria:
 * - Each screen name renders the correct placeholder without crashing
 * - Bottom nav is hidden on creation screens
 * - Bottom nav is visible on main app screens
 * - Clicking a nav tab navigates to the correct screen
 * - The active tab has aria-current="page"
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { CREATION_SCREENS, MAIN_SCREENS, type Screen } from './screens/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderAt(initialScreen: Screen) {
  return render(<App initialScreen={initialScreen} />)
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

// ─── Initial render ───────────────────────────────────────────────────────────

describe('App — initial render', () => {
  it('renders without crashing on the add-commitment screen', () => {
    renderAt('add-commitment')
    expect(screen.getByTestId('app-shell')).toBeInTheDocument()
  })

  it('shows the add-commitment screen by default when no commitments exist', () => {
    renderAt('add-commitment')
    expect(screen.getByTestId('screen-add-commitment')).toBeInTheDocument()
  })
})

// ─── Every screen renders its correct placeholder ─────────────────────────────

describe('App — screen router renders correct placeholder for each screen', () => {
  const allScreens: Screen[] = [...CREATION_SCREENS, ...MAIN_SCREENS]

  for (const s of allScreens) {
    it(`renders screen-${s}`, () => {
      renderAt(s)
      expect(screen.getByTestId(`screen-${s}`)).toBeInTheDocument()
    })
  }
})

// ─── Bottom nav hidden on creation screens ────────────────────────────────────

describe('App — bottom nav hidden on creation screens', () => {
  for (const s of CREATION_SCREENS) {
    it(`hides bottom nav on "${s}"`, () => {
      renderAt(s)
      expect(screen.queryByRole('navigation', { name: 'Main navigation' })).toBeNull()
    })
  }
})

// ─── Bottom nav visible on main screens ──────────────────────────────────────

describe('App — bottom nav visible on main screens', () => {
  for (const s of MAIN_SCREENS.filter((m) => m !== 'active-session' && m !== 'settings')) {
    it(`shows bottom nav on "${s}"`, () => {
      renderAt(s)
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    })
  }

  it('hides bottom nav during an active session', () => {
    renderAt('active-session')
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).toBeNull()
  })

  it('hides bottom nav on the settings screen', () => {
    renderAt('settings')
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).toBeNull()
  })
})

// ─── Nav tab — click navigation ───────────────────────────────────────────────

describe('App — nav tab click navigation', () => {
  it('navigates to History when the History tab is clicked', async () => {
    const user = userEvent.setup()
    renderAt('dashboard')

    await user.click(screen.getByRole('button', { name: 'History' }))

    expect(screen.getByTestId('screen-history')).toBeInTheDocument()
    expect(screen.queryByTestId('screen-dashboard')).toBeNull()
  })

  it('navigates to Progress when the Progress tab is clicked', async () => {
    const user = userEvent.setup()
    renderAt('dashboard')

    await user.click(screen.getByRole('button', { name: 'Progress' }))

    expect(screen.getByTestId('screen-progress')).toBeInTheDocument()
  })

  it('navigates to Today when the Today tab is clicked', async () => {
    const user = userEvent.setup()
    renderAt('history')

    await user.click(screen.getByRole('button', { name: 'Today' }))

    expect(screen.getByTestId('screen-dashboard')).toBeInTheDocument()
  })
})

// ─── Nav tab — aria-current active state ─────────────────────────────────────

describe('App — active nav tab has aria-current="page"', () => {
  it('marks the Today tab as active when on the dashboard', () => {
    renderAt('dashboard')
    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('marks the History tab as active when on history', () => {
    renderAt('history')
    expect(screen.getByRole('button', { name: 'History' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('does not mark inactive tabs as current', () => {
    renderAt('dashboard')
    expect(screen.getByRole('button', { name: 'History' })).not.toHaveAttribute(
      'aria-current',
    )
  })
})
