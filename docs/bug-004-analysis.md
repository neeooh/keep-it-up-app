# BUG-004 Analysis: Strength exercise builder missing weight input

## Problem

The "What does your workout include?" screen (onboarding step 3) lets the user add exercises with Sets and Reps inputs per row. There is no Weight input. The MVP spec (section 8) defines strength activities as "Sets + Reps + Weight", and the active session screen already records weight per set. The onboarding configuration does not let the user set a target weight.

## Root Cause

The `ExerciseRow` interface in `ConfigureActivityScreen.tsx` only defines `id`, `name`, `sets`, and `reps`. No `weight` field exists. The `ExerciseRowField` component renders two input columns (Sets and Reps) inside a flex container. The initial state and `addExercise` function create rows without a weight property.

The domain types already support weight (`MeasurementType` includes `'weight'`, `SetResult` has `weight?: number`), so the gap is only in the onboarding UI.

## Affected File

`src/screens/onboarding/ConfigureActivityScreen.tsx` — the `ExerciseRow` interface, `ExerciseRowField` component, initial state, and `addExercise` function.

## Fix

1. Add `weight: string` to the `ExerciseRow` interface.
2. Add `weight: ''` to the initial exercise row state and the `addExercise` function.
3. Add a third input column (Weight) to `ExerciseRowField` next to Sets and Reps.
   - Label: "Weight (kg)"
   - `type="number"`, `inputMode="decimal"`, `min={0}`, `placeholder="0"`
   - `data-testid="exercise-weight-{index}"`
   - Default unit is kg (no unit selector for MVP).

## Tests Added

3 changes in `ConfigureActivityScreen.test.tsx`:

1. Updated "renders sets and reps inputs on the first row" to also check for `exercise-weight-0`.
2. Added "weight input accepts decimal values" — types "62.5", verifies the value.
3. Added "newly added exercise row also has a weight input" — clicks Add exercise, checks `exercise-weight-1`.

## Verification

All 31 tests pass. TypeScript compiles cleanly.
