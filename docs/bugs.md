# Bug Tracker

All known bugs and their analysis. Organized by status.

## Summary

| ID | Title | Severity | Status |
|---|---|---|---|
| BUG-001 | Adding a second activity loses data | High | ✅ Fixed |
| BUG-002 | New activity not added to Continue section | High | ✅ Fixed |
| BUG-003 | Edit screen free-text input for preferred time | Medium | ✅ Fixed |
| BUG-004 | Strength exercise builder missing weight input | Medium | ✅ Fixed |
| BUG-005 | Strength workout name overwrite on save | High | ✅ Fixed |
| BUG-006 | Missed-yesterday banner on first open | Medium | ✅ Fixed |
| BUG-MOM-1 | Dashboard momentum penalizes partial week | Medium | ✅ Fixed |
| BUG-MOM-2 | Range start not clamped to routine creation date | Medium | ✅ Fixed |
| BUG-SCROLL | Welcome screen horizontal scroll left margin | Low | ⏳ Open |

---

## Fixed

### BUG-001: Adding a second activity loses data

**Severity:** High

**Steps to reproduce:**
1. Complete initial onboarding.
2. Click the "+" button and add a new activity.
3. The newly created routine is not visible on the dashboard, Progress, or Review.

**Root cause**

`useAppStore` was a plain `useState` hook. Every component got its own independent state copy. The only synchronization was localStorage, which created stale reads and child-first effect ordering problems.

**Fix**

Converted `useAppStore` from a standalone `useState` hook into a Context + Provider pattern. A single state instance lives at the top of the component tree. All consumers read from the same state via `useContext`.

**Files changed:** `src/store/useAppStore.ts`, `src/App.tsx`, all screen test files.

---

### BUG-002: New activity not added to Continue section

**Severity:** High

**Steps to reproduce:**
1. Add a second routine via the "+" button.
2. The "Continue" section shows only the first routine.

**Root cause**

The DashboardScreen hard-coded a single routine:

```typescript
const continueRoutine = routines[0]!
```

**Fix**

1. Renamed "Continue" to "Your Plan for Today."
2. Replaced single-routine data computation with a `routineDetails` array.
3. Replaced the single Card with a `.map()` over all routines.

**Files changed:** `src/screens/DashboardScreen.tsx`, tests.

---

### BUG-003: Edit screen free-text input for preferred time

**Severity:** Medium

**Steps to reproduce:**
1. Open the edit screen for an activity.
2. The "preferred time" section allows free text input instead of toggle buttons.

**Root cause**

The `EditRoutineScreen` used a generic `<Input>` for preferred time. The onboarding screen used toggle buttons for the same field.

**Fix**

Added a `TIME_OPTIONS` constant and replaced the `<Input>` with toggle buttons that use `aria-pressed`.

**Files changed:** `src/screens/EditRoutineScreen.tsx`, tests.

---

### BUG-004: Strength exercise builder missing weight input

**Severity:** Medium

**Steps to reproduce:**
1. Select "Strength workout" during onboarding.
2. The exercise builder shows Sets and Reps inputs but no Weight input.

**Root cause**

The `ExerciseRow` interface only defined `id`, `name`, `sets`, and `reps`. No `weight` field existed.

**Fix**

Added `weight: string` to `ExerciseRow`. Added a third input column (Weight) to `ExerciseRowField`.

**Files changed:** `src/screens/onboarding/ConfigureActivityScreen.tsx`, tests.

---

### BUG-005: Strength workout name overwrite on save

**Severity:** High

See [features/uiux-tracker.md](features/uiux-tracker.md) — BUG-005.

---

### BUG-006: Missed-yesterday banner on first open

**Severity:** Medium

See [features/uiux-tracker.md](features/uiux-tracker.md) — BUG-006.

---

### BUG-MOM-1: Dashboard momentum penalizes partial week

**Date:** 7 October 2026

**Problem**

The Dashboard "Overall consistency" stat penalizes the user for future days in the current week. On a Wednesday the stat counts the full week (7 days) in the denominator, but only 3 days of completed sessions can exist.

**Root cause**

`calculateConsistency` computed planned sessions with `totalWeeks = totalDays / 7`. When the range end falls mid-week, the fractional week includes future days.

**Fix**

Added an optional `today` parameter to `calculateConsistency`. When the range end falls on or after today, pro-rate the final partial week based on elapsed days.

**Files changed:** `src/domain/calculations.ts`, `src/screens/DashboardScreen.tsx`.

---

### BUG-MOM-2: Range start not clamped to routine creation date

**Date:** 8 October 2026

**Problem**

The Dashboard always looks back 28 days from today. A routine created today has its completion measured against a 28-day window, producing near-zero consistency.

**Root cause**

`DashboardScreen` passed a fixed `fourWeeksAgo` as the range start for every routine without accounting for `createdAt`.

**Fix**

Clamped the range start per routine to `max(fourWeeksAgo, routine.createdAt)`.

**Files changed:** `src/screens/DashboardScreen.tsx`.

---

## Open

### BUG-SCROLL: Welcome screen horizontal scroll left margin

**Status:** Open — needs manual fix.

**Location:** `src/screens/onboarding/WelcomeScreen.tsx`

**Problem**

The first card in the horizontal scroll list sits flush against the left edge. It should have a 24px left margin that matches the page padding.

**Root cause**

The scroll container uses `-mx-6` to break out to the viewport edges. The left inset for the first card needs to be re-introduced inside the scroll container.

**Attempted fixes (all failed):**
1. `ml-6` on first card / `mr-6` on last card.
2. `-mx-6 px-6` on the scroll container.
3. Spacer `<div>` elements with `shrink-0 w-6`.

**Likely fix direction:**
- Try `min-w-[1.5rem]` instead of `w-6` on the spacers.
- Or use `::before` / `::after` pseudo-elements with fixed width.
- Or wrap the scroll section in a full-bleed container with `padding-inline`.
