/**
 * Tests for Task 7 onboarding screens:
 * - SetFrequencyScreen
 * - PlanReviewScreen (now includes collapsible schedule + challenge sections)
 *
 * The standalone optional-schedule and optional-challenge screens were
 * removed in Task 6 — their behaviour now lives inside PlanReviewScreen.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SetFrequencyScreen } from './SetFrequencyScreen'
import { PlanReviewScreen } from './PlanReviewScreen'
import type { OnboardingDraft } from '../../App'
import type { Frequency } from '../../domain/types'
import { StoreWrapper, clearStore } from '../__tests__/fixtures'

// ─── Shared draft fixture ─────────────────────────────────────────────────────

const BASE_DRAFT: OnboardingDraft = {
  direction: 'DO',
  templateId: 'running',
  activityName: 'Running',
  measurements: [
    { type: 'distance', unit: 'km', target: 5 },
    { type: 'duration', unit: 'min', target: 30 },
  ],
  frequency: '3x_week',
  scheduledDays: [],
  preferredTime: '',
  challengeDurationDays: null,
  skippedConfigure: false,
}

afterEach(() => {
  vi.clearAllMocks()
  clearStore()
})

// ─── SetFrequencyScreen ───────────────────────────────────────────────────────

describe('SetFrequencyScreen', () => {
  function setup(frequency: Frequency = '3x_week') {
    const navigate = vi.fn()
    const onFrequencyChange = vi.fn()
    render(
      <SetFrequencyScreen
        navigate={navigate}
        frequency={frequency}
        onFrequencyChange={onFrequencyChange}
      />,
    )
    return { navigate, onFrequencyChange }
  }

  it('renders all 5 frequency options', () => {
    setup()
    expect(screen.getByTestId('frequency-option-daily')).toBeInTheDocument()
    expect(screen.getByTestId('frequency-option-3x_week')).toBeInTheDocument()
    expect(screen.getByTestId('frequency-option-2x_week')).toBeInTheDocument()
    expect(screen.getByTestId('frequency-option-1x_week')).toBeInTheDocument()
    expect(screen.getByTestId('frequency-option-flexible')).toBeInTheDocument()
  })

  it('marks the current frequency as selected', () => {
    setup('3x_week')
    expect(screen.getByTestId('frequency-option-3x_week')).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('other options are not marked as selected', () => {
    setup('3x_week')
    expect(screen.getByTestId('frequency-option-daily')).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('clicking an option calls onFrequencyChange with that value', async () => {
    const user = userEvent.setup()
    const { onFrequencyChange } = setup('3x_week')
    await user.click(screen.getByTestId('frequency-option-daily'))
    expect(onFrequencyChange).toHaveBeenCalledWith('daily')
  })

  it('shows the reassurance copy', () => {
    setup()
    expect(screen.getByText(/consistency beats ambition/i)).toBeInTheDocument()
  })

  it('Continue navigates to plan-review', async () => {
    const user = userEvent.setup()
    const { navigate } = setup()
    await user.click(screen.getByTestId('continue-button'))
    expect(navigate).toHaveBeenCalledWith('plan-review')
  })

  it('Back navigates to configure-activity', async () => {
    const user = userEvent.setup()
    const { navigate } = setup()
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(navigate).toHaveBeenCalledWith('configure-activity')
  })
})

// ─── PlanReviewScreen ─────────────────────────────────────────────────────────

describe('PlanReviewScreen', () => {
  function setup(draftOverrides: Partial<OnboardingDraft> = {}) {
    const navigate = vi.fn()
    const onStart = vi.fn()
    const onScheduleChange = vi.fn()
    const onChallengeChange = vi.fn()
    const draft: OnboardingDraft = { ...BASE_DRAFT, ...draftOverrides }
    render(
      <StoreWrapper>
        <PlanReviewScreen
          navigate={navigate}
          draft={draft}
          onStart={onStart}
          scheduledDays={draft.scheduledDays}
          preferredTime={draft.preferredTime}
          challengeDurationDays={draft.challengeDurationDays}
          onScheduleChange={onScheduleChange}
          onChallengeChange={onChallengeChange}
        />
      </StoreWrapper>,
    )
    return { navigate, onStart, onScheduleChange, onChallengeChange }
  }

  it('renders the plan review screen', () => {
    setup()
    expect(screen.getByTestId('screen-plan-review')).toBeInTheDocument()
  })

  it('shows the "Here\'s your plan" heading', () => {
    setup()
    expect(screen.getByRole('heading', { name: /here's your plan/i })).toBeInTheDocument()
  })

  it('shows the activity name', () => {
    setup()
    expect(screen.getByTestId('plan-activity-name')).toHaveTextContent('Running')
  })

  it('shows the frequency', () => {
    setup()
    expect(screen.getByTestId('plan-frequency')).toHaveTextContent('3× per week')
  })

  it('shows the measurements', () => {
    setup()
    expect(screen.getByTestId('plan-measurement-distance')).toBeInTheDocument()
    expect(screen.getByTestId('plan-measurement-duration')).toBeInTheDocument()
  })

  it('shows scheduled days summary when present', () => {
    setup({ scheduledDays: [1, 3, 5] })
    expect(screen.getByTestId('plan-scheduled-days')).toHaveTextContent('Mon · Wed · Fri')
  })

  it('does not show scheduled days section when empty', () => {
    setup({ scheduledDays: [] })
    expect(screen.queryByTestId('plan-scheduled-days')).toBeNull()
  })

  it('shows preferred time when present', () => {
    setup({ preferredTime: 'Morning' })
    expect(screen.getByTestId('plan-preferred-time')).toHaveTextContent('Morning')
  })

  it('does not show preferred time when empty', () => {
    setup({ preferredTime: '' })
    expect(screen.queryByTestId('plan-preferred-time')).toBeNull()
  })

  it('shows challenge summary when set', () => {
    setup({ challengeDurationDays: 30 })
    expect(screen.getByTestId('plan-challenge')).toHaveTextContent('30-day challenge')
  })

  it('does not show challenge summary when null', () => {
    setup({ challengeDurationDays: null })
    expect(screen.queryByTestId('plan-challenge')).toBeNull()
  })

  // ── Collapsible schedule section ──────────────────────────────────────────

  it('schedule section is collapsed by default', () => {
    setup()
    expect(screen.queryByTestId('schedule-content')).toBeNull()
  })

  it('expanding the schedule section reveals day and time options', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByTestId('toggle-schedule'))
    expect(screen.getByTestId('schedule-content')).toBeInTheDocument()
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByTestId(`day-option-${i}`)).toBeInTheDocument()
    }
    expect(screen.getByTestId('time-option-morning')).toBeInTheDocument()
    expect(screen.getByTestId('time-option-anytime')).toBeInTheDocument()
  })

  it('clicking a day calls onScheduleChange with the day added', async () => {
    const user = userEvent.setup()
    const { onScheduleChange } = setup({ scheduledDays: [1] })
    await user.click(screen.getByTestId('toggle-schedule'))
    await user.click(screen.getByTestId('day-option-3'))
    expect(onScheduleChange).toHaveBeenCalledWith([1, 3], '')
  })

  it('clicking a time option calls onScheduleChange with that time', async () => {
    const user = userEvent.setup()
    const { onScheduleChange } = setup()
    await user.click(screen.getByTestId('toggle-schedule'))
    await user.click(screen.getByTestId('time-option-morning'))
    expect(onScheduleChange).toHaveBeenCalledWith([], 'Morning')
  })

  // ── Collapsible challenge section ─────────────────────────────────────────

  it('challenge section is collapsed by default', () => {
    setup()
    expect(screen.queryByTestId('challenge-content')).toBeNull()
  })

  it('expanding the challenge section reveals 30/60/90 options', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByTestId('toggle-challenge'))
    expect(screen.getByTestId('challenge-option-30')).toBeInTheDocument()
    expect(screen.getByTestId('challenge-option-60')).toBeInTheDocument()
    expect(screen.getByTestId('challenge-option-90')).toBeInTheDocument()
  })

  it('clicking a challenge option calls onChallengeChange with that value', async () => {
    const user = userEvent.setup()
    const { onChallengeChange } = setup()
    await user.click(screen.getByTestId('toggle-challenge'))
    await user.click(screen.getByTestId('challenge-option-30'))
    expect(onChallengeChange).toHaveBeenCalledWith(30)
  })

  it('clicking a selected challenge option deselects it (calls with null)', async () => {
    const user = userEvent.setup()
    const { onChallengeChange } = setup({ challengeDurationDays: 30 })
    await user.click(screen.getByTestId('toggle-challenge'))
    await user.click(screen.getByTestId('challenge-option-30'))
    expect(onChallengeChange).toHaveBeenCalledWith(null)
  })

  // ── Actions ───────────────────────────────────────────────────────────────

  it('"Create my plan" calls onStart', async () => {
    const user = userEvent.setup()
    const { onStart } = setup()
    await user.click(screen.getByTestId('start-button'))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('"Edit plan" navigates back to configure-activity', async () => {
    const user = userEvent.setup()
    const { navigate } = setup()
    await user.click(screen.getByTestId('edit-button'))
    expect(navigate).toHaveBeenCalledWith('configure-activity')
  })

  it('Back navigates to set-frequency', async () => {
    const user = userEvent.setup()
    const { navigate } = setup()
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(navigate).toHaveBeenCalledWith('set-frequency')
  })

  it('uses template defaults when activityName is empty', () => {
    setup({ activityName: '', templateId: 'running' })
    expect(screen.getByTestId('plan-activity-name')).toHaveTextContent('Running')
  })

  it('skipping optional steps still produces a valid plan summary', () => {
    setup({
      scheduledDays: [],
      preferredTime: '',
      challengeDurationDays: null,
    })
    expect(screen.getByTestId('plan-activity-name')).toBeInTheDocument()
    expect(screen.getByTestId('plan-frequency')).toBeInTheDocument()
    expect(screen.queryByTestId('plan-scheduled-days')).toBeNull()
    expect(screen.queryByTestId('plan-challenge')).toBeNull()
  })
})
