# BUG-001 Analysis: Adding a second activity

## Problem

After completing the initial onboarding and arriving at the Home screen, clicking the "+" button and adding a new activity does not add it to the "This week" section, Progress, or Review. The newly created routine is lost.

## Root Cause

`useAppStore` (`src/store/useAppStore.ts`) is a plain custom hook built on `useState`. Every component that calls `useAppStore()` gets its own independent state copy. There is no shared state.

The only synchronization mechanism is `localStorage`. The hook reads from `localStorage` on mount (`useState(loadState)`) and writes back via `useEffect`. This creates two problems:

1. **Stale reads.** `useEffect` fires AFTER the render commit. When `App.tsx` calls `addRoutine()` and `navigate('dashboard')` in the same event handler, React batches both state updates into one render. During that render, `DashboardScreen` mounts and its `useState(loadState)` reads `localStorage` — but App's `useEffect` has not saved the new routine yet. The dashboard gets stale data.

2. **Child-first effect ordering.** React fires effects bottom-up. DashboardScreen's `useEffect(() => saveState(state), [state])` fires before App's. The child writes its stale state to `localStorage`, and then App overwrites with the correct data. If the user navigates to a third screen, that screen also reads stale data.

## Affected Files (7 independent store instances)

| File | Uses |
|---|---|
| `App.tsx` | `addRoutine` |
| `DashboardScreen.tsx` | `state` (read) |
| `ActiveSessionScreen.tsx` | `state`, `addSession` |
| `EditRoutineScreen.tsx` | `state`, `updateRoutine`, `deleteRoutine` |
| `WeeklyReviewScreen.tsx` | `state`, `updateRoutine` |
| `HistoryScreen.tsx` | `state` (read) |
| `ProgressScreen.tsx` | `state` (read) |

## Fix

Convert `useAppStore` from a plain `useState` hook into a React Context-based shared store. A single state instance lives at the top of the component tree. All consumers read from the same state via `useContext`.

## Implementation Plan

### Task 1: Create the AppStoreProvider and refactor useAppStore

Convert `src/store/useAppStore.ts` from a standalone `useState` hook into a Context + Provider pattern.

- Create a `React.createContext<AppStore>` in `useAppStore.ts`.
- Add an `AppStoreProvider` component that holds the single `useState(loadState)` and `useEffect` for persistence.
- Rewrite `useAppStore()` to call `useContext(AppStoreContext)` and throw if used outside the provider.
- Keep the `AppStore` interface, `loadState`, `saveState`, `EMPTY_STATE`, and `STORAGE_KEY` exports unchanged.

### Task 2: Wire AppStoreProvider into App.tsx / main.tsx

Mount the provider at the top of the component tree so all screens share one store instance.

### Task 3: Update screen tests to use the provider wrapper

Add a `renderWithStore` helper to `fixtures.ts` that wraps components in `AppStoreProvider`. Update all 6 screen test files.

### Task 4: Add BUG-001 regression test

Add a focused test that adds a routine, navigates to dashboard, adds another routine, and verifies both are visible.
