
  Implementation Plan — Keep It Up: Tasks 8–14 (Dashboard through Final Polish)

  Problem Statement:

  The onboarding flow (tasks 1–7) is complete. A user can create a routine and land on the dashboard. All screens beyond the onboarding are still placeholders. The
  remaining work builds the core product loop: view progress, record sessions, review history, see trends, reflect on the week, edit routines, and wire everything
  together.

  Requirements:

  From the development plan and mvp_product_spec.md sections 13–17 and 22. All domain calculation functions exist in calculations.ts. The store (useAppStore) provides
  addRoutine, updateRoutine, deleteRoutine, and addSession. Available shadcn/ui components: Button, Card, Input, Label, Progress, Checkbox, Calendar, Sheet, Separator,
  Tabs, Dialog, Select, Badge.

  Key Design Decisions:

  - Main screens call useAppStore() directly (Option B) — no prop drilling through App.tsx.
  - App.tsx holds a selectedRoutineId state, set when "Start session" is clicked, passed as a prop to ActiveSessionScreen.
  - navigate is passed as a prop from App.tsx to all screens that need it.
  - Charts use inline SVG — no chart library.
  - Tests use localStorage stubs (pattern already established in useAppStore.test.ts).

  Task Breakdown:

  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 8: Dashboard screen

  Objective: Replace the dashboard placeholder with the real screen from spec section 13.

  Implementation guidance:

  - DashboardScreen calls useAppStore() directly to read state.routines and state.sessions.
  - Receives navigate and onStartSession: (routineId: string) => void as props from App.tsx.
  - Update App.tsx: add selectedRoutineId state, pass navigate and an onStartSession callback to DashboardScreen.
  - Sections to render:
    1. Overall consistency % — call calculateConsistency with a 4-week date range. Show the percentage prominently. If previous month data exists, show the delta.
    2. This week — call calculateCompletionRate for each routine with the current Monday. Render a summary table (routine name, completed / planned).
    3. Continue card — find the first routine, show its name, last session date and top metric highlight (heaviest weight, longest distance, etc.). "Start session" button
  calls onStartSession(routineId).
    4. Progress section — call calculateProgress for each activity. Show first → latest value and delta %.

  - Empty state: when routines is empty, show a message and a "Create a routine" button that navigates to welcome.
  - Use Card, Badge, Button, and Progress (bar) from shadcn/ui.

  Test requirements:

  - Test consistency display with mock sessions in localStorage.
  - Test empty state renders the create-routine prompt.
  - Test that "Start session" button calls onStartSession with the correct routine ID.
  - Test that "Create a routine" (empty state) navigates to welcome.

  Demo: With one routine and a few sessions in localStorage, the dashboard shows real consistency %, this-week completions, and the last activity result. With no routines,
  it shows the empty state prompt.

  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 9: Active session recording

  Objective: Build the session recording screen from spec section 14, adapting to the routine's activity types.

  Implementation guidance:

  - ActiveSessionScreen receives navigate, routineId: string | null as props from App.tsx.
  - Calls useAppStore() to read the routine by ID and to call addSession.
  - Look up the routine from the store. If not found (deleted mid-session), show an error and a "Back to dashboard" button.
  - Render activity-specific input forms:
    - Strength (sets/reps/weight): show set-by-set entry. Pre-fill from the last session's results for this activity (query sessionsForRoutine). Allow adding/removing
  sets.
    - Metric activities (distance, duration, quantity): show simple number inputs with target as placeholder.
    - AVOID activities: show "Did you stay on track?" with Yes/No buttons.

  - "Complete" / "Finish session" button: assemble the Session object with all ActivityResult[], call addSession, navigate to dashboard.
  - Validation: do not allow saving if required fields are empty. For DO activities, at least one measurement must have a value. For AVOID, stayedOnTrack must be set.

  Test requirements:

  - Test that an incomplete session (not all activities filled) cannot be saved.
  - Test that AVOID sessions record stayedOnTrack.
  - Test that addSession receives correctly structured ActivityResult[].
  - Test pre-fill from last session for strength activities.
  - Test the "routine not found" error state.

  Demo: Start a session from the dashboard, fill in results for a strength workout (set by set), tap Complete, return to dashboard, and see the updated consistency.

  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 10: History screen

  Objective: Build the session history list from spec section 15.

  Implementation guidance:

  - HistoryScreen calls useAppStore() directly. Receives navigate as a prop.
  - Show sessions in reverse chronological order.
  - Each entry shows: date (formatted), routine name (look up from state.routines), activity count, and the top metric (heaviest weight, longest distance, or duration).
  - Tapping a session opens a detail view using the shadcn Sheet component. The detail shows all activity results with their measurements.
  - Handle empty state: "No sessions yet" message.
  - Use Card for each entry, Sheet for the detail overlay.

  Test requirements:

  - Test sessions are ordered newest-first.
  - Test empty state renders the "no sessions" message.
  - Test that tapping a session entry opens the detail sheet.
  - Test that session detail shows all activity results.

  Demo: After a few sessions, the history screen shows them in order with correct dates and metrics. Tapping one opens the detail sheet.

  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 11: Progress screen

  Objective: Build the progress screen from spec section 16.

  Implementation guidance:

  - ProgressScreen calls useAppStore() directly. Receives navigate as a prop.
  - Sections:
    1. Consistency — calculateConsistency over 4 weeks per routine. Show as a percentage with the Progress bar component.
    2. Performance — calculateProgress per activity. Show first → latest value and delta %.
    3. Volume — for weight-based activities, sum calculateVolume across this week's sessions. Show "X kg this week".
    4. Duration — for duration-based activities, sum duration across this week's sessions. Format as "Xh Ym this week".
    5. Trend — calculateTrend per activity/metric. Render simple inline SVG line or bar chart. Keep the chart minimal: plot data points, connect with lines, label first
  and last values.

  - Handle "not enough data" state: when fewer than 2 sessions exist, show a message instead of charts.
  - No chart library. Use <svg> with <polyline> or <rect> elements.

  Test requirements:

  - Test calculateProgress and calculateVolume return correct values for sample data (these already have unit tests; here test the screen rendering with those values).
  - Test the "not enough data" state renders without crashing.
  - Test that at least one trend chart renders when sufficient data exists.

  Demo: After multiple sessions, the progress screen shows real deltas (e.g., Bench Press 60 kg → 70 kg, +17%), weekly volume, and a simple trend chart.

  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 12: Weekly review screen

  Objective: Build the weekly review screen from spec section 17.

  Implementation guidance:

  - WeeklyReviewScreen calls useAppStore() directly. Receives navigate as a prop.
  - Call calculateWeeklySummary with the current week's Monday.
  - Sections:
    1. Consistency — show completed / planned and the percentage.
    2. Progress — call calculateProgress per activity. Show highlights.
    3. Momentum — show recentCompleted of recentPlanned from the summary (e.g., "15 of your last 18 planned sessions completed").
    4. Reflection — deterministic text based on data. Rules:
      - If consistency < 50%: suggest reducing frequency.
      - If consistency 50–80%: acknowledge effort, mention missed sessions.
      - If consistency > 80%: congratulate.
      - If scheduled days have consistent misses: suggest changing schedule.

    5. Adjust your plan — four buttons: Keep routine, Reduce frequency, Change schedule, Edit routine.
      - "Reduce frequency" calls updateRoutine stepping down the frequency (daily → 3x, 3x → 2x, 2x → 1x). Show the new frequency after update.
      - "Change schedule" navigates to a simple day-picker inline or a sheet (reuse the day toggle pattern from OptionalScheduleScreen).
      - "Edit routine" navigates to edit-routine.
      - "Keep routine" dismisses the review (navigate to dashboard).

  Test requirements:

  - Test calculateWeeklySummary rendering with sample data.
  - Test that "Reduce frequency" steps down correctly (e.g., 3x → 2x) and calls updateRoutine.
  - Test that suggestions only appear when data supports them (consistency < 50% → reduce suggestion visible).
  - Test that "Keep routine" navigates to dashboard.

  Demo: With a week of partial completions, the review shows the correct stats and a relevant suggestion. Tapping "Reduce frequency" updates the routine.

  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 13: Routine edit screen

  Objective: Allow users to edit an existing routine.

  Implementation guidance:

  - EditRoutineScreen calls useAppStore() directly. Receives navigate and routineId: string | null as props from App.tsx.
  - Reuse configuration patterns from the onboarding screens (not the components themselves, but the same UI patterns: name input, measurement fields, frequency picker,
  day toggles).
  - Pre-populate all fields with the current routine's values.
  - "Save changes" calls updateRoutine and navigates to dashboard.
  - "Delete routine" button with a confirmation Dialog. Deletion calls deleteRoutine (which also removes associated sessions) and navigates to dashboard (or welcome if no
  routines remain).
  - "Cancel" navigates back without changes.
  - Reachable from the weekly review ("Edit routine" button) and from the dashboard (add a small edit icon/button on the routine card).

  Test requirements:

  - Test that saving persists updated values via updateRoutine.
  - Test that deletion removes the routine and navigates correctly.
  - Test that cancelling leaves the store unchanged.
  - Test pre-population of fields from the existing routine.

  Demo: Navigate to edit from the weekly review, change the frequency, save, and confirm the dashboard reflects the new target.

  ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 14: End-to-end wiring and polish

  Objective: Verify the complete product loop and apply final UX polish.

  Implementation guidance:

  - Walk through the full spec success criteria (section 22 — 13 steps) and fix any broken paths.
  - Wire the selectedRoutineId from App.tsx to both ActiveSessionScreen and EditRoutineScreen. Make sure the Dashboard "Start session" and "Edit routine" buttons set the
  correct ID before navigating.
  - Add a "+" or "Add routine" button on the dashboard for creating additional routines (navigates to welcome).
  - Remove old Vite boilerplate assets: src/assets/hero.png, src/assets/react.svg, src/assets/vite.svg. Clean up any unused CSS from index.css if present.
  - Ensure consistent typography, spacing, and colour usage across all screens.
  - Verify mobile viewport usability (max-w-md container is already set).
  - Handle edge cases:
    - Multiple routines: dashboard shows all of them in the "this week" table and the "continue" card cycles or shows the most relevant one.
    - Routine with no sessions yet: show "No sessions recorded" instead of broken calculations.
    - Challenge routines: show challenge progress on the dashboard if a challenge is active.

  - Run all existing tests and fix any regressions.

  Test requirements:

  - All existing tests pass after wiring changes.
  - Add an integration-style test: render App, complete onboarding, verify dashboard shows the new routine (tests the full flow in jsdom).

  Demo: A new user can open the app, create a routine, complete a session, view their consistency, review their week, and adjust their plan — the complete product loop end
  to end.
