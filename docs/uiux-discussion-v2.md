# UI/UX Discussion v2 — Decisions

**Date:** 11 October 2026

Six issues were identified and discussed. Each section documents the problem, options considered, and the final decision.

---

## FEAT-001: Remove edit (pencil) icon from Today cards

### Problem

Each activity card on the Today screen has a pencil icon. The icon opens the Edit Routine screen, which edits the entire routine (name, frequency, schedule). The user expects the pencil to edit the specific card or activity, not the routine. The mismatch is confusing.

For single-activity routines, the distinction between "routine" and "activity" does not exist from the user's perspective. For multi-activity routines (strength workout with 3 exercises), the pencil opens a screen that cannot edit individual exercises at all.

### Options considered

- **A.** Keep edit on the card, fix the scope to match user expectation.
- **B.** Move edit off the card. Add a separate routine management entry point.
- **C.** Two levels of editing: card-level for activity, separate screen for routine settings.

### Decision

Remove the pencil icon from Today cards. The Today screen is a focused daily action list. Configuration belongs on the Plan tab (FEAT-002).

Default targets and measurement settings belong on the Edit Routine screen. For strength exercises, the Edit Routine screen can support a "progressive overload" setting that adds extra weight to the last completed value.

---

## FEAT-002: Add Plan tab

### Problem

There is no central place to see all routines the user tracks. The only way to reach the Edit Routine screen is through the pencil icon on a Today card. If the pencil is removed (FEAT-001), there is no entry point. The user also cannot see routines that are not scheduled for today.

### Options considered

- **A.** Add a 5th bottom nav tab: "Plan."
- **B.** Add a routines list accessible from the Today screen header.
- **C.** Put routine management inside the Review tab.

### Decision

Add a "Plan" tab as the 5th navigation item.

### Plan tab structure

**Summary stats (top)**

```
3 routines · 12 sessions/week
```

Two numbers. "Sessions/week" is the total weekly commitment across all routines, derived from frequency settings (daily = 7, 3x_week = 3, etc., summed). This makes the user's total commitment visible.

Routines and challenges are not shown as separate counts. A challenge is a mode on a routine (an optional deadline), not a separate entity. Challenge progress appears on each routine card.

**Weekly grid**

A compact dot grid. Each row is a routine. Each column is a day of the week. A filled dot means the routine is scheduled for that day.

```
              Mon  Tue  Wed  Thu  Fri  Sat  Sun
Strength       ●              ●              ●
Reading        ●    ●    ●    ●    ●    ●    ●
No smoking     ●    ●    ●    ●    ●    ●    ●
Running                                          any day
              ─── ──── ──── ──── ──── ──── ────
               2    1    2    1    1    1    2
```

Routines with no scheduled days appear as a row with no dots. An "any day" label in muted text replaces the dots. The label must fit within the existing grid width — it occupies the space where dots would be. No extra width.

Day totals at the bottom count only routines with assigned days.

**Routine list**

Each routine as a tappable card showing:

- Activity icon + routine name
- Frequency + scheduled days (if set) + preferred time (if set)
- Challenge progress bar and label (if active)
- Tap opens Edit Routine screen

**Add routine button at the bottom.**

---

## FEAT-003: Add Tomorrow preview to Today screen

### Problem

The user can only see what to do today. After finishing all activities, there is no way to see what is coming tomorrow.

### Options considered

- **A.** "Tomorrow" section below today's activities.
- **B.** Swipeable day view (left for tomorrow, next day, etc.).
- **C.** Single compact "Tomorrow" card at the bottom of Today.
- **D.** Multi-day view on the Plan tab only.

### Decision

Combine A and C. A compact line at the bottom of the Today screen:

```
TOMORROW
Running, Meditation · 2 activities
```

Behaviour:

- Shows only when tomorrow has scheduled activities.
- Hidden when tomorrow has nothing scheduled.
- Hidden during onboarding (no routines yet).
- Only includes routines with explicit day scheduling or daily frequency.
- Routines with no scheduled days and non-daily frequency are omitted (the app cannot predict which day the user intends).
- Informational only. No action buttons.

---

## FEAT-004: Show primary target on Today card subtitle

### Problem

The Today card subtitle shows "~30 min" for activities with a duration target. This is ambiguous. For activities with multiple measurements (e.g. Running: 5 km + 30 min), showing both values on one line reads as a compound goal ("run 5 km in 30 minutes") instead of two independent targets.

### Options considered

- **A.** Keep as is, add a "Target:" label.
- **B.** Keep the tilde, accept the ambiguity.
- **C.** Show only the primary measurement with "target" label.
- **D.** Show nothing on the card subtitle.

### Decision

Option C. Show the primary measurement target only. One number, one meaning.

Priority order for selecting the primary measurement: distance > quantity > duration > weight.

Examples:

```
Running
5 km target

Reading
20 min target

Strength workout
Bench Press, Squat, Deadlift

Morning routine
30 min target

No smoking
(no subtitle)
```

For multi-measurement activities, only the primary measurement appears on the Today card. All measurements are visible during session logging.

---

## FEAT-005: Add past-day logging (last 7 days)

### Problem

If the user forgets to open the app, there is no way to record activities for past days. The day shows as missed permanently, even if the user did the activity. This contradicts the core principle "do not punish missed days."

### Options considered

How far back:

- **A.** Yesterday only.
- **B.** Last 7 days.
- **C.** Any past date.

Entry points:

- **1.** From the "Missed yesterday?" banner.
- **2.** Date selector on the active session screen.
- **3.** From the History screen.

### Decision

Allow logging for the last 7 days. Combine entry points 1 and 2.

**Primary entry point:** A date selector at the top of the active session screen. Defaults to today. Shows the last 7 days as a list (Today, Yesterday, Fri 9 Oct, etc.). The session saves with the selected date in `completedAt`.

**Secondary entry point:** The "Missed yesterday?" banner becomes actionable. Tapping it opens the session flow with yesterday pre-selected.

No new screens needed. The existing session logging flow is reused with one added control.

Edge cases:

- Logging a second session for a past day that already has one: allowed (same as "Log again" for today).
- Today card state: logging for yesterday does not mark today as completed. The `completedAt` date determines which day the session belongs to.
- Consistency calculations: existing logic uses `completedAt.slice(0, 10)` and works without changes.

---

## BUG-005: Strength workout name overwrite in EditRoutineScreen

### Problem

`handleSave()` in EditRoutineScreen applies the routine name to every activity:

```ts
activities: routine.activities.map((a) => ({
  ...a,
  name: name.trim() || a.name,
  ...
}))
```

For a strength workout with activities named "Bench Press", "Squat", and "Deadlift", saving with name "Strength workout" overwrites all three activity names to "Strength workout." This is data corruption.

### Decision

Fix `handleSave()` to update only the routine name (`routine.name`), not individual activity names. Activity names stay as they are.

---

## BUG-006: Missed-yesterday banner on first app open

### Problem

The "Missed yesterday?" banner appears when the user opens the app for the first time, immediately after creating a routine. The user has not missed anything — the routine did not exist yesterday.

Root cause in `shouldShowMissedYesterday()`:

```ts
if (!a.scheduledDays || a.scheduledDays.length === 0) return true
```

This treats routines with no scheduled days as "scheduled every day." Combined with zero sessions, the banner always appears for new routines.

### Decision

Three fixes:

1. **Zero sessions guard.** If `sessions.length === 0`, do not show the banner. The user has not started their journey.
2. **Creation date guard.** If `routine.createdAt` is today or yesterday, do not show the banner. The routine did not exist yesterday.
3. **No-days logic fix.** Routines with no scheduled days and non-daily frequency are not considered "scheduled yesterday." Only routines with `frequency === 'daily'` or explicit `scheduledDays` that include yesterday trigger the banner.
