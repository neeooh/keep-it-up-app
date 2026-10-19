import { useCallback, useState } from 'react'
import { LayoutGrid, Clock, TrendingUp, ClipboardList } from 'lucide-react'

import type { Screen } from './screens/types'
import { ONBOARDING_SCREENS, NAV_TABS } from './screens/types'
import type {
  ChallengeDuration,
  DayOfWeek,
  Direction,
  Frequency,
  MeasurementConfig,
} from './domain/types'
import { useAppStore, AppStoreProvider } from './store/useAppStore'
import { ThemeProvider } from './hooks/useTheme'
import { PreferencesProvider, usePreferences } from './hooks/usePreferences'
import { findTemplate, needsConfigureScreen, personaPresets } from './domain/templates'

// ── Onboarding screens ────────────────────────────────────────────────────────
import { WelcomeScreen } from './screens/onboarding/WelcomeScreen'
import { ChooseDirectionScreen } from './screens/onboarding/ChooseDirectionScreen'
import { ConfigureActivityScreen } from './screens/onboarding/ConfigureActivityScreen'
import { SetFrequencyScreen } from './screens/onboarding/SetFrequencyScreen'
import { PlanReviewScreen } from './screens/onboarding/PlanReviewScreen'
import { PathPreviewScreen } from './screens/onboarding/PathPreviewScreen'

// ── Main app screens ──────────────────────────────────────────────────────────
import { DashboardScreen } from './screens/DashboardScreen'
import { ActiveSessionScreen } from './screens/ActiveSessionScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { WeeklyReviewScreen } from './screens/WeeklyReviewScreen'
import { EditRoutineScreen } from './screens/EditRoutineScreen'
import { PlanScreen } from './screens/PlanScreen'
import { SettingsScreen } from './screens/SettingsScreen'

// ── Navigation icons ──────────────────────────────────────────────────────────

const NAV_ICONS = {
  dashboard: LayoutGrid,
  plan: ClipboardList,
  history: Clock,
  progress: TrendingUp,
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
  /** For strength workouts: individual exercises with name, sets, reps, weight. */
  exercises: { name: string; sets: number; reps: number; weight: number }[]
  frequency: Frequency
  /** Optional preferred days (ISO day-of-week). */
  scheduledDays: DayOfWeek[]
  /** Optional preferred time label. */
  preferredTime: string
  /** null = no challenge. */
  challengeDurationDays: ChallengeDuration | null
  /** True when the configure-activity screen was skipped (simple templates). */
  skippedConfigure: boolean
  /** Free-text motivation: why the user wants to do this routine. */
  motivation: string
}

const EMPTY_DRAFT: OnboardingDraft = {
  direction: null,
  templateId: null,
  activityName: '',
  measurements: [],
  exercises: [],
  frequency: '3x_week',
  scheduledDays: [],
  preferredTime: '',
  challengeDurationDays: null,
  skippedConfigure: false,
  motivation: '',
}

// ── Navigate type ─────────────────────────────────────────────────────────────

export type Navigate = (screen: Screen) => void

// ── Screen renderer ───────────────────────────────────────────────────────────

interface ScreenProps {
  navigate: Navigate
  draft: OnboardingDraft
  setDraft: (patch: Partial<OnboardingDraft>) => void
  onStartRoutine: () => void
  selectedRoutineId: string | null
  onStartSession: (routineId: string, date?: string) => void
  onEditRoutine: (routineId: string) => void
  /** When set, onboarding screens show a close (X) button that returns to dashboard. */
  onClose?: () => void
  /** Install a persona preset routine by id. */
  onInstallPreset: (presetId: string) => void
  /** Confirm the previewed path — install and navigate to dashboard. */
  onConfirmPath: (presetId: string) => void
  /** The currently previewed preset id. */
  selectedPresetId: string | null
  sessionDate?: string
}

function renderScreen(
  screen: Screen,
  {
    navigate,
    draft,
    setDraft,
    onStartRoutine,
    selectedRoutineId,
    onStartSession,
    onEditRoutine,
    onClose,
    onInstallPreset,
    onConfirmPath,
    selectedPresetId,
    sessionDate,
  }: ScreenProps,
) {
  switch (screen) {
    case 'welcome':
      return (
        <WelcomeScreen
          navigate={navigate}
          onDirectionChoose={(d) => setDraft({ direction: d })}
          onInstallPreset={onInstallPreset}
          onClose={onClose}
        />
      )
    case 'choose-direction':
      return (
        <ChooseDirectionScreen
          navigate={navigate}
          direction={draft.direction}
          onDirectionChange={(d) => setDraft({ direction: d })}
          onTemplateSelect={(id) => {
            const tmpl = id ? findTemplate(id) : null
            const skip = tmpl ? !needsConfigureScreen(tmpl) : false
            setDraft({
              templateId: id,
              frequency: tmpl?.defaultFrequency ?? EMPTY_DRAFT.frequency,
              activityName: skip ? (tmpl?.defaultName ?? '') : EMPTY_DRAFT.activityName,
              measurements: skip ? (tmpl?.defaultMeasurements ?? []) : EMPTY_DRAFT.measurements,
              preferredTime: tmpl?.defaultPreferredTime ?? EMPTY_DRAFT.preferredTime,
              skippedConfigure: skip,
            })
          }}
          onInstallPreset={onInstallPreset}
          onClose={onClose}
        />
      )
    case 'configure-activity':
      return (
        <ConfigureActivityScreen
          navigate={navigate}
          templateId={draft.templateId}
          direction={draft.direction}
          onActivityChange={(name, measurements) =>
            setDraft({ activityName: name, measurements })
          }
          onExercisesChange={(exercises) => setDraft({ exercises })}
          initialExercises={draft.exercises}
          onClose={onClose}
        />
      )
    case 'set-frequency':
      return (
        <SetFrequencyScreen
          navigate={navigate}
          frequency={draft.frequency}
          onFrequencyChange={(f) => {
            const defaultDays: Record<string, DayOfWeek[]> = {
              daily: [1, 2, 3, 4, 5, 6, 7],
              '3x_week': [1, 3, 5],
              '2x_week': [2, 4],
              '1x_week': [6],
              flexible: [],
            }
            setDraft({ frequency: f, scheduledDays: defaultDays[f] ?? [] })
          }}
          skippedConfigure={draft.skippedConfigure}
          onClose={onClose}
        />
      )
    case 'plan-review':
      return (
        <PlanReviewScreen
          navigate={navigate}
          draft={draft}
          onStart={onStartRoutine}
          skippedConfigure={draft.skippedConfigure}
          scheduledDays={draft.scheduledDays}
          preferredTime={draft.preferredTime}
          challengeDurationDays={draft.challengeDurationDays}
          onScheduleChange={(days, time) =>
            setDraft({ scheduledDays: days, preferredTime: time })
          }
          onChallengeChange={(days) => setDraft({ challengeDurationDays: days })}
          motivation={draft.motivation}
          onMotivationChange={(m) => setDraft({ motivation: m })}
          onNameChange={(name) => setDraft({ activityName: name })}
          onMeasurementChange={(index, target) => {
            // If measurements are empty (skipped configure), copy from template first.
            const template = draft.templateId ? findTemplate(draft.templateId) : null
            const base = draft.measurements.length > 0
              ? draft.measurements
              : template?.defaultMeasurements ?? []
            const updated = [...base]
            if (updated[index]) {
              updated[index] = { ...updated[index], target }
              setDraft({ measurements: updated })
            }
          }}
          onClose={onClose}
        />
      )
    case 'path-preview':
      return (
        <PathPreviewScreen
          navigate={navigate}
          presetId={selectedPresetId}
          onConfirm={onConfirmPath}
          onBack={previousScreen ? () => navigate(previousScreen) : undefined}
        />
      )
    case 'dashboard':
      return (
        <DashboardScreen
          navigate={navigate}
          onStartSession={onStartSession}
          onViewPath={(presetId: string) => {
            onInstallPreset(presetId)
          }}
          onEditRoutine={onEditRoutine}
        />
      )
    case 'plan':
      return (
        <PlanScreen
          navigate={navigate}
          onEditRoutine={onEditRoutine}
          onViewPath={(presetId: string) => {
            onInstallPreset(presetId)
          }}
        />
      )
    case 'active-session':
      return (
        <ActiveSessionScreen
          navigate={navigate}
          routineId={selectedRoutineId}
          sessionDate={sessionDate}
        />
      )
    case 'history':
      return <HistoryScreen navigate={navigate} />
    case 'progress':
      return <ProgressScreen navigate={navigate} onEditRoutine={onEditRoutine} />
    case 'weekly-review':
      return (
        <WeeklyReviewScreen
          navigate={navigate}
          onEditRoutine={onEditRoutine}
        />
      )
    case 'edit-routine':
      return (
        <EditRoutineScreen
          navigate={navigate}
          routineId={selectedRoutineId}
        />
      )
    case 'settings':
      return <SettingsScreen navigate={navigate} onViewPath={(presetId: string) => {
        onInstallPreset(presetId)
      }} />
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
  const { addRoutine, state: appState } = useAppStore()
  const { preferences, updatePreferences } = usePreferences()

  // Route to dashboard when routines already exist, unless explicitly overridden.
  const resolvedInitial =
    initialScreen ?? (appState.routines.length > 0 ? 'dashboard' : 'welcome')

  const [screen, setScreen] = useState<Screen>(resolvedInitial)
  const [draft, setDraftState] = useState<OnboardingDraft>(EMPTY_DRAFT)
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [sessionDate, setSessionDate] = useState<string | undefined>(undefined)
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null)

  const navigate = useCallback((next: Screen) => {
    setScreen((prev) => {
      setPreviousScreen(prev)
      return next
    })
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

    // For strength workouts with exercises, create one Activity per exercise.
    // Otherwise create a single Activity.
    const activities =
      draft.exercises.length > 0
        ? draft.exercises.map((ex) => ({
            id: crypto.randomUUID(),
            name: ex.name,
            direction,
            measurements: [
              { type: 'sets' as const, target: ex.sets },
              { type: 'reps' as const, target: ex.reps },
              { type: 'weight' as const, unit: 'kg' as const },
            ],
            frequency: draft.frequency,
            scheduledDays:
              draft.scheduledDays.length > 0 ? draft.scheduledDays : undefined,
            preferredTime: draft.preferredTime || undefined,
          }))
        : [
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
          ]

    addRoutine({
      id: crypto.randomUUID(),
      name: activityName,
      createdAt: new Date().toISOString(),
      challengeDurationDays: draft.challengeDurationDays ?? undefined,
      challengeStartDate: draft.challengeDurationDays
        ? new Date().toISOString().slice(0, 10)
        : undefined,
      motivation: draft.motivation.trim() || undefined,
      activities,
    })

    setDraftState(EMPTY_DRAFT)
    navigate('dashboard')
  }, [draft, addRoutine, navigate])

  const onStartSession = useCallback(
    (routineId: string, date?: string) => {
      setSelectedRoutineId(routineId)
      setSessionDate(date)
      navigate('active-session')
    },
    [navigate],
  )

  const onEditRoutine = useCallback(
    (routineId: string) => {
      setSelectedRoutineId(routineId)
      navigate('edit-routine')
    },
    [navigate],
  )

  const isOnboarding = ONBOARDING_SCREENS.includes(screen)
  const hideBottomNav = isOnboarding || screen === 'active-session' || screen === 'settings'

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
          {renderScreen(screen, {
            navigate,
            draft,
            setDraft,
            onStartRoutine,
            selectedRoutineId,
            onStartSession,
            onEditRoutine,
            onClose: appState.routines.length > 0 ? () => navigate('dashboard') : undefined,
            onInstallPreset: (presetId: string) => {
              setSelectedPresetId(presetId)
              navigate('path-preview')
            },
            onConfirmPath: (presetId: string) => {
              const preset = personaPresets.find((p) => p.id === presetId)
              if (!preset) return
              const existingNames = new Set(
                appState.routines.flatMap((r) =>
                  r.activities.map((a) => a.name.toLowerCase()),
                ),
              )
              for (const routine of preset.buildRoutines()) {
                const activityName = routine.activities[0]?.name.toLowerCase() ?? ''
                if (existingNames.has(activityName)) continue
                existingNames.add(activityName)
                addRoutine(routine)
              }
              updatePreferences({ chosenPath: presetId })
              navigate('dashboard')
            },
            selectedPresetId,
            sessionDate,
          })}
        </main>

        {!hideBottomNav && (
          <BottomNav current={screen} onNavigate={navigate} />
        )}
      </div>
    </div>
  )
}
