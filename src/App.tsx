import { useCallback, useState } from 'react'
import { LayoutGrid, Clock, TrendingUp, CalendarCheck } from 'lucide-react'

import type { Screen } from './screens/types'
import { ONBOARDING_SCREENS, NAV_TABS } from './screens/types'
import type {
  ChallengeDuration,
  DayOfWeek,
  Direction,
  Frequency,
  MeasurementConfig,
} from './domain/types'
import { useAppStore } from './store/useAppStore'
import { findTemplate } from './domain/templates'

// ── Onboarding screens ────────────────────────────────────────────────────────
import { WelcomeScreen } from './screens/onboarding/WelcomeScreen'
import { ChooseDirectionScreen } from './screens/onboarding/ChooseDirectionScreen'
import { ChooseTemplateScreen } from './screens/onboarding/ChooseTemplateScreen'
import { ConfigureActivityScreen } from './screens/onboarding/ConfigureActivityScreen'
import { SetFrequencyScreen } from './screens/onboarding/SetFrequencyScreen'
import { OptionalScheduleScreen } from './screens/onboarding/OptionalScheduleScreen'
import { OptionalChallengeScreen } from './screens/onboarding/OptionalChallengeScreen'
import { PlanReviewScreen } from './screens/onboarding/PlanReviewScreen'

// ── Main app screens ──────────────────────────────────────────────────────────
import { DashboardScreen } from './screens/DashboardScreen'
import { ActiveSessionScreen } from './screens/ActiveSessionScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { WeeklyReviewScreen } from './screens/WeeklyReviewScreen'
import { EditRoutineScreen } from './screens/EditRoutineScreen'

// ── Navigation icons ──────────────────────────────────────────────────────────

const NAV_ICONS = {
  dashboard: LayoutGrid,
  history: Clock,
  progress: TrendingUp,
  'weekly-review': CalendarCheck,
} as const

// ── Onboarding draft ──────────────────────────────────────────────────────────

/**
 * All state accumulated while the user walks through the onboarding flow.
 * Passed to PlanReviewScreen to assemble the final Routine.
 */
export interface OnboardingDraft {
  direction: Direction | null
  /** The id of the selected ActivityTemplate, or 'custom'. */
  templateId: string | null
  /** Activity name as typed on the configure screen. */
  activityName: string
  /** Measurement values as configured on the configure screen. */
  measurements: MeasurementConfig[]
  frequency: Frequency
  /** Optional preferred days (ISO day-of-week). */
  scheduledDays: DayOfWeek[]
  /** Optional preferred time label. */
  preferredTime: string
  /** null = no challenge. */
  challengeDurationDays: ChallengeDuration | null
}

const EMPTY_DRAFT: OnboardingDraft = {
  direction: null,
  templateId: null,
  activityName: '',
  measurements: [],
  frequency: '3x_week',
  scheduledDays: [],
  preferredTime: '',
  challengeDurationDays: null,
}

// ── Navigate type ─────────────────────────────────────────────────────────────

export type Navigate = (screen: Screen) => void

// ── Screen renderer ───────────────────────────────────────────────────────────

interface ScreenProps {
  navigate: Navigate
  draft: OnboardingDraft
  setDraft: (patch: Partial<OnboardingDraft>) => void
  onStartRoutine: () => void
}

function renderScreen(
  screen: Screen,
  { navigate, draft, setDraft, onStartRoutine }: ScreenProps,
) {
  switch (screen) {
    case 'welcome':
      return (
        <WelcomeScreen
          navigate={navigate}
          onDirectionChoose={(d) => setDraft({ direction: d })}
        />
      )
    case 'choose-direction':
      return (
        <ChooseDirectionScreen
          navigate={navigate}
          direction={draft.direction}
          onDirectionChange={(d) => setDraft({ direction: d })}
          onTemplateSelect={(id) => setDraft({ templateId: id })}
        />
      )
    case 'choose-template':
      return <ChooseTemplateScreen navigate={navigate} direction={draft.direction} />
    case 'configure-activity':
      return (
        <ConfigureActivityScreen
          navigate={navigate}
          templateId={draft.templateId}
          direction={draft.direction}
          onActivityChange={(name, measurements) =>
            setDraft({ activityName: name, measurements })
          }
        />
      )
    case 'set-frequency':
      return (
        <SetFrequencyScreen
          navigate={navigate}
          frequency={draft.frequency}
          onFrequencyChange={(f) => setDraft({ frequency: f })}
        />
      )
    case 'optional-schedule':
      return (
        <OptionalScheduleScreen
          navigate={navigate}
          scheduledDays={draft.scheduledDays}
          preferredTime={draft.preferredTime}
          onScheduleChange={(days, time) =>
            setDraft({ scheduledDays: days, preferredTime: time })
          }
        />
      )
    case 'optional-challenge':
      return (
        <OptionalChallengeScreen
          navigate={navigate}
          templateId={draft.templateId}
          challengeDurationDays={draft.challengeDurationDays}
          onChallengeChange={(days) => setDraft({ challengeDurationDays: days })}
        />
      )
    case 'plan-review':
      return (
        <PlanReviewScreen
          navigate={navigate}
          draft={draft}
          onStart={onStartRoutine}
        />
      )
    case 'dashboard':
      return <DashboardScreen />
    case 'active-session':
      return <ActiveSessionScreen />
    case 'history':
      return <HistoryScreen />
    case 'progress':
      return <ProgressScreen />
    case 'weekly-review':
      return <WeeklyReviewScreen />
    case 'edit-routine':
      return <EditRoutineScreen />
  }
}

// ── Bottom navigation ─────────────────────────────────────────────────────────

interface BottomNavProps {
  current: Screen
  onNavigate: Navigate
}

function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pb-safe">
        {NAV_TABS.map(({ screen, label }) => {
          const Icon = NAV_ICONS[screen as keyof typeof NAV_ICONS]
          const isActive = current === screen
          return (
            <button
              key={screen}
              type="button"
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(screen)}
              className={[
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              <Icon size={22} strokeWidth={isActive ? 2 : 1.5} aria-hidden="true" />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ── App shell ─────────────────────────────────────────────────────────────────

interface AppProps {
  /** Override the starting screen. Used in tests only. */
  initialScreen?: Screen
}

export default function App({ initialScreen = 'welcome' }: AppProps) {
  const [screen, setScreen] = useState<Screen>(initialScreen)
  const [draft, setDraftState] = useState<OnboardingDraft>(EMPTY_DRAFT)
  const { addRoutine } = useAppStore()

  const navigate = useCallback((next: Screen) => {
    setScreen(next)
  }, [])

  const setDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraftState((prev) => ({ ...prev, ...patch }))
  }, [])

  const onStartRoutine = useCallback(() => {
    const template = draft.templateId ? findTemplate(draft.templateId) : null
    const activityName =
      draft.activityName || template?.defaultName || 'My activity'
    const direction = draft.direction ?? template?.direction ?? 'DO'
    const measurements =
      draft.measurements.length > 0
        ? draft.measurements
        : template?.defaultMeasurements ?? []

    addRoutine({
      id: crypto.randomUUID(),
      name: activityName,
      createdAt: new Date().toISOString(),
      challengeDurationDays: draft.challengeDurationDays ?? undefined,
      challengeStartDate: draft.challengeDurationDays
        ? new Date().toISOString().slice(0, 10)
        : undefined,
      activities: [
        {
          id: crypto.randomUUID(),
          name: activityName,
          direction,
          measurements,
          frequency: draft.frequency,
          scheduledDays:
            draft.scheduledDays.length > 0 ? draft.scheduledDays : undefined,
          preferredTime: draft.preferredTime || undefined,
        },
      ],
    })

    setDraftState(EMPTY_DRAFT)
    navigate('dashboard')
  }, [draft, addRoutine, navigate])

  const isOnboarding = ONBOARDING_SCREENS.includes(screen)

  return (
    <div
      data-testid="app-shell"
      className="relative mx-auto flex min-h-svh max-w-md flex-col bg-background"
    >
      <main
        className={[
          'flex flex-1 flex-col',
          isOnboarding ? '' : 'pb-20',
        ].join(' ')}
      >
        {renderScreen(screen, { navigate, draft, setDraft, onStartRoutine })}
      </main>

      {!isOnboarding && (
        <BottomNav current={screen} onNavigate={navigate} />
      )}
    </div>
  )
}
