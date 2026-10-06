# P0 bug fixes — 6 October 2026

Three priority-zero bugs fixed. All 334 tests pass.

## P0-1: App always started at the welcome screen

**Problem.** `AppShell` in `App.tsx` always set the initial screen to `'welcome'`, even when routines existed in localStorage. A returning user saw the onboarding wizard on every page load. This also caused duplicate routines when users re-created their plan.

**Root cause.** Two issues: (a) `App` passed `initialScreen='welcome'` as a default prop, and (b) `AppShell` used that value without checking app state. The `??` operator never triggered because the prop was always `'welcome'`, never `undefined`.

**Fix.** Removed the `'welcome'` default from `App`. `AppShell` now reads `appState.routines.length` and resolves to `'dashboard'` when routines exist. The `initialScreen` prop still works for tests.

**Files changed.** `src/App.tsx`

## P0-2: Session logging did not pre-fill from last session

**Problem.** The session screen showed empty kg and reps fields every time. Users had to retype their previous values manually.

**Root cause.** The pre-fill code already existed in `ActiveSessionScreen` (`prefillSets` function). It reads the last session for the routine and populates kg/reps values. The code never ran because P0-1 reset the app to the welcome screen on every load, which cleared the `selectedRoutineId` state. Without a valid routine ID, the pre-fill had no data to read.

**Fix.** No code change needed. Fixing P0-1 restored the dashboard as the entry point, which preserves `selectedRoutineId` across the tap-to-log flow. Pre-fill now works as designed.

**Files changed.** None (fixed by P0-1).

## P0-3: Dashboard and Review tab showed discouraging metrics on day one

**Problem.** A user who created a routine 10 seconds ago saw "Overall consistency: 0%" on the dashboard and "You missed several planned sessions this week. A lower frequency target may be more realistic" on the Review tab. The app treated a new user the same as a user who had been skipping for weeks.

**Root cause.** `DashboardScreen` rendered the consistency percentage unconditionally. `WeeklyReviewScreen` used `generateReflection()` and `shouldSuggestReduce()`, which checked only the consistency number — not the age of the user's data.

**Fix.**

Dashboard (`DashboardScreen.tsx`):
- Heading changes from "Your momentum" to "Let's get started" when `sessions.length === 0`.
- Consistency card shows "Ready for your first session?" and "Your consistency score starts after your first workout." instead of "0%".

Review (`WeeklyReviewScreen.tsx`):
- `generateReflection()` now takes `sessions` as a parameter. When no sessions exist, it returns "Your first week starts now. Log a session when you are ready — there is no rush." When sessions exist but the oldest is less than 7 days old, it returns "You are just getting started. Focus on showing up — the numbers will follow."
- `shouldSuggestReduce()` now returns `false` when no sessions exist or when the oldest session is less than 7 days old. The "reduce frequency" suggestion only appears after a full week of data.

Test (`WeeklyReviewScreen.test.tsx`):
- The reduce-suggestion test now seeds a session 10 days in the past so the 7-day age gate passes.

**Files changed.** `src/screens/DashboardScreen.tsx`, `src/screens/WeeklyReviewScreen.tsx`, `src/screens/WeeklyReviewScreen.test.tsx`

---

# P1 bug fixes — 6 October 2026

Four P1 items assessed. Two already implemented, two fixed. All 334 tests pass.

## P1-4: Direction-aware session logging — already implemented

The `ActiveSessionScreen` already had an `AvoidInput` component that renders "Did you stay on track?" with Yes/No buttons for `AVOID`-direction activities. The `isActivityComplete` function checks `stayedOnTrack !== null` for avoidance habits. No code change needed.

## P1-5: Template frequency not passed as default

**Problem.** When a user picked "No smoking" (template `defaultFrequency: 'daily'`), the frequency screen defaulted to "3× per week" because the onboarding draft hardcoded `frequency: '3x_week'`.

**Root cause.** `onTemplateSelect` in `App.tsx` only set `draft.templateId`. It did not read the template's `defaultFrequency` and apply it to the draft.

**Fix.** `onTemplateSelect` now calls `findTemplate(id)` and sets both `templateId` and `frequency` from `tmpl.defaultFrequency`.

**Files changed.** `src/App.tsx`

## P1-6: Delete routine — already implemented

The `EditRoutineScreen` already had a "Delete routine" button with a confirmation dialog. The `deleteRoutine` function in the store removes the routine and all associated sessions. No code change needed.

## P1-7: Duplicate routines created silently

**Problem.** The app created a new routine every time the user went through onboarding, even if a routine with the same name already existed. The duplicate routines confused the dashboard and split session data across multiple routine IDs.

**Root cause.** `addRoutine` in the store appended without checking for existing names. The `PlanReviewScreen` had no awareness of existing routines.

**Fix.** `PlanReviewScreen` now reads the store via `useAppStore()` and checks if a routine with the same name (case-insensitive) already exists. If so, it shows a warning banner: "You already have a routine called X. You can still create this one, but consider renaming it to tell them apart." The user is not blocked — the warning is informational.

**Files changed.** `src/screens/onboarding/PlanReviewScreen.tsx`, `src/screens/onboarding/task7.test.tsx`
