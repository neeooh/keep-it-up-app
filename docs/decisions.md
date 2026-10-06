# Architecture decisions

## ADR-001: Skip configure screen for template-based activities

**Date:** 6 October 2026
**Status:** Accepted

### Context

The onboarding flow had 7 screens before the user reached the dashboard. Screen 3 ("configure activity") asked the user to enter target numbers for measurements like distance and duration. For template-based activities (running, reading, meditation, all AVOID habits), this screen showed pre-filled fields that the user did not understand. The inputs had no labels that explained whether the numbers were targets, goals, or tracking definitions.

Four options were considered:
- **A.** Add helper text to explain the fields.
- **B.** Make targets optional with a toggle.
- **C.** Remove the number inputs and confirm the measurement types only.
- **D.** Skip the screen entirely for template-based activities.

### Decision

Option D. Skip the configure screen when the user selects a pre-built template that is not strength-based and not custom.

The configure screen stays for:
- **Strength templates** — the user builds an exercise list (bench press, squat, etc.)
- **Custom / "Something else"** — the user types a name from scratch

For all other templates, the template already provides the activity name, measurements, and frequency. The configure screen confirms what the user already chose. It adds one tap, one decision, and one moment of confusion.

### Consequences

- Onboarding drops from 7 screens to 6 for most habits.
- The user cannot rename the activity during onboarding. They can rename it from Edit Routine after setup.
- Template defaults (name, measurements, frequency) are applied to the draft when the template is selected. The `onTemplateSelect` callback in `App.tsx` now pre-applies all defaults.
- A `needsConfigureScreen()` helper in `templates.ts` determines the routing. This is the single source of truth for which templates need the screen.
- Back buttons and "Edit plan" buttons are aware of whether the screen was skipped, via a `skippedConfigure` flag on the onboarding draft.

### Files changed

`App.tsx`, `ChooseDirectionScreen.tsx`, `SetFrequencyScreen.tsx`, `PlanReviewScreen.tsx`, `templates.ts`

---

## ADR-002: Route to dashboard when routines exist

**Date:** 6 October 2026
**Status:** Accepted

### Context

The app always started at the welcome screen regardless of whether the user had existing routines in localStorage. A returning user saw the onboarding wizard on every page load. This caused duplicate routines when users re-created their plan and made the app unusable as a daily tool.

### Decision

`AppShell` checks `appState.routines.length > 0` on mount and starts at `dashboard` instead of `welcome`. The `initialScreen` prop still works for tests.

### Consequences

- Returning users land on the dashboard.
- The `App` component no longer defaults `initialScreen` to `'welcome'` — it passes `undefined` so `AppShell` can decide based on state.
- Session pre-fill (which was already implemented) now works because the user reaches the session screen through the dashboard flow, which preserves `selectedRoutineId`.

---

## ADR-003: Age-aware messaging in dashboard and weekly review

**Date:** 6 October 2026
**Status:** Accepted

### Context

A user who created a routine 10 seconds ago saw "Overall consistency: 0%" on the dashboard and "You missed several planned sessions" on the Review tab. The app treated new users the same as users who had been skipping for weeks. This was discouraging and drove the "resister" persona to stop opening the app.

### Decision

The dashboard and weekly review now check session history before showing metrics.

**Dashboard:**
- No sessions: heading says "Let's get started", consistency card says "Ready for your first session?"
- Has sessions: shows the actual consistency percentage and "Your momentum" heading.

**Weekly review:**
- No sessions: "Your first week starts now. Log a session when you are ready."
- Under 7 days of data: "You are just getting started. Focus on showing up."
- 7+ days, above 80%: "Strong week. You showed up consistently."
- 7+ days, 50-79%: "You completed X sessions this week. That counts."
- 7+ days, under 50%: unchanged (suggests reducing frequency).

The "reduce frequency" suggestion only appears after 7+ days of session data.

### Consequences

- New users see encouragement instead of failure metrics.
- The `generateReflection()` and `shouldSuggestReduce()` functions now take `sessions` as a parameter.
- Tests that check the reduce-suggestion need sessions older than 7 days.

---

## ADR-004: Template frequency as default

**Date:** 6 October 2026
**Status:** Accepted

### Context

Templates defined a `defaultFrequency` (e.g. "No smoking" = daily), but the frequency screen always defaulted to "3× per week" because `EMPTY_DRAFT` hardcoded it. A user who picked "No smoking" saw "3× per week" pre-selected on the frequency screen.

### Decision

`onTemplateSelect` in `App.tsx` reads the template's `defaultFrequency` and applies it to the draft. The frequency screen shows the template's intended default.

### Consequences

- "No smoking" defaults to daily. "Running" defaults to 2× per week. Each template's frequency is respected.
- Custom templates fall back to `3x_week` (the `EMPTY_DRAFT` default).

---

## ADR-005: Duplicate routine warning

**Date:** 6 October 2026
**Status:** Accepted

### Context

The app created a new routine every time the user went through onboarding, even if a routine with the same name existed. The routing bug (ADR-002) made this worse — users saw the welcome screen, went through onboarding again, and silently created duplicates.

### Decision

The plan-review screen checks if a routine with the same name (case-insensitive) already exists. If so, it shows a warning banner. The user is not blocked — the warning is informational.

### Consequences

- Users are warned before creating duplicates.
- The `PlanReviewScreen` now uses `useAppStore()` to read existing routines.
- Tests that render `PlanReviewScreen` need the `AppStoreProvider` wrapper.

---

## ADR-006: Retention features (repeat session, restart challenge, empty states, calendar reminder)

**Date:** 6 October 2026
**Status:** Accepted

### Context

An adversarial panel identified five retention issues:
1. No quick way to log a repeat workout.
2. No way to restart a challenge without deleting the routine.
3. Empty states in History and Progress were lifeless.
4. The Review tab's mid-range messaging named missed routines instead of leading with the positive.
5. No reminder mechanism to help users remember to open the app.

### Decision

Five changes:
1. **Repeat button** on dashboard routine cards. Clones the last session with a new timestamp. Only appears when the routine has at least one previous session.
2. **Restart challenge** button in `EditRoutineScreen`. Resets `challengeStartDate` to today. Only appears for routines with a challenge duration.
3. **Empty states** in History ("Your history starts here" + CTA) and Progress ("Your progress charts will appear here" + CTA) rewritten with positive copy and tap targets that navigate to the dashboard.
4. **Review tone** tuned. 80%+: "Strong week." 50-79%: "You completed X sessions. That counts."
5. **Calendar reminder** prompt on the schedule screen. Appears when the user selects days and a specific time. Suggests adding a phone calendar reminder.

### Consequences

- Dashboard imports `Repeat` icon from Lucide and uses `addSession` from the store.
- `EditRoutineScreen` imports `RotateCcw` icon.
- History and Progress screens activate their `navigate` prop (previously unused) and import `Button`.
- `OptionalScheduleScreen` imports `CalendarPlus` icon.
