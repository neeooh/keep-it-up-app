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

---

## ADR-007: PWA with offline support for distribution

**Date:** 8 October 2026
**Status:** Accepted

### Context

The app is a client-side SPA with no backend. All data lives in localStorage. Four distribution options were evaluated:

1. **PWA** — Add a service worker and web manifest. Host static files for free on Vercel, Netlify, or Cloudflare Pages. Users install from the browser.
2. **TWA (Trusted Web Activity)** — Wrap the PWA in a thin Android shell and publish to the Google Play Store. Requires a deployed PWA first. $25 one-time Google Play fee.
3. **Capacitor** — Wrap the web app in a native WebView for Android and iOS app stores. Requires Xcode ($99/year Apple Developer) and Android Studio.
4. **React Native / Expo** — Full rewrite. All React DOM components, Tailwind CSS, and shadcn/ui would need to be replaced. Not a conversion — a new project.

### Decision

Option 1: PWA. A service worker precaches all static assets so the app works offline. The web manifest makes the app installable on Android and iOS home screens.

**Why not React Native?** The app uses React DOM, Tailwind CSS, and shadcn/ui components. Converting to React Native would require rewriting every component because React DOM elements (`div`, `p`, `button`) do not exist in React Native. This is a full rewrite, not a migration.

**Why not Capacitor?** It adds native build toolchains (Xcode, Android Studio) and app store submission complexity for no functional benefit. The app has no need for native APIs (camera, push notifications, file system). Capacitor can be added later if needed.

**Why not TWA first?** A TWA requires a deployed PWA. The PWA is the prerequisite. A TWA wrapper can be added later in an afternoon if Play Store presence is needed.

### Implementation

- **Plugin:** `vite-plugin-pwa` (dev dependency).
- **Registration:** `autoUpdate` — the service worker updates silently on page reload. No user prompt.
- **Precaching:** Workbox precaches all static assets (`*.js`, `*.css`, `*.html`, `*.png`, `*.svg`, `*.woff2`). The entire app works offline after the first visit.
- **Runtime caching:** Google Fonts are cached with a CacheFirst strategy (1 year TTL, max 10 entries).
- **Manifest:** `standalone` display, portrait orientation, terracotta theme color (#D97745), warm off-white background (#FAF9F6).
- **Icons:** Standard 192px and 512px PNGs. Maskable variants with safe-zone padding for adaptive icon shapes on Android. Apple-touch-icon at 180px for iOS.

### Consequences

- The app works offline after the first load.
- Users can install the app from the browser on Android, iOS, and desktop.
- No app store fees, no native toolchains, no code changes to the React app.
- Static hosting is free on Vercel, Netlify, Cloudflare Pages, or GitHub Pages.
- A TWA wrapper can be added later for Google Play Store presence ($25 one-time fee).
- iOS push notifications are not available (iOS PWA limitation). This does not affect the MVP.

### Files changed

`vite.config.ts`, `index.html`, `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/maskable-icon.svg`, `public/maskable-192x192.png`, `public/maskable-512x512.png`, `public/apple-touch-icon.png`

---

## ADR-008: Local notification reminders via Snooze button

**Date:** 8 October 2026
**Status:** Accepted

### Context

Users open the Today screen and see activities they are not ready to do right now. There is no way to set a reminder. The user either does the activity immediately, forgets about it, or mentally tracks the reminder themselves.

Three notification approaches were considered:

1. **Local Notification API + setTimeout** — schedule a notification from the browser. No server, no push subscription. Works while the tab or installed PWA is alive.
2. **Service Worker Push** — register a push subscription, send notifications from a server. Works even when the app is closed. Requires a backend.
3. **No notifications** — rely on the user to remember.

### Decision

Option 1. Use the Notification API with `setTimeout` for local reminders.

The app has no backend. Push notifications would require one. Local notifications cover the primary use case: the user has the app open, picks "remind me in 30 minutes", and gets a notification while their phone is nearby.

### Implementation

- **`useNotification` hook** (`src/hooks/useNotification.ts`): handles permission requests, schedules reminders via `setTimeout`, tracks active timers, shows confirmation messages.
- **Snooze button** on each incomplete activity card on the Today screen. The Start and Snooze buttons share a 50/50 row.
- **Snooze options:** 15 min, 30 min, 45 min, 1 hour, 2 hours, 4 hours, This evening (calculated as minutes until 18:00, minimum 15).
- **Permission flow:** on first snooze attempt, the browser prompts for notification permission. If denied, the snooze menu shows a message. If unsupported, it says so.
- **Confirmation:** a brief toast ("Reminder set for 3:30 PM") appears for 3 seconds after scheduling.

### Limitations

- If the user closes the browser or app entirely, the timer is lost. This is a known limitation of `setTimeout`-based scheduling.
- iOS requires the PWA to be installed to the home screen and iOS 16.4+.
- No persistence across page reloads. A scheduled reminder is lost if the user refreshes.

### Consequences

- Users can defer activities and get reminded without leaving the app.
- No backend, no push subscription, no server cost.
- The Snooze button only appears on incomplete activities. Completed activities show "Log another" instead.
- Future improvement: use the service worker's `waitUntil` or the experimental `Scheduler` API for more reliable background delivery.

### Files changed

`src/hooks/useNotification.ts` (new), `src/screens/DashboardScreen.tsx`, `src/screens/DashboardScreen.test.tsx`

---

## ADR-009: Completed activity card redesign with session results and trend

**Date:** 8 October 2026
**Status:** Accepted

### Context

The completed activity card on the Today screen showed only "Completed" as a label with no detail about what the user accomplished. There was no feedback loop — the user could not see their results or compare with previous sessions without navigating to History or Progress.

### Decision

Redesign the completed card to show:

1. **Status line:** tick icon + "Completed" on the same row (top of card).
2. **Activity name:** below the status line.
3. **Measurements:** session results displayed as a compact string (e.g. "1440 kg volume · 3 sets" or "5.2 km · 31 min").
4. **Delta indicator:** percentage change vs the most recent previous session for the same routine. Shows a green up-arrow or red down-arrow with the label (e.g. "+20% volume vs last session"). Hidden when no previous session exists.

The comparison uses:
- Total volume (weight × reps per set) for strength activities.
- The first shared scalar metric for other activity types.

### Consequences

- The user sees immediate feedback after logging a session.
- The delta provides motivation (improvement) or awareness (decline) without navigating away.
- No delta is shown for first-time sessions — no confusing "0%" or empty state.
- The `getCompletedResult` helper in DashboardScreen extracts today's results and computes the delta. It uses `calculateVolume` from the domain layer.
- The completed card is visually richer but remains compact.

### Files changed

`src/screens/DashboardScreen.tsx`, `src/screens/DashboardScreen.test.tsx`

---

## ADR-010: Close button on add-activity flow (not first-time onboarding)

**Date:** 8 October 2026
**Status:** Accepted

### Context

When a user taps the "+" button on the Today screen to add a new activity, they enter the onboarding flow. There was no way to cancel and return to the dashboard without completing the flow or refreshing the page.

### Decision

Add an X (close) button to all onboarding screens. The button only appears when the user already has routines (they are adding another one). During first-time onboarding (no routines), the close button is hidden because there is no dashboard to return to.

### Implementation

- `App.tsx` passes `onClose={() => navigate('dashboard')}` to onboarding screens when `routines.length > 0`. Passes `undefined` otherwise.
- Each onboarding screen (`WelcomeScreen`, `ChooseDirectionScreen`, `ConfigureActivityScreen`, `SetFrequencyScreen`, `PlanReviewScreen`) accepts an optional `onClose` prop and renders an X button in the top-right corner of the header when it is provided.
- The close button has a 44px touch target and uses the same styling as other icon buttons.

### Consequences

- Users can cancel the add-activity flow at any step and return to the dashboard.
- First-time users see no close button — they must complete onboarding to reach the dashboard.
- The onboarding draft state is not cleared on close. If the user re-enters the flow, they see a fresh draft (the draft is reset when `onStartRoutine` completes).

### Files changed

`src/App.tsx`, `src/screens/onboarding/WelcomeScreen.tsx`, `src/screens/onboarding/ChooseDirectionScreen.tsx`, `src/screens/onboarding/ConfigureActivityScreen.tsx`, `src/screens/onboarding/SetFrequencyScreen.tsx`, `src/screens/onboarding/PlanReviewScreen.tsx`

---

## ADR-011: Activity icons via keyword matching

**Date:** 8 October 2026
**Status:** Accepted

### Context

Activity cards on the Today screen, History screen, and onboarding template cards had no visual icon. Every card looked the same, making it harder to scan and identify activities at a glance.

### Decision

Add a shared `ActivityIcon` component that maps activity names to Lucide icons via keyword matching. The icon appears to the left of the activity name on all cards.

Icon mapping covers: strength/dumbbell, running/footprints, cycling/bike, swimming/waves, yoga/person, meditation/wind, reading/book, learning/graduation cap, practice/palette, journaling/pen, morning/sunrise, evening/moon, outside/tree, smoking/cigarette, food/utensils, social media/smartphone, alcohol/wine. Unknown activities fall back to a generic circle-dot icon.

Icons use the `text-muted-foreground/60` colour — a muted grey from the brand system that supports visual hierarchy without competing with the activity name or action buttons.

### Consequences

- Activities are visually distinguishable at a glance.
- The icon mapping is keyword-based, not template-ID-based, so it works for custom activities too (a user who names their activity "Morning jog" gets the footprints icon).
- Icons appear on: Today activity cards, History session rows, ChooseDirection template cards, PlanReview plan card.
- No new icon library — all icons come from Lucide React (already a dependency).

### Files changed

`src/components/ActivityIcon.tsx` (new), `src/screens/DashboardScreen.tsx`, `src/screens/HistoryScreen.tsx`, `src/screens/onboarding/ChooseDirectionScreen.tsx`, `src/screens/onboarding/PlanReviewScreen.tsx`
