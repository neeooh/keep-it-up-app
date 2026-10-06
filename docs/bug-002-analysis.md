# BUG-002 Analysis: New Activity not added to the Continue section

## Problem

After adding a second routine via the "+" button on the Home screen, the new routine does not appear in the "Continue" section. That section only shows the first routine (`routines[0]`). The user cannot log sessions for any routine other than the first one.

## Root Cause

The DashboardScreen hard-codes a single routine in the "Continue" section:

```typescript
const continueRoutine = routines[0]!
```

All downstream data (last session highlight, last session date) and the JSX (edit button, "Start session" button) reference only this one routine. There is no iteration over the full `routines` array.

## Affected File

`src/screens/DashboardScreen.tsx` — the "Continue" card section (data computation and JSX).

## Fix

1. Rename the section heading from "Continue" to "Your Plan for Today".
2. Replace the single-routine data computation with a `routineDetails` array that computes highlight and last-session date for every routine.
3. Replace the single `Card` with a `.map()` over all routines. Each routine gets its own card with:
   - An edit button (`edit-routine-button-{routineId}`)
   - A "Log session" button (`log-session-button-{routineId}`, renamed from "Start session")
   - Its own session highlight and last-session date
4. Update test IDs from singleton to per-routine.

### Test ID changes

| Old (singleton) | New (per-routine) |
|---|---|
| `start-session-button` | `log-session-button-{routineId}` |
| `edit-routine-button` | `edit-routine-button-{routineId}` |
| `session-highlight` | `session-highlight-{routineId}` |
| — | `plan-card-{routineId}` |

## Tests Updated

- `DashboardScreen.test.tsx` — updated existing tests to use new test IDs. Added 5 new tests for multi-routine scenarios (both plan cards render, both log buttons render, both edit buttons render, correct routine ID passed on click).

## Verification

329 tests pass across 13 test files. TypeScript compiles cleanly.
