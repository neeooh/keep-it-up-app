/**
 * Smoke tests for the App shell and screen router.
 *
 * Acceptance criteria:
 * - Each screen name renders the correct placeholder without crashing
 * - Bottom nav is hidden on all 8 onboarding screens
 * - Bottom nav is visible on main app screens
 * - Clicking a nav tab navigates to the correct screen
 * - The active tab has aria-current="page"
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { ONBOARDING_SCREENS, MAIN_SCREENS, type Screen } from './screens/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderAt(initialScreen: Screen) {
  return render(<App initialScreen={initialScreen} />)
}

// ─── Initial render ───────────────────────────────────────────────────────────

describe('App — initial render', () => {
  it('renders without crashing on the welcome screen', () => {
    renderAt('welcome')
    expect(screen.getByTestId('app-shell')).toBeInTheDocument()
  })

  it('shows the welcome screen placeholder by default', () => {
    renderAt('welcome')
    expect(screen.getByTestId('screen-welcome')).toBeInTheDocument()
  })
})

// ─── Every screen renders its correct placeholder ─────────────────────────────

describe('App — screen router renders correct placeholder for each screen', () => {
  const allScreens: Screen[] = [...ONBOARDING_SCREENS, ...MAIN_SCREENS]

  for (const s of allScreens) {
    it(`renders screen-${s}`, () => {
      renderAt(s)
      expect(screen.getByTestId(`screen-${s}`)).toBeInTheDocument()
    })
  }
})

// ─── Bottom nav hidden on onboarding screens ──────────────────────────────────

describe('App — bottom nav hidden on onboarding screens', () => {
  for (const s of ONBOARDING_SCREENS) {
    it(`hides bottom nav on "${s}"`, () => {
      renderAt(s)
      expect(screen.queryByRole('navigation', { name: 'Main navigation' })).toBeNull()
    })
  }
})

// ─── Bottom nav visible on main screens ──────────────────────────────────────

describe('App — bottom nav visible on main screens', () => {
  // Not every main screen is a nav tab destination, but the nav should
  // be present on all of them.
  for (const s of MAIN_SCREENS) {
    it(`shows bottom nav on "${s}"`, () => {
      renderAt(s)
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    })
  }
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

  it('navigates to Review when the Review tab is clicked', async () => {
    const user = userEvent.setup()
    renderAt('dashboard')

    await user.click(screen.getByRole('button', { name: 'Review' }))

    expect(screen.getByTestId('screen-weekly-review')).toBeInTheDocument()
  })

  it('navigates to Home when the Home tab is clicked', async () => {
    const user = userEvent.setup()
    renderAt('history')

    await user.click(screen.getByRole('button', { name: 'Home' }))

    expect(screen.getByTestId('screen-dashboard')).toBeInTheDocument()
  })
})

// ─── Nav tab — aria-current active state ─────────────────────────────────────

describe('App — active nav tab has aria-current="page"', () => {
  it('marks the Home tab as active when on the dashboard', () => {
    renderAt('dashboard')
    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute(
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
