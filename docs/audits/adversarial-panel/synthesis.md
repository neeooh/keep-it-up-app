# Adversarial panel synthesis — keep-it-up-app

## Executive summary

**Readiness: not ready for daily use.** One critical bug (app resets to welcome on every load) makes the app unusable as a daily tool. The design and code quality are solid — clean semantic HTML, 96% accessibility, zero console errors, good component architecture. But the user experience has three structural problems that all three perspectives hit independently: the app does not remember returning users, it punishes instead of encouraging, and the session-logging experience is too slow for daily use.

**Top three issues:**
1. App always starts at the welcome screen, even when routines exist in localStorage
2. Session logging requires full manual entry every time — no pre-fill from last session
3. Tone is deficit-focused (0% consistency, "reduce your goals") instead of forward-looking

**Top three strengths:**
1. Clean, fast onboarding with well-designed preset templates
2. The Review tab's adaptive suggestions (reduce frequency, change schedule) are the right idea — the tone just needs tuning
3. The data model is well-structured — routines, activities, measurements, sessions, with direction support for both "do" and "avoid" habits

**Clearest next step:** Fix the routing bug. Check `state.routines.length > 0` on mount and skip to dashboard. This is a one-line fix that transforms the app from broken to usable.

---

## Common themes

These challenges were raised by two or more perspectives independently.

| Theme | Raised by | Impact |
|---|---|---|
| **App resets to welcome on every load** | Returning user, Resister | Blocks daily use entirely. Creates duplicate routines. |
| **0% consistency shown on day one** | First-time user, Resister | Discourages new users before they take any action. |
| **No pre-fill or quick-log** | Returning user, Resister | Makes daily logging slow. Competing apps solve this. |
| **Avoidance habits use exercise-style logging** | First-time user, Resister | The "Stop doing something" path collects direction data but the session screen ignores it. |
| **No delete/restart path** | First-time user, Resister | Users cannot recover from mistakes or reset after absence. |
| **Empty states are lifeless** | First-time user, Resister | Missed opportunity to drive action. |

## Contradictions

| Tension | First-time user wants | Returning user wants | Resister wants |
|---|---|---|---|
| **Onboarding length** | Fewer screens, get to dashboard fast | Skip onboarding entirely | Does not care about onboarding — wants the app to recognise them |
| **Data entry detail** | Less (does not know what to enter) | More efficient (pre-fill, quick-log) | Less (just wants a check-in) |
| **Metrics on dashboard** | Encouragement, not numbers | Accurate progress data | No deficit framing at all |

The contradiction around metrics is the most important design decision. The returning user wants to see "60 kg × 10 reps on Monday" to plan today's workout. The resister wants to see "you are here, that is enough". The first-time user wants to see neither — just "start your first session". The app needs three presentation states, not one.

## Gaps (not addressed in the current design)

1. **Routing based on app state.** The app has the data to know whether a user is new or returning. It does not use it.
2. **Session pre-fill.** The data model stores previous session results. The session screen does not read them.
3. **Direction-aware session logging.** `AVOID`-direction activities need a yes/no check-in, not kg/reps.
4. **Frequency default from template.** The `SetFrequencyScreen` ignores the template's stated frequency.
5. **Duplicate routine prevention.** The store appends without checking names.
6. **Restart/reset actions.** No way to reset a challenge or wipe a week without deleting the routine.
7. **Empty-state CTAs.** Empty states describe the void but do not link to the action that fills it.

## Strengths (things multiple perspectives valued)

1. **Clean design.** All three perspectives noted the UI is uncluttered, fast, and readable.
2. **Good preset templates.** The habit picker saved the first-time user from a blank page.
3. **Smart review logic.** The Review tab's frequency-reduction suggestion is the right concept — it just fires too early and sounds discouraging.
4. **Solid data model.** The schema supports everything the app needs (direction, measurements, frequency, challenge duration). The UI just does not surface all of it.
5. **Accessibility.** 96% Lighthouse score, good semantic HTML, `data-testid` throughout.

## "What would make me say yes" — one line per user

| User | Acceptance bar |
|---|---|
| First-time user | Get me to the dashboard in 2–3 taps and show encouragement, not 0%. |
| Returning user | Open → dashboard → pre-filled session → done in 30 seconds. |
| Resister | Do not remind me I failed. Show me what to do today. Let me restart. |

## Prioritised actions

### P0 — Fix before daily use

1. **Route to dashboard when routines exist.** Check `state.routines.length > 0` in `AppShell` on mount. One-line fix.
2. **Pre-fill session with last values.** Read last session for this routine from state, populate kg/reps fields.
3. **Show encouraging copy on day one.** Replace "0% consistency" with "Ready for your first session?" when no sessions exist.

### P1 — Fix before sharing with others

4. **Build direction-aware session logging.** `AVOID` activities get a yes/no daily check-in. `DO` activities keep the current kg/reps form.
5. **Pass template frequency as default.** The `SetFrequencyScreen` should receive the template's frequency, not always `3x_week`.
6. **Add delete-routine action.** Visible from the dashboard or the edit-routine screen.
7. **Prevent duplicate routines.** Warn when creating a routine with the same name.

### P2 — Backlog (retention and polish)

8. **Add "repeat last session" quick-log.** One-tap logging for identical sessions.
9. **Add restart-challenge action.** Reset progress without deleting the routine.
10. **Rewrite empty states.** Add CTAs, positive copy, and tap targets to each empty state.
11. **Tune Review tab tone.** Distinguish "day one" from "week three" messaging.
12. **Add calendar-reminder prompt.** If push notifications are out of scope, prompt the user to add a calendar event.

---

*Panel convened: 6 October 2026. Three user perspectives (first-time user, returning user, resister). Based on live app exploration at `localhost:5173` (iPhone 17 viewport), HTML/CSS review, Lighthouse audit, and source code review of `App.tsx` and `useAppStore.tsx`.*
