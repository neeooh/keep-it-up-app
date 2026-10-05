import { useCallback, useState } from 'react'
import { LayoutGrid, Clock, TrendingUp, CalendarCheck } from 'lucide-react'

import type { Screen } from './screens/types'
import { ONBOARDING_SCREENS, NAV_TABS } from './screens/types'
import type { Direction } from './domain/types'

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

/** Partial state accumulated across onboarding screens. */
export interface OnboardingDraft {
  direction: Direction | null
  templateId: string | null
}

const EMPTY_DRAFT: OnboardingDraft = { direction: null, templateId: null }

// ── Navigate type ─────────────────────────────────────────────────────────────

export type Navigate = (screen: Screen) => void

// ── Screen renderer ───────────────────────────────────────────────────────────

interface ScreenProps {
  navigate: Navigate
  draft: OnboardingDraft
  setDraft: (patch: Partial<OnboardingDraft>) => void
}

function renderScreen(screen: Screen, { navigate, draft, setDraft }: ScreenProps) {
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
        />
      )
    case 'choose-template':
      return <ChooseTemplateScreen navigate={navigate} direction={draft.direction} />
    case 'configure-activity':
      return <ConfigureActivityScreen navigate={navigate} />
    case 'set-frequency':
      return <SetFrequencyScreen navigate={navigate} />
    case 'optional-schedule':
      return <OptionalScheduleScreen navigate={navigate} />
    case 'optional-challenge':
      return <OptionalChallengeScreen navigate={navigate} />
    case 'plan-review':
      return <PlanReviewScreen navigate={navigate} />
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

  const navigate = useCallback((next: Screen) => {
    setScreen(next)
  }, [])

  const setDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraftState((prev) => ({ ...prev, ...patch }))
  }, [])

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
        {renderScreen(screen, { navigate, draft, setDraft })}
      </main>

      {!isOnboarding && (
        <BottomNav current={screen} onNavigate={navigate} />
      )}
    </div>
  )
}
