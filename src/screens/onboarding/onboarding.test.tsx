/**
 * Tests for onboarding screens 1 and 2.
 *
 * Screen 1 — WelcomeScreen:
 * - Renders the correct heading and supporting text
 * - Shows two direction choices: "Do something" and "Stop doing something"
 * - Clicking "Do something" calls onDirectionChoose('DO') and navigates to choose-direction
 * - Clicking "Stop doing something" calls onDirectionChoose('AVOID') and navigates to choose-direction
 *
 * Screen 2 — ChooseDirectionScreen:
 * - Renders the correct heading for DO direction
 * - Renders the correct heading for AVOID direction
 * - Displays DO templates when direction is DO
 * - Displays AVOID templates when direction is AVOID
 * - "Something else" (custom) card is always present for both directions
 * - Clicking a template card navigates to configure-activity
 * - Back button navigates to welcome
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { WelcomeScreen } from './WelcomeScreen'
import { ChooseDirectionScreen } from './ChooseDirectionScreen'
import {
  doTemplates,
  avoidTemplates,
  breakingHabitsTemplates,
  exerciseTemplates,
} from '../../domain/templates'

// ─── WelcomeScreen ────────────────────────────────────────────────────────────

describe('WelcomeScreen', () => {
  function setup() {
    const navigate = vi.fn()
    const onDirectionChoose = vi.fn()
    render(<WelcomeScreen navigate={navigate} onDirectionChoose={onDirectionChoose} />)
    return { navigate, onDirectionChoose }
  }

  it('renders the correct heading', () => {
    setup()
    expect(screen.getByRole('heading', { name: /what do you want to work on/i })).toBeInTheDocument()
  })

  it('renders supporting text', () => {
    setup()
    expect(screen.getByText(/more consistently/i)).toBeInTheDocument()
  })

  it('renders both direction buttons', () => {
    setup()
    expect(screen.getByTestId('direction-do')).toBeInTheDocument()
    expect(screen.getByTestId('direction-avoid')).toBeInTheDocument()
  })

  it('DO button calls onDirectionChoose with DO', async () => {
    const user = userEvent.setup()
    const { onDirectionChoose } = setup()
    await user.click(screen.getByTestId('direction-do'))
    expect(onDirectionChoose).toHaveBeenCalledWith('DO')
  })

  it('AVOID button calls onDirectionChoose with AVOID', async () => {
    const user = userEvent.setup()
    const { onDirectionChoose } = setup()
    await user.click(screen.getByTestId('direction-avoid'))
    expect(onDirectionChoose).toHaveBeenCalledWith('AVOID')
  })

  it('DO button navigates to choose-direction', async () => {
    const user = userEvent.setup()
    const { navigate } = setup()
    await user.click(screen.getByTestId('direction-do'))
    expect(navigate).toHaveBeenCalledWith('choose-direction')
  })

  it('AVOID button navigates to choose-direction', async () => {
    const user = userEvent.setup()
    const { navigate } = setup()
    await user.click(screen.getByTestId('direction-avoid'))
    expect(navigate).toHaveBeenCalledWith('choose-direction')
  })

  it('works without onDirectionChoose (optional prop)', async () => {
    const user = userEvent.setup()
    const navigate = vi.fn()
    render(<WelcomeScreen navigate={navigate} />)
    // Should not throw
    await user.click(screen.getByTestId('direction-do'))
    expect(navigate).toHaveBeenCalledWith('choose-direction')
  })
})

// ─── ChooseDirectionScreen ────────────────────────────────────────────────────

describe('ChooseDirectionScreen', () => {
  function setupDO() {
    const navigate = vi.fn()
    const onDirectionChange = vi.fn()
    render(
      <ChooseDirectionScreen
        navigate={navigate}
        direction="DO"
        onDirectionChange={onDirectionChange}
      />,
    )
    return { navigate, onDirectionChange }
  }

  function setupAVOID() {
    const navigate = vi.fn()
    const onDirectionChange = vi.fn()
    render(
      <ChooseDirectionScreen
        navigate={navigate}
        direction="AVOID"
        onDirectionChange={onDirectionChange}
      />,
    )
    return { navigate, onDirectionChange }
  }

  // Headings
  it('shows "What do you want to do?" for DO direction', () => {
    setupDO()
    expect(screen.getByRole('heading', { name: /what do you want to do/i })).toBeInTheDocument()
  })

  it('shows "What do you want to avoid?" for AVOID direction', () => {
    setupAVOID()
    expect(screen.getByRole('heading', { name: /what do you want to avoid/i })).toBeInTheDocument()
  })

  // DO templates visible
  it('shows DO templates when direction is DO', () => {
    setupDO()
    // At least one exercise template should be present
    const exerciseTemplate = exerciseTemplates[0]!
    expect(screen.getByTestId(`template-card-${exerciseTemplate.id}`)).toBeInTheDocument()
  })

  it('does not show AVOID-only templates when direction is DO', () => {
    setupDO()
    const avoidOnlyTemplate = breakingHabitsTemplates[0]!
    // AVOID templates should not appear in DO mode
    expect(screen.queryByTestId(`template-card-${avoidOnlyTemplate.id}`)).toBeNull()
  })

  // AVOID templates visible
  it('shows AVOID templates when direction is AVOID', () => {
    setupAVOID()
    const avoidTemplate = breakingHabitsTemplates[0]!
    expect(screen.getByTestId(`template-card-${avoidTemplate.id}`)).toBeInTheDocument()
  })

  it('does not show DO-only templates when direction is AVOID', () => {
    setupAVOID()
    const doOnlyTemplate = exerciseTemplates[0]!
    expect(screen.queryByTestId(`template-card-${doOnlyTemplate.id}`)).toBeNull()
  })

  // Custom sentinel always present
  it('always shows the "Something else" card for DO', () => {
    setupDO()
    expect(screen.getByTestId('template-card-custom')).toBeInTheDocument()
  })

  it('always shows the "Something else" card for AVOID', () => {
    setupAVOID()
    expect(screen.getByTestId('template-card-custom')).toBeInTheDocument()
  })

  // Card count
  it('shows the correct number of cards for DO (all DO templates + custom)', () => {
    setupDO()
    const cards = screen.getAllByTestId(/^template-card-/)
    expect(cards).toHaveLength(doTemplates.length)
  })

  it('shows the correct number of cards for AVOID (all AVOID templates + custom)', () => {
    setupAVOID()
    const cards = screen.getAllByTestId(/^template-card-/)
    expect(cards).toHaveLength(avoidTemplates.length)
  })

  // Navigation
  it('clicking a template card navigates to configure-activity', async () => {
    const user = userEvent.setup()
    const { navigate } = setupDO()
    const firstCard = screen.getAllByTestId(/^template-card-/)[0]!
    await user.click(firstCard)
    expect(navigate).toHaveBeenCalledWith('configure-activity')
  })

  it('back button navigates to welcome', async () => {
    const user = userEvent.setup()
    const { navigate } = setupDO()
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(navigate).toHaveBeenCalledWith('welcome')
  })

  // Null direction fallback
  it('falls back to DO templates when direction is null', () => {
    const navigate = vi.fn()
    render(
      <ChooseDirectionScreen
        navigate={navigate}
        direction={null}
        onDirectionChange={vi.fn()}
      />,
    )
    // Should render the DO heading and DO templates without crashing
    expect(screen.getByRole('heading', { name: /what do you want to do/i })).toBeInTheDocument()
    expect(screen.getByTestId('template-card-custom')).toBeInTheDocument()
  })
})
