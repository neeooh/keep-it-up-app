import { useCallback, useState } from 'react'
import { LayoutGrid, Clock, TrendingUp, ClipboardList } from 'lucide-react'

import type { Screen } from './screens/types'
import { CREATION_SCREENS, NAV_TABS } from './screens/types'
import { useAppStore, AppStoreProvider } from './store/useAppStore'
import { ThemeProvider } from './hooks/useTheme'
import { PreferencesProvider, usePreferences } from './hooks/usePreferences'
import { paths } from './domain/templates'

// ── Screens ───────────────────────────────────────────────────────────────────
import { AddCommitmentScreen } from './screens/AddCommitmentScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { ActiveSessionScreen } from './screens/ActiveSessionScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { WeeklyReviewScreen } from './screens/WeeklyReviewScreen'
import { EditCommitmentScreen } from './screens/EditCommitmentScreen'
import { PlanScreen } from './screens/PlanScreen'
import { SettingsScreen } from './screens/SettingsScreen'

// ── Navigation icons ──────────────────────────────────────────────────────────

const NAV_ICONS = {
  dashboard: LayoutGrid,
  plan: ClipboardList,
  history: Clock,
  progress: TrendingUp,
} as const

// ── Navigate type ─────────────────────────────────────────────────────────────

export type Navigate = (screen: Screen) => void

// ── Bottom navigation ─────────────────────────────────────────────────────────

interface BottomNavProps {
  current: Screen
  onNavigate: Navigate
}

function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl border-t border-border bg-background"
    >
      <div className="flex items-center justify-around px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
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
                'flex flex-1 flex-col items-center gap-1 min-h-[48px] justify-center py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-brand'
                  : 'text-muted-foreground hover:text-brand',
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

export default function App({ initialScreen }: AppProps) {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <AppStoreProvider>
          <AppShell initialScreen={initialScreen} />
        </AppStoreProvider>
      </PreferencesProvider>
    </ThemeProvider>
  )
}

function AppShell({ initialScreen }: AppProps) {
  const { addCommitment, state: appState } = useAppStore()
  const { updatePreferences } = usePreferences()

  // Route to dashboard when commitments exist, unless explicitly overridden.
  const resolvedInitial =
    initialScreen ?? (appState.commitments.length > 0 ? 'dashboard' : 'add-commitment')

  const [screen, setScreen] = useState<Screen>(resolvedInitial)
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<string | null>(null)
  const [sessionDate, setSessionDate] = useState<string | undefined>(undefined)

  const navigate = useCallback((next: Screen) => {
    setScreen(next)
  }, [])

  const onStartSession = useCallback(
    (commitmentId: string, date?: string) => {
      setSelectedCommitmentId(commitmentId)
      setSessionDate(date)
      navigate('active-session')
    },
    [navigate],
  )

  const onEditCommitment = useCallback(
    (commitmentId: string) => {
      setSelectedCommitmentId(commitmentId)
      navigate('edit-commitment')
    },
    [navigate],
  )

  const onInstallPath = useCallback(
    (presetId: string) => {
      const preset = paths.find((p) => p.id === presetId)
      if (!preset) return
      const existingNames = new Set(
        appState.commitments.flatMap((c) =>
          c.activities.map((a) => a.name.toLowerCase()),
        ),
      )
      for (const commitment of preset.buildCommitments()) {
        const activityName = commitment.activities[0]?.name.toLowerCase() ?? ''
        if (existingNames.has(activityName)) continue
        existingNames.add(activityName)
        addCommitment(commitment)
      }
      updatePreferences({ chosenPath: presetId })
      navigate('dashboard')
    },
    [appState.commitments, addCommitment, updatePreferences, navigate],
  )

  const isCreation = CREATION_SCREENS.includes(screen)
  const hideBottomNav = isCreation || screen === 'active-session' || screen === 'settings'
  const canClose = appState.commitments.length > 0

  // ── Screen renderer ─────────────────────────────────────────────────────
  function renderScreen() {
    switch (screen) {
      case 'add-commitment':
        return (
          <AddCommitmentScreen
            navigate={navigate}
            onClose={canClose ? () => navigate('dashboard') : undefined}
          />
        )
      case 'dashboard':
        return (
          <DashboardScreen
            navigate={navigate}
            onStartSession={onStartSession}
            onViewPath={onInstallPath}
          />
        )
      case 'plan':
        return (
          <PlanScreen
            navigate={navigate}
            onEditCommitment={onEditCommitment}
            onViewPath={onInstallPath}
          />
        )
      case 'active-session':
        return (
          <ActiveSessionScreen
            navigate={navigate}
            commitmentId={selectedCommitmentId}
            sessionDate={sessionDate}
          />
        )
      case 'history':
        return <HistoryScreen navigate={navigate} />
      case 'progress':
        return <ProgressScreen navigate={navigate} onEditCommitment={onEditCommitment} />
      case 'weekly-review':
        return (
          <WeeklyReviewScreen
            navigate={navigate}
            onEditCommitment={onEditCommitment}
          />
        )
      case 'edit-commitment':
        return (
          <EditCommitmentScreen
            navigate={navigate}
            commitmentId={selectedCommitmentId}
          />
        )
      case 'settings':
        return <SettingsScreen navigate={navigate} onViewPath={onInstallPath} />
    }
  }

  return (
    <div className="min-h-svh bg-surface-muted">
      <div
        data-testid="app-shell"
        className="relative mx-auto flex min-h-svh max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl flex-col bg-background"
      >
        <main
          className={[
            'flex flex-1 flex-col',
            hideBottomNav ? '' : 'pb-20',
          ].join(' ')}
        >
          {renderScreen()}
        </main>

        {!hideBottomNav && (
          <BottomNav current={screen} onNavigate={navigate} />
        )}
      </div>
    </div>
  )
}
