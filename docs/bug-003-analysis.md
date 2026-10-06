# BUG-003 Analysis: Edit screen uses free text input for preferred time

## Problem

The Edit Routine screen uses a free-text `<Input>` field for the preferred time. The user can type any value. The onboarding flow uses fixed toggle buttons (Morning, Afternoon, Evening, Anytime) for the same field.

## Root Cause

The `EditRoutineScreen` component was built with a generic `<Input>` for the preferred time field. The onboarding `OptionalScheduleScreen` uses a `TIME_OPTIONS` array rendered as toggle buttons. The edit screen did not replicate this pattern.

## Affected File

`src/screens/EditRoutineScreen.tsx` — the "Preferred time (optional)" section.

## Fix

1. Add a `TIME_OPTIONS` constant (`['Morning', 'Afternoon', 'Evening', 'Anytime']`) matching the onboarding screen.
2. Replace the `<Input>` with toggle buttons that use `aria-pressed` for accessibility.
3. Clicking a selected button deselects it (sets `preferredTime` to `''`).
4. Clicking an unselected button selects it (sets `preferredTime` to that option).
5. Test IDs follow the pattern `edit-time-{morning|afternoon|evening|anytime}`.

## Tests Added

5 new tests in `EditRoutineScreen.test.tsx`:

1. Renders all four time option buttons.
2. No button is selected when the routine has no `preferredTime`.
3. Pre-selects the correct button when the routine has a `preferredTime`.
4. Clicking a button selects it and the value is saved to the store.
5. Clicking a selected button deselects it and the value is cleared.

## Verification

All tests pass. TypeScript compiles cleanly.
