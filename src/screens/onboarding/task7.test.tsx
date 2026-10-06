/**
 * Tests for Task 7 onboarding screens:
 * - SetFrequencyScreen
 * - OptionalScheduleScreen
 * - OptionalChallengeScreen
 * - PlanReviewScreen + "Start today" integration
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SetFrequencyScreen } from './SetFrequencyScreen'
import { OptionalScheduleScreen } from './OptionalScheduleScreen'
import { OptionalChallengeScreen } from './OptionalChallengeScreen'
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

// ─── OptionalScheduleScreen ───────────────────────────────────────────────────

describe('OptionalScheduleScreen', () => {
  function setup(scheduledDays: number[] = [], preferredTime = '') {
    const navigate = vi.fn()
    const onScheduleChange = vi.fn()
    render(
      <OptionalScheduleScreen
        navigate={navigate}
        scheduledDays={scheduledDays as never}
        preferredTime={preferredTime}
        onScheduleChange={onScheduleChange}
      />,
    )
    return { navigate, onScheduleChange }
  }

  it('renders all 7 day options', () => {
    setup()
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByTestId(`day-option-${i}`)).toBeInTheDocument()
    }
  })

  it('renders time-of-day options', () => {
    setup()
    expect(screen.getByTestId('time-option-morning')).toBeInTheDocument()
    expect(screen.getByTestId('time-option-evening')).toBeInTheDocument()
  })

  it('selected days are marked aria-pressed=true', () => {
    setup([1, 3])
    expect(screen.getByTestId('day-option-1')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('day-option-3')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('day-option-2')).toHaveAttribute('aria-pressed', 'false')
  })

  it('clicking a day calls onScheduleChange with the day added', async () => {
    const user = userEvent.setup()
    const { onScheduleChange } = setup([1])
    await user.click(screen.getByTestId('day-option-3'))
    expect(onScheduleChange).toHaveBeenCalledWith([1, 3], '')
  })

  it('clicking a selected day calls onScheduleChange with the day removed', async () => {
    const user = userEvent.setup()
    const { onScheduleChange } = setup([1, 3])
    await user.click(screen.getByTestId('day-option-1'))
    expect(onScheduleChange).toHaveBeenCalledWith([3], '')
  })

  it('clicking a time option calls onScheduleChange with that time', async () => {
    const user = userEvent.setup()
    const { onScheduleChange } = setup()
    await user.click(screen.getByTestId('time-option-morning'))
    expect(onScheduleChange).toHaveBeenCalledWith([], 'Morning')
  })

  it('clicking a selected time deselects it', async () => {
    const user = userEvent.setup()
    const { onScheduleChange } = setup([], 'Morning')
    await user.click(screen.getByTestId('time-option-morning'))
    expect(onScheduleChange).toHaveBeenCalledWith([], '')
  })

  it('Continue navigates to optional-challenge', async () => {
    const user = userEvent.setup()
    const { navigate } = setup()
    await user.click(screen.getByTestId('continue-button'))
    expect(navigate).toHaveBeenCalledWith('optional-challenge')
  })

  it('Skip clears schedule and navigates to optional-challenge', async () => {
    const user = userEvent.setup()
    const { navigate, onScheduleChange } = setup([1, 2], 'Morning')
    await user.click(screen.getByTestId('skip-button'))
    expect(onScheduleChange).toHaveBeenCalledWith([], '')
    expect(navigate).toHaveBeenCalledWith('optional-challenge')
  })

  it('Back navigates to set-frequency', async () => {
    const user = userEvent.setup()
    const { navigate } = setup()
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(navigate).toHaveBeenCalledWith('set-frequency')
  })
})

// ─── OptionalChallengeScreen ──────────────────────────────────────────────────

describe('OptionalChallengeScreen', () => {
  function setup(
    challengeDurationDays: 30 | 60 | 90 | null = null,
    templateId: string | null = null,
  ) {
    const navigate = vi.fn()
    const onChallengeChange = vi.fn()
    render(
      <OptionalChallengeScreen
        navigate={navigate}
        templateId={templateId}
        challengeDurationDays={challengeDurationDays}
        onChallengeChange={onChallengeChange}
      />,
    )
    return { navigate, onChallengeChange }
  }

  it('renders all three challenge options', () => {
    setup()
    expect(screen.getByTestId('challenge-option-30')).toBeInTheDocument()
    expect(screen.getByTestId('challenge-option-60')).toBeInTheDocument()
    expect(screen.getByTestId('challenge-option-90')).toBeInTheDocument()
  })

  it('selected option is marked aria-checked=true', () => {
    setup(30)
    expect(screen.getByTestId('challenge-option-30')).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByTestId('challenge-option-60')).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('clicking an option calls onChallengeChange with that value', async () => {
    const user = userEvent.setup()
    const { onChallengeChange } = setup()
    await user.click(screen.getByTestId('challenge-option-30'))
    expect(onChallengeChange).toHaveBeenCalledWith(30)
  })

  it('clicking a selected option deselects it (calls with null)', async () => {
    const user = userEvent.setup()
    const { onChallengeChange } = setup(30)
    await user.click(screen.getByTestId('challenge-option-30'))
    expect(onChallengeChange).toHaveBeenCalledWith(null)
  })

  it('Continue navigates to plan-review', async () => {
    const user = userEvent.setup()
    const { navigate } = setup()
    await user.click(screen.getByTestId('continue-button'))
    expect(navigate).toHaveBeenCalledWith('plan-review')
  })

  it('Skip (no end date) sets null and navigates to plan-review', async () => {
    const user = userEvent.setup()
    const { navigate, onChallengeChange } = setup(30)
    await user.click(screen.getByTestId('skip-button'))
    expect(onChallengeChange).toHaveBeenCalledWith(null)
    expect(navigate).toHaveBeenCalledWith('plan-review')
  })

  it('Back navigates to optional-schedule', async () => {
    const user = userEvent.setup()
    const { navigate } = setup()
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(navigate).toHaveBeenCalledWith('optional-schedule')
  })

  it('shows suggested hint when template has a suggestedChallengeDays', () => {
    setup(null, 'no-smoking') // no-smoking has suggestedChallengeDays: 30
    expect(screen.getByText(/30-day challenge is popular/i)).toBeInTheDocument()
  })

  it('does not show suggested hint for templates without one', () => {
    setup(null, 'running')
    expect(screen.queryByText(/popular/i)).toBeNull()
  })
})

// ─── PlanReviewScreen ─────────────────────────────────────────────────────────

describe('PlanReviewScreen', () => {
  function setup(draftOverrides: Partial<OnboardingDraft> = {}) {
    const navigate = vi.fn()
    const onStart = vi.fn()
    const draft: OnboardingDraft = { ...BASE_DRAFT, ...draftOverrides }
    render(<StoreWrapper><PlanReviewScreen navigate={navigate} draft={draft} onStart={onStart} /></StoreWrapper>)
    return { navigate, onStart }
  }

  it('renders the plan review screen', () => {
    setup()
    expect(screen.getByTestId('screen-plan-review')).toBeInTheDocument()
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

  it('shows scheduled days when present', () => {
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

  it('shows challenge when set', () => {
    setup({ challengeDurationDays: 30 })
    expect(screen.getByTestId('plan-challenge')).toHaveTextContent('30-day challenge')
  })

  it('does not show challenge when null', () => {
    setup({ challengeDurationDays: null })
    expect(screen.queryByTestId('plan-challenge')).toBeNull()
  })

  it('"Start today" calls onStart', async () => {
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
    // Should render without crashing and show core fields
    expect(screen.getByTestId('plan-activity-name')).toBeInTheDocument()
    expect(screen.getByTestId('plan-frequency')).toBeInTheDocument()
    expect(screen.queryByTestId('plan-scheduled-days')).toBeNull()
    expect(screen.queryByTestId('plan-challenge')).toBeNull()
  })
})
