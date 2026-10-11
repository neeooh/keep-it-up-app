# UI/UX Discussion v3 — Decisions

**Date:** 11 October 2026

One feature discussed. This document covers the decision to remove the Review tab from the bottom navigation and integrate it into the Progress screen.

---

## FEAT-006: Move Review into Progress screen

### Problem

The bottom navigation has 5 tabs: Today, Plan, Progress, Review, History. Five tabs is the practical maximum on mobile. The Review tab is empty for the first week of use because it reviews the previous completed week (Monday to Sunday). A blank screen during the first week wastes a tab slot during the highest-churn period.

Additionally, Review and Progress overlap conceptually. Progress shows trends. Review reflects on the most recent week. Both answer "how am I doing?" — one with charts, the other with a summary.

### Options considered

- **A.** Remove History from the nav. Keep Review. Access History from Progress.
- **B.** Remove Review from the nav. Keep History. Access Review from Progress.
- **C.** Remove both History and Review. Access both from Progress.

### Decision

Option B. Remove the Review tab. Keep History. The bottom nav becomes 4 tabs: Today, Plan, Progress, History.

Reasoning:

- History is useful from day one. The user logs a session, taps History, and sees it immediately.
- Review is empty for the first week. It requires 7+ days of data to show anything.
- Review is used once per week. History is used whenever the user wants to look up a past session.

### Review card on Progress screen

The Progress screen gets a new "Weekly Review" section. The section always appears (it is not hidden when data is insufficient). It has two states:

**Countdown state (not enough data):**

A card shows a segmented progress circle that fills as days accumulate toward the first review. The circle has 7 segments (one per day of the week). Filled segments represent days with at least one session. The card shows:

- The segmented circle
- "X of 7 days" with a label such as "Your first review builds as you log sessions"
- A countdown: "Review ready in Y days" or "Review ready on Monday"

This motivates the user to keep logging. The circle fills visually as they use the app through the week. It turns the empty state into a progress indicator.

**Ready state (review data available):**

The card shows a compact summary of the latest weekly review:

- Week date range (e.g. "5 Oct – 11 Oct")
- Completion summary (e.g. "4 of 5 sessions completed")
- Consistency percentage
- A "Review your week" button that navigates to the full WeeklyReviewScreen

### Past reviews list

Below the Review card, a "Past reviews" section lists previous weeks that have session data. Each row shows:

- Week date range
- Consistency percentage
- Tap navigates to the WeeklyReviewScreen for that week

This lets the user browse their review history over time.

The WeeklyReviewScreen itself does not change — it keeps its full layout (completion summary, what went well, missed sessions, momentum, keep/adjust plan). Only its entry point moves from the bottom nav to the Progress screen.

### Navigation changes

- Remove `weekly-review` from `NAV_TABS` in types.ts.
- Remove the `CalendarCheck` icon from `NAV_ICONS` in App.tsx.
- The `weekly-review` screen type stays in the Screen union — it is still a valid screen, just not a nav tab.
- ProgressScreen gains a `navigate` prop and an `onEditRoutine` prop (to pass through to WeeklyReviewScreen when navigating).
