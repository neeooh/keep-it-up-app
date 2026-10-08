# Bug Analysis: Dashboard Momentum Stat Pro-Rating

**Date:** 2026-10-07
**Status:** Fix implemented
**Affected screen:** DashboardScreen (home screen momentum widget)

## Problem

The Dashboard "Overall consistency" stat penalizes the user for future days in
the current week. On a Wednesday the stat counts the full week (7 days) of
planned sessions in the denominator, but only 3 days of completed sessions can
exist. The remaining 4 days register as missed. This deflates the percentage.

## Root cause

`calculateConsistency` in `src/domain/calculations.ts` computes planned
sessions with a simple fractional-week formula:

```
totalWeeks = totalDays / 7
totalPlanned = totalWeeks * plannedPerWeek
```

The Dashboard calls this function with `{ start: fourWeeksAgo, end: todayStr }`.
When the range end falls mid-week, the fractional week includes future days that
have not occurred. Completed sessions can never fill those future slots, so the
ratio drops.

### Concrete example

- Today: Wednesday (day 3 of the week).
- Routine: 3 sessions per week.
- Range: 29 days (4 weeks + 1 day).
- `totalWeeks` = 29 / 7 = 4.14.
- `totalPlanned` = 4.14 × 3 = 12.43.
- User completed all 12 sessions across the 4 prior weeks, none yet this week.
- Consistency = 12 / 12.43 = **97%** instead of the expected **100%**.

The deflation grows larger when fewer past weeks exist (new users) or when the
frequency is higher (daily routines lose up to 4/7 of a week's credit).

## Fix

Add an optional `today` parameter to `calculateConsistency`. When the range end
falls on or after `today`, pro-rate the final partial week:

1. Count the number of elapsed days in the final week (Monday = 1, Sunday = 7).
2. Compute that week's planned sessions as `(elapsedDays / 7) * plannedPerWeek`.
3. Add the full planned count for all preceding complete weeks.

Past date ranges (range end before today) are not affected — all their weeks are
complete.

The DashboardScreen passes the explicit `todayStr` value so the function can
distinguish the current partial week from a past full week.

## Scope

- **Changed:** `calculateConsistency` (new optional `today` param),
  `DashboardScreen` (passes `today` to consistency calls).
- **Not changed:** `calculateWeeklySummary`, `WeeklyReviewScreen` — the Review
  Screen uses a separate code path and will be redesigned in a separate task.

---

## Bug 2: Range Start Not Clamped to Routine Creation Date

**Date:** 2026-10-08
**Status:** Fix implemented
**Affected screen:** DashboardScreen (home screen momentum widget)

### Problem

The Dashboard always looks back 28 days (4 weeks) from today when it calculates
consistency. A routine created today has its completion measured against a 28-day
window, even though 27 of those days existed before the routine. The denominator
is inflated, so the percentage drops to near zero.

A user who creates a daily routine and completes their first session sees ~3%
consistency instead of 100%.

### Root cause

`DashboardScreen` passes a fixed `fourWeeksAgo` as the range start for every
routine. It does not account for the routine's `createdAt` timestamp.

```ts
// Before fix
const consistencies = routines.map((r) =>
  calculateConsistency(sessions, r, { start: fourWeeksAgo, end: todayStr }, todayStr),
)
```

### Fix

Clamp the range start per routine to `max(fourWeeksAgo, routine.createdAt)`.
A routine that is 3 days old uses a 3-day window. A routine that is 6 weeks old
uses the full 28-day window.

```ts
// After fix
const consistencies = routines.map((r) => {
  const created = r.createdAt.slice(0, 10)
  const rangeStart = created > fourWeeksAgo ? created : fourWeeksAgo
  return calculateConsistency(sessions, r, { start: rangeStart, end: todayStr }, todayStr)
})
```

The same logic applies to the previous 4-week window used for the delta
indicator. Routines that did not exist during the previous window return 0.

### Scope

- **Changed:** `DashboardScreen` — range start clamped per routine for both
  current and previous consistency windows.
- **Not changed:** `calculateConsistency` — no changes needed. The function
  already handles any date range correctly. The caller now passes the right
  range.
