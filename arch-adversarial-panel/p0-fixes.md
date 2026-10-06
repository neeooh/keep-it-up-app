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

---

# P2 bug fixes — 6 October 2026

Five P2 items. All five fixed. All 334 tests pass.

## P2-8: "Repeat last session" quick-log

**Problem.** Returning users who do the same workout every session had to re-enter all values manually. No shortcut existed.

**Fix.** The dashboard routine card now shows a "Repeat" button next to "Log session" when the routine has at least one previous session. One tap clones the last session's results with a new timestamp and saves it.

**Files changed.** `src/screens/DashboardScreen.tsx`

## P2-9: Restart challenge

**Problem.** A user who wanted to restart their 30-day challenge had no way to do so. The only option was to delete the routine and re-create it.

**Fix.** `EditRoutineScreen` now shows a "Restart X-day challenge" button when the routine has a challenge duration. One tap resets `challengeStartDate` to today. A confirmation message appears after the restart.

**Files changed.** `src/screens/EditRoutineScreen.tsx`

## P2-10: Empty states rewritten

**Problem.** The History and Progress tabs showed factual but lifeless empty states ("No sessions yet", "Not enough data yet") with no call to action.

**Fix.** Both empty states now have positive headings ("Your history starts here", "Your progress charts will appear here"), encouraging subtext, and a CTA button ("Log your first session" / "Log a session") that navigates to the dashboard.

**Files changed.** `src/screens/HistoryScreen.tsx`, `src/screens/ProgressScreen.tsx`, `src/screens/HistoryScreen.test.tsx`, `src/screens/ProgressScreen.test.tsx`

## P2-11: Review tab tone tuning

**Problem.** The mid-range (50-79%) review messaging named missed routines ("you missed some sessions for X"), which felt like a report card.

**Fix.** The 50-79% message now leads with the positive: "You completed X sessions this week. That counts." The 80%+ message was sharpened to "Strong week. You showed up consistently." The under-50% first-week message (from P0-3) remains encouraging.

**Files changed.** `src/screens/WeeklyReviewScreen.tsx`

## P2-12: Calendar reminder prompt

**Problem.** The app collected preferred days and times during onboarding but never reminded the user to actually open the app. Push notifications are out of scope for the MVP.

**Fix.** The `OptionalScheduleScreen` now shows a calendar-reminder prompt when the user has selected at least one day and a specific time (not "Anytime"). The message reads: "Add a recurring calendar reminder on your phone to help you remember. This app does not send push notifications yet."

**Files changed.** `src/screens/onboarding/OptionalScheduleScreen.tsx`
