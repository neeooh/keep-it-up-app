
  Implementation Plan — Keep It Up (Personal Routine Consistency Tracker)
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Requirements
  
  Derived directly from mvp_product_spec.md:
  
  Functional
  
  1. Users create routines containing one or more activities.
  2. Activities have a direction (DO or AVOID), composable measurement types (Duration, Distance, Quantity, Sets, Reps, Weight), a frequency target, and an optional schedule.
  3. Predefined activity templates with sensible defaults; always a "create your own" option.
  4. Optional 30/60/90-day challenges per routine.
  5. Onboarding uses a one-question-at-a-time flow, not a large form.
  6. Users record sessions against routines, capturing activity results.
  7. Dashboard shows overall consistency %, this-week progress, and the next relevant routine.
  8. History screen shows past sessions chronologically.
  9. Progress screen shows trends: consistency %, performance deltas, volume, duration.
  10. Weekly review shows consistency vs. plan, progress highlights, and adjustment options (keep / reduce frequency / change schedule / edit routine).
  11. All calculations are pure deterministic functions testable independently of the UI.
  12. All data persisted locally in localStorage.
  
  Non-functional
  
  - TypeScript strict mode throughout.
  - Component-first, mobile-first, responsive UI.
  - shadcn/ui as the component foundation; Lucide React for icons.
  - No authentication, no backend, no AI, no social features.
  - Tests required for all domain calculation logic.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Technical Design
  
  Data model (TypeScript types)
  
  MeasurementType: 'duration' | 'distance' | 'quantity' | 'sets' | 'reps' | 'weight'
  Direction: 'DO' | 'AVOID'
  Frequency: 'daily' | '3x_week' | '2x_week' | '1x_week' | 'flexible'
  MeasurementConfig: { type: MeasurementType; unit?: string; target?: number }
  
  Activity {
    id, name, direction, measurements: MeasurementConfig[],
    frequency, scheduledDays?: DayOfWeek[], preferredTime?: string
  }
  
  Routine {
    id, name, activities: Activity[],
    createdAt, challengeDurationDays?: 30 | 60 | 90,
    challengeStartDate?: string
  }
  
  SetResult { weight?: number; reps?: number }
  
  ActivityResult {
    activityId,
    measurements: Record<MeasurementType, number | undefined>,
    sets?: SetResult[],
    stayedOnTrack?: boolean   // AVOID activities only
  }
  
  Session {
    id, routineId, completedAt: string,
    results: ActivityResult[]
  }
  
  AppState { routines: Routine[]; sessions: Session[] }
  
  Folder structure
  
  src/
    domain/           ← pure TypeScript: types, calculations, templates
      types.ts
      calculations.ts
      templates.ts
    store/            ← localStorage persistence hook (useAppStore)
    components/
      ui/             ← shadcn/ui (already present)
      onboarding/     ← creation flow screens
      session/        ← active session recording
      dashboard/      ← Dashboard screen
      history/        ← History screen
      progress/       ← Progress screen
      review/         ← Weekly Review screen
      routine/        ← Routine detail / edit
      shared/         ← reusable app-level components
    App.tsx           ← screen router (simple state machine, no router library)
  
  Navigation model
  
  A simple screen state machine in App.tsx — no router library needed for the MVP:
  
  'welcome'
    → 'choose-direction'
    → 'choose-template'
    → 'configure-activity'
    → 'set-frequency'
    → 'optional-schedule'
    → 'optional-challenge'
    → 'plan-review'
    → 'dashboard'           (home screen once a routine exists)
    → 'active-session'
    → 'history'
    → 'progress'
    → 'weekly-review'
    → 'edit-routine'
  
  Calculation functions (pure, in domain/calculations.ts)
  
  - calculateConsistency(sessions, routine, dateRange) → 0–100%
  - calculateCompletionRate(sessions, routine, week) → completed / planned
  - calculateWeeklySummary(sessions, routines, weekStart)
  - calculateProgress(sessions, activityId) → first vs latest value
  - calculateVolume(session, activityId) → total kg lifted
  - calculateTrend(sessions, activityId, metric) → array for charting
  - calculateStreak(sessions, routine) → current consecutive completions
  - calculateChallengeProgress(routine, sessions) → days completed / total
  - calculatePersonalBest(sessions, activityId, metric) → max value
  
  Persistence
  
  A single useAppStore hook wraps a AppState value in localStorage. All components read/write through this hook. No external state management library needed.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Implementation Tasks
  
  Task 1: Domain types and pure calculation functions
  
  - Objective: Define all TypeScript types and implement every calculation function listed above. No UI.
  - Guidance: Create src/domain/types.ts and src/domain/calculations.ts. Keep functions pure — they accept plain data and return plain values.
  - Tests: Write unit tests covering all invariants from spec section 18 (consistency 0–100%, volume = sum of sets, incomplete sessions don't count, challenge progress never exceeds duration, etc.).
  - Demo: All tests pass; functions can be called from a browser console with sample data and return correct results.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Task 2: Activity templates library
  
  - Objective: Define the predefined template catalogue (section 5 & 6 of spec) as typed data in src/domain/templates.ts.
  - Guidance: Each template provides a partial Activity with defaults matching the spec. Include all listed templates across Exercise, Personal Development, Daily Life, and Breaking Habits categories, plus a "Create your own" sentinel. Templates are pure data, not components.
  - Tests: Test that each template produces a valid Activity shape when applied and that defaults match spec values (e.g. Running → distance 5 km, 2× per week).
  - Demo: Import templates and log them; all expected templates present with correct defaults.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Task 3: Local persistence store
  
  - Objective: Implement useAppStore — a React hook that reads/writes AppState to localStorage.
  - Guidance: On mount, parse from localStorage; on every write, serialise back. Expose typed actions: addRoutine, updateRoutine, deleteRoutine, addSession. Handle missing/corrupt storage gracefully (fall back to empty state). No external state library.
  - Tests: Test the serialisation round-trip, the fallback behaviour for corrupt data, and that each action produces the correct next state.
  - Demo: Open browser DevTools → Application → localStorage and confirm state persists across page reloads.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Task 4: App shell and screen router
  
  - Objective: Replace the Vite placeholder App.tsx with a clean app shell and a screen state machine.
  - Guidance: Implement a useNavigate / currentScreen pattern in App.tsx. Define all screen names as a discriminated union. Render a placeholder component per screen. Include a persistent bottom navigation bar with icons for Dashboard, History, Progress, and Review (hidden during onboarding). Use shadcn/ui primitives and Tailwind
  for layout.
  - Tests: Smoke test that each screen name renders the correct placeholder without crashing.
  - Demo: Navigate between all placeholder screens using the bottom nav; the correct screen name appears on each.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Task 5: Onboarding — Welcome and direction selection (screens 1–2)
  
  - Objective: Build the first two onboarding screens: the welcome/intent screen and the direction picker.
  - Guidance: Screen 1 shows the product heading and two choices — "Do something" / "Stop doing something". Screen 2 shows the appropriate template cards for the chosen direction. Cards use shadcn Card components. Always include a "Something else / Create your own" card. Wire to the screen router.
  - Tests: Test that selecting DO shows the DO templates and AVOID shows the AVOID templates. Test that "Something else" is always present.
  - Demo: Open the app, see the welcome screen, choose a direction, and see the correct template cards.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Task 6: Onboarding — Activity configuration (screen 3)
  
  - Objective: Build the activity configuration screen that adapts its measurement fields to the selected template.
  - Guidance: When a template is selected, pre-fill the form with template defaults. Show only the measurement fields relevant to that activity (e.g. distance + duration for running, sets + reps + weight for strength). For strength-type activities, allow adding multiple exercises with sets/reps. For AVOID, show minimal
  configuration. For "Create your own", show the full field set.
  - Tests: Test that selecting Running only renders distance and duration fields. Test that strength renders sets/reps/weight. Test that custom shows all fields.
  - Demo: Select Running → see distance + duration pre-filled. Select Strength → see multi-exercise builder. Select "Create your own" → see all fields.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Task 7: Onboarding — Frequency, schedule, challenge, and plan review (screens 4–7)
  
  - Objective: Complete the onboarding flow through to the plan review and routine creation.
  - Guidance: Screen 4 — frequency picker (5 options). Screen 5 — optional day/time preferences (skip button prominent). Screen 6 — optional challenge (30/60/90 days or no end date, with skip). Screen 7 — plan review summary card matching spec section 12. "Start today" calls addRoutine on the store and navigates to the dashboard.
  - Tests: Test that skipping optional screens still produces a valid routine. Test that "Start today" persists the routine and navigates to the dashboard. Test that addRoutine is called with the fully assembled data.
  - Demo: Complete the full onboarding flow from welcome to dashboard; the new routine appears in the store.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Task 8: Dashboard screen
  
  - Objective: Build the dashboard as specified in section 13.
  - Guidance: Show overall consistency % (calculated via calculateConsistency), this-week summary table, a "Continue" card showing the next routine with its last session's highlights, and a progress section showing deltas. All data comes from the store + domain calculations. Handle the empty state (no routines yet → prompt to create
  one).
  - Tests: Test consistency display with mock sessions. Test empty state renders the create-routine prompt. Test that the "Start session" button navigates to the active session screen with the correct routine.
  - Demo: With one routine and a few sessions, the dashboard shows real consistency %, this-week completions, and the last activity result.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Task 9: Active session recording
  
  - Objective: Build the session recording screen for all activity types.
  - Guidance: Render the session UI from spec section 14, adapting to the routine's activity types. For strength, show set-by-set entry with pre-filled values from the last session. For metric activities (running, reading), show simple measurement inputs. For AVOID, show the "Did you stay on track?" binary. "Finish session" /
  "Complete" calls addSession on the store with all results and navigates back to the dashboard.
  - Tests: Test that an incomplete session (not all activities filled) is not saved. Test that AVOID sessions record stayedOnTrack. Test that addSession receives correctly structured ActivityResult[].
  - Demo: Start a session from the dashboard, fill in results, tap Complete, return to dashboard, and see the updated consistency.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Task 10: History screen
  
  - Objective: Build the session history list from spec section 15.
  - Guidance: Show sessions in reverse chronological order. Each entry shows date, routine name, activity count, and the top metric (e.g. heaviest weight, distance). Tapping a session shows its full results in a detail view (use shadcn Sheet or Dialog). Handle empty state.
  - Tests: Test that sessions are ordered newest-first. Test the empty state. Test that session detail shows all activity results.
  - Demo: After a few sessions, the history screen shows them in order with correct dates and metrics.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Task 11: Progress screen
  
  - Objective: Build the progress screen from spec section 16.
  - Guidance: Show consistency % over last 4 weeks, performance deltas per activity (first vs latest value), volume totals for weight-based activities, duration totals for time-based activities. Use simple bar or line charts rendered with inline SVG or a minimal canvas — no chart library unless already a dependency. Handle the case
  where fewer than two sessions exist (not enough data message).
  - Tests: Test calculateProgress and calculateVolume return correct values for sample data. Test the "not enough data" state renders without crashing.
  - Demo: After multiple sessions, the progress screen shows real deltas (e.g. Bench Press 60 kg → 70 kg, +17%).
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Task 12: Weekly review screen
  
  - Objective: Build the weekly review screen from spec section 17.
  - Guidance: Show consistency vs. planned sessions for the current week (e.g. 4/5, 80%), progress highlights, momentum stat (e.g. 15 of last 18 completed), and a deterministic reflection line based on the data (e.g. if multiple missed sessions, suggest reducing frequency). Show the four adjustment options: Keep / Reduce frequency /
  Change schedule / Edit routine. "Reduce frequency" and "Change schedule" update the routine via updateRoutine. "Edit routine" navigates to the edit screen.
  - Tests: Test calculateWeeklySummary with sample data. Test that "Reduce frequency" steps down correctly (e.g. 3x → 2x). Test that suggestions only appear when data supports them.
  - Demo: With a week of partial completions, the review shows the correct stats and a relevant suggestion.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Task 13: Routine edit screen
  
  - Objective: Allow users to edit an existing routine's name, activities, frequency, schedule, and challenge.
  - Guidance: Reuse the configuration components from the onboarding flow. Pre-populate with the current routine's values. "Save changes" calls updateRoutine. Include a destructive "Delete routine" action with a confirmation dialog. The edit screen is reached from the weekly review or dashboard.
  - Tests: Test that saving persists updated values. Test that deletion removes the routine and all its sessions. Test that cancelling leaves the store unchanged.
  - Demo: Navigate to edit from the weekly review, change the frequency, save, and confirm the dashboard reflects the new target.
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Task 14: End-to-end wiring and polish
  
  - Objective: Verify the complete product loop works cohesively and apply final UX polish.
  - Guidance: Walk through the full spec success criteria (section 22 — 13 steps). Fix any broken navigation paths, empty state gaps, or missing loading states. Remove the old Vite boilerplate assets (App.css, hero.png, react.svg, vite.svg) and the placeholder screens. Ensure consistent typography, spacing, and colour usage from the
  Tailwind theme across all screens. Confirm the app is usable on a mobile viewport.
  - Tests: Run all existing tests; verify they still pass after wiring changes.
  - Demo: A new user can open the app, create a routine, complete a session, view their consistency, review their week, and adjust their plan — the complete product loop end to end.
  