/**
 * Tests for ConfigureActivityScreen.
 *
 * Acceptance criteria:
 * - Running template → only distance + duration fields visible
 * - Strength template → multi-exercise builder (sets, reps), no distance/duration
 * - Duration-only template (reading) → only duration field
 * - AVOID template → no measurement fields, shows "stayed on track" hint
 * - Custom (null templateId) → all 6 measurement fields shown
 * - Activity name field always present and pre-filled from template defaults
 * - Continue button navigates to set-frequency
 * - Back button navigates to choose-direction
 * - Strength: "Add exercise" adds a new exercise row
 * - Strength: remove button removes a row (disabled when only one row)
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfigureActivityScreen } from './ConfigureActivityScreen'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setup(templateId: string | null, direction: 'DO' | 'AVOID' | null = null) {
  const navigate = vi.fn()
  render(
    <ConfigureActivityScreen
      navigate={navigate}
      templateId={templateId}
      direction={direction}
    />,
  )
  return { navigate }
}

// ─── Always-present elements ──────────────────────────────────────────────────

describe('ConfigureActivityScreen — always present', () => {
  it('renders the screen container', () => {
    setup('running')
    expect(screen.getByTestId('screen-configure-activity')).toBeInTheDocument()
  })

  it('renders the activity name field', () => {
    setup('running')
    expect(screen.getByTestId('field-activity-name')).toBeInTheDocument()
  })

  it('pre-fills the activity name from the template', () => {
    setup('running')
    expect(screen.getByTestId('field-activity-name')).toHaveValue('Running')
  })

  it('renders a Continue button', () => {
    setup('running')
    expect(screen.getByTestId('continue-button')).toBeInTheDocument()
  })

  it('renders a Back button', () => {
    setup('running')
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('Continue navigates to set-frequency', async () => {
    const user = userEvent.setup()
    const { navigate } = setup('running')
    await user.click(screen.getByTestId('continue-button'))
    expect(navigate).toHaveBeenCalledWith('set-frequency')
  })

  it('Back navigates to choose-direction', async () => {
    const user = userEvent.setup()
    const { navigate } = setup('running')
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(navigate).toHaveBeenCalledWith('choose-direction')
  })
})

// ─── Running template ─────────────────────────────────────────────────────────

describe('ConfigureActivityScreen — running template', () => {
  it('renders distance field', () => {
    setup('running')
    expect(screen.getByTestId('field-distance')).toBeInTheDocument()
  })

  it('renders duration field', () => {
    setup('running')
    expect(screen.getByTestId('field-duration')).toBeInTheDocument()
  })

  it('does NOT render sets, reps, weight, or quantity fields', () => {
    setup('running')
    expect(screen.queryByTestId('field-sets')).toBeNull()
    expect(screen.queryByTestId('field-reps')).toBeNull()
    expect(screen.queryByTestId('field-weight')).toBeNull()
    expect(screen.queryByTestId('field-quantity')).toBeNull()
  })

  it('pre-fills distance with template default (5)', () => {
    setup('running')
    expect(screen.getByTestId('field-distance')).toHaveValue(5)
  })

  it('pre-fills duration with template default (30)', () => {
    setup('running')
    expect(screen.getByTestId('field-duration')).toHaveValue(30)
  })

  it('shows the correct heading', () => {
    setup('running')
    expect(screen.getByRole('heading', { name: /measure running/i })).toBeInTheDocument()
  })
})

// ─── Strength template ────────────────────────────────────────────────────────

describe('ConfigureActivityScreen — strength template', () => {
  it('renders the exercise builder', () => {
    setup('strength-workout')
    expect(screen.getByTestId('exercise-row-0')).toBeInTheDocument()
  })

  it('renders sets, reps, and weight inputs on the first row', () => {
    setup('strength-workout')
    expect(screen.getByTestId('exercise-sets-0')).toBeInTheDocument()
    expect(screen.getByTestId('exercise-reps-0')).toBeInTheDocument()
    expect(screen.getByTestId('exercise-weight-0')).toBeInTheDocument()
  })

  it('does NOT render scalar distance or duration fields', () => {
    setup('strength-workout')
    expect(screen.queryByTestId('field-distance')).toBeNull()
    expect(screen.queryByTestId('field-duration')).toBeNull()
  })

  it('shows the correct heading', () => {
    setup('strength-workout')
    expect(screen.getByRole('heading', { name: /what does your workout include/i })).toBeInTheDocument()
  })

  it('"Add exercise" button adds a new exercise row', async () => {
    const user = userEvent.setup()
    setup('strength-workout')
    await user.click(screen.getByTestId('add-exercise'))
    expect(screen.getByTestId('exercise-row-1')).toBeInTheDocument()
  })

  it('remove button is hidden when only one exercise row', () => {
    setup('strength-workout')
    expect(screen.queryByRole('button', { name: /remove exercise 1/i })).toBeNull()
  })

  it('remove button appears when there are multiple exercise rows', async () => {
    const user = userEvent.setup()
    setup('strength-workout')
    await user.click(screen.getByTestId('add-exercise'))
    expect(screen.getByRole('button', { name: /remove exercise 1/i })).toBeInTheDocument()
  })

  it('remove button deletes the correct row', async () => {
    const user = userEvent.setup()
    setup('strength-workout')
    await user.click(screen.getByTestId('add-exercise'))
    // Two rows exist — remove the first
    await user.click(screen.getByRole('button', { name: /remove exercise 1/i }))
    expect(screen.queryByTestId('exercise-row-1')).toBeNull()
    expect(screen.getByTestId('exercise-row-0')).toBeInTheDocument()
  })

  it('weight input accepts decimal values', async () => {
    const user = userEvent.setup()
    setup('strength-workout')
    const weightInput = screen.getByTestId('exercise-weight-0')
    await user.type(weightInput, '62.5')
    expect(weightInput).toHaveValue(62.5)
  })

  it('newly added exercise row also has a weight input', async () => {
    const user = userEvent.setup()
    setup('strength-workout')
    await user.click(screen.getByTestId('add-exercise'))
    expect(screen.getByTestId('exercise-weight-1')).toBeInTheDocument()
  })
})

// ─── Duration-only template (reading) ────────────────────────────────────────

describe('ConfigureActivityScreen — reading template', () => {
  it('renders only the duration field', () => {
    setup('reading')
    expect(screen.getByTestId('field-duration')).toBeInTheDocument()
    expect(screen.queryByTestId('field-distance')).toBeNull()
    expect(screen.queryByTestId('field-sets')).toBeNull()
    expect(screen.queryByTestId('field-reps')).toBeNull()
    expect(screen.queryByTestId('field-weight')).toBeNull()
    expect(screen.queryByTestId('field-quantity')).toBeNull()
  })

  it('pre-fills duration with template default (20)', () => {
    setup('reading')
    expect(screen.getByTestId('field-duration')).toHaveValue(20)
  })
})

// ─── AVOID template ───────────────────────────────────────────────────────────

describe('ConfigureActivityScreen — AVOID direction', () => {
  it('does not render any measurement fields', () => {
    setup('no-smoking', 'AVOID')
    expect(screen.queryByTestId('field-duration')).toBeNull()
    expect(screen.queryByTestId('field-distance')).toBeNull()
    expect(screen.queryByTestId('field-sets')).toBeNull()
    expect(screen.queryByTestId('field-quantity')).toBeNull()
    expect(screen.queryByTestId('add-exercise')).toBeNull()
  })

  it('still shows the activity name field', () => {
    setup('no-smoking', 'AVOID')
    expect(screen.getByTestId('field-activity-name')).toBeInTheDocument()
  })

  it('shows a "stayed on track" hint', () => {
    setup('no-smoking', 'AVOID')
    expect(screen.getByText(/stayed on track/i)).toBeInTheDocument()
  })
})

// ─── Custom template ──────────────────────────────────────────────────────────

describe('ConfigureActivityScreen — custom (no template)', () => {
  it('shows all 6 measurement fields', () => {
    setup(null)
    expect(screen.getByTestId('field-duration')).toBeInTheDocument()
    expect(screen.getByTestId('field-distance')).toBeInTheDocument()
    expect(screen.getByTestId('field-quantity')).toBeInTheDocument()
    expect(screen.getByTestId('field-sets')).toBeInTheDocument()
    expect(screen.getByTestId('field-reps')).toBeInTheDocument()
    expect(screen.getByTestId('field-weight')).toBeInTheDocument()
  })

  it('activity name field starts empty', () => {
    setup(null)
    expect(screen.getByTestId('field-activity-name')).toHaveValue('')
  })

  it('also shows all 6 fields when templateId is "custom"', () => {
    setup('custom')
    expect(screen.getByTestId('field-duration')).toBeInTheDocument()
    expect(screen.getByTestId('field-distance')).toBeInTheDocument()
    expect(screen.getByTestId('field-quantity')).toBeInTheDocument()
    expect(screen.getByTestId('field-sets')).toBeInTheDocument()
    expect(screen.getByTestId('field-reps')).toBeInTheDocument()
    expect(screen.getByTestId('field-weight')).toBeInTheDocument()
  })
})
