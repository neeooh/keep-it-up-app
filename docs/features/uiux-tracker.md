# UI/UX Feature and Bug Tracker

Consolidated from six discussion documents (v2–v7), dated 11 October 2026.
All items in this file are implemented in the current version of the app.

## Summary

| ID | Title | Status |
|---|---|---|
| FEAT-001 | Remove edit icon from Today cards | ✅ Done |
| FEAT-002 | Add Plan tab | ✅ Done |
| FEAT-003 | Add Tomorrow preview to Today screen | ✅ Done |
| FEAT-004 | Show primary target on Today card subtitle | ✅ Done |
| FEAT-005 | Add past-day logging (last 7 days) | ✅ Done |
| BUG-005 | Strength workout name overwrite in EditRoutineScreen | ✅ Fixed |
| BUG-006 | Missed-yesterday banner on first app open | ✅ Fixed |
| FEAT-006 | Move Review into Progress screen | ✅ Done |
| FEAT-007 | Replace Morning/Evening templates with time-of-day grouping | ✅ Done |
| FEAT-008 | Move delete button away from save on Edit Routine screen | ✅ Done |
| FEAT-009 | Tappable activity cards on Today screen | ✅ Done |
| FEAT-010 | Today screen engagement improvements | ✅ Done |

---

## v2 — 11 October 2026

### FEAT-001: Remove edit (pencil) icon from Today cards

**Problem**

Each activity card on the Today screen has a pencil icon. The icon opens the Edit Routine screen, which edits the entire routine (name, frequency, schedule). The user expects the pencil to edit the specific card or activity, not the routine. The mismatch is confusing.

For single-activity routines, the distinction between "routine" and "activity" does not exist from the user's perspective. For multi-activity routines (strength workout with 3 exercises), the pencil opens a screen that cannot edit individual exercises at all.

**Decision**

Remove the pencil icon from Today cards. The Today screen is a focused daily action list. Configuration belongs on the Plan tab (FEAT-002).

Default targets and measurement settings belong on the Edit Routine screen. For strength exercises, the Edit Routine screen can support a "progressive overload" setting that adds extra weight to the last completed value.

---

### FEAT-002: Add Plan tab

**Problem**

There is no central place to see all routines the user tracks. The only way to reach the Edit Routine screen is through the pencil icon on a Today card. If the pencil is removed (FEAT-001), there is no entry point. The user also cannot see routines that are not scheduled for today.

**Decision**

Add a "Plan" tab as the 5th navigation item.

**Plan tab structure**

Summary stats (top):

```
3 routines · 12 sessions/week
```

Two numbers. "Sessions/week" is the total weekly commitment across all routines, derived from frequency settings (daily = 7, 3x_week = 3, etc., summed).

Weekly grid — a compact dot grid. Each row is a routine. Each column is a day of the week. A filled dot means the routine is scheduled for that day.

```
              Mon  Tue  Wed  Thu  Fri  Sat  Sun
Strength       ●              ●              ●
Reading        ●    ●    ●    ●    ●    ●    ●
No smoking     ●    ●    ●    ●    ●    ●    ●
Running                                          any day
              ─── ──── ──── ──── ──── ──── ────
               2    1    2    1    1    1    2
```

Routine list — each routine as a tappable card showing: activity icon + routine name, frequency + scheduled days + preferred time, challenge progress bar (if active). Tap opens Edit Routine screen.

Add routine button at the bottom.

---

### FEAT-003: Add Tomorrow preview to Today screen

**Problem**

The user can only see what to do today. After completing all activities, there is no way to see what is coming tomorrow.

**Decision**

A compact line at the bottom of the Today screen:

```
TOMORROW
Running, Meditation · 2 activities
```

Rules:
- Shows only when tomorrow has scheduled activities.
- Hidden when tomorrow has nothing scheduled.
- Hidden during onboarding (no routines yet).
- Only includes routines with explicit day scheduling or daily frequency.
- Routines with no scheduled days and non-daily frequency are omitted.
- Informational only. No action buttons.

---

### FEAT-004: Show primary target on Today card subtitle

**Problem**

The Today card subtitle shows "~30 min" for activities with a duration target. This is ambiguous. For activities with multiple measurements, showing both values on one line reads as a compound goal instead of two independent targets.

**Decision**

Show the primary measurement target only. One number, one meaning.

Priority order for the primary measurement: distance > quantity > duration > weight.

Examples:

```
Running
5 km target

Reading
20 min target

Strength workout
Bench Press, Squat, Deadlift

No smoking
(no subtitle)
```

For multi-measurement activities, only the primary measurement appears on the Today card. All measurements are visible during session logging.

---

### FEAT-005: Add past-day logging (last 7 days)

**Problem**

If the user forgets to open the app, there is no way to record activities for past days. The day shows as missed permanently, even if the user did the activity.

**Decision**

Allow logging for the last 7 days. Two entry points:

1. A date selector at the top of the active session screen. Defaults to today. Shows the last 7 days as a list (Today, Yesterday, Fri 9 Oct, etc.). The session saves with the selected date in `completedAt`.
2. The "Missed yesterday?" banner becomes actionable. Tapping it opens the session flow with yesterday pre-selected.

No new screens needed. The existing session logging flow is reused with one added control.

---

### BUG-005: Strength workout name overwrite in EditRoutineScreen

**Problem**

`handleSave()` in EditRoutineScreen applies the routine name to every activity. For a strength workout with activities named "Bench Press", "Squat", and "Deadlift", saving with name "Strength workout" overwrites all three activity names.

**Fix**

Update `handleSave()` to set only `routine.name`, not individual activity names. Activity names stay as they are.

---

### BUG-006: Missed-yesterday banner on first app open

**Problem**

The "Missed yesterday?" banner appears when the user opens the app for the first time, immediately after creating a routine. The routine did not exist yesterday.

**Fix**

Three guards:

1. If `sessions.length === 0`, do not show the banner.
2. If `routine.createdAt` is today or yesterday, do not show the banner.
3. Routines with no scheduled days and non-daily frequency are not considered "scheduled yesterday."

---

## v3 — 11 October 2026

### FEAT-006: Move Review into Progress screen

**Problem**

The bottom navigation has 5 tabs. The Review tab is empty for the first week of use. Review and Progress overlap conceptually.

**Decision**

Remove the Review tab. The bottom nav becomes 4 tabs: Today, Plan, Progress, History.

The Progress screen gets a "Weekly Review" section with two states:

1. **Countdown state:** a segmented circle (7 segments, one per day) fills as days accumulate. Shows "X of 7 days" and "Review ready in Y days."
2. **Ready state:** shows week date range, completion summary, consistency percentage, and a "Review your week" button.

A "Past reviews" section below lists previous weeks with consistency percentages.

The WeeklyReviewScreen itself does not change. Only its entry point moves.

---

## v4 — 11 October 2026

### FEAT-007: Replace Morning/Evening templates with time-of-day grouping

**Problem**

"Morning routine" and "Evening routine" appear as templates alongside primitive activities. They are containers that produce no measurable data. The app already has preferred-time tagging but does not surface it.

**Decision — three changes:**

1. **Remove Morning routine and Evening routine templates.** The template list contains only primitive, measurable activities.

2. **Add defaultPreferredTime to templates.** Templates that have a natural time association get a default: Stretching (Morning), Yoga (Morning), Meditation (Morning), Journaling (Morning), Go outside (Morning), Reading (Evening).

3. **Add time-of-day section headers to the Today screen.** Cards are grouped by preferred time (Morning, Afternoon, Evening, Anytime). Each group gets an uppercase header. When all activities share one group, no header is shown (flat list preserved).

---

## v5 — 11 October 2026

### FEAT-008: Move delete button away from save on Edit Routine screen

**Problem**

The full-width red "Delete routine" button sits adjacent to the "Save changes" button. A misclick opens the delete dialog when the user intends to save.

**Decision**

Replace the "Danger zone" section with a small, low-prominence text link: "Delete this routine" styled as `text-sm text-destructive` with no background or border.

The confirmation dialog stays unchanged.

---

## v6 — 11 October 2026

### FEAT-009: Tappable activity cards on Today screen

**Problem**

Every incomplete card has a filled "Log" button and a grey "Remind" button. The repetition creates visual monotony and the Log button is redundant — tapping the card should log the activity.

**Decision**

The card itself is the primary action.

**Incomplete card:**
- The entire card is tappable.
- A three-dot overflow button in the top-right corner opens the Remind menu.
- No filled buttons on the card.

**Completed card:**
- Not tappable (primary action is done).
- "Done" badge inline with the name.
- "Log again" text link below the measurements.

---

## v7 — 11 October 2026

### FEAT-010: Today screen engagement improvements

Four changes:

1. **Circular progress ring.** Replace the "X of Y completed" text + thin bar with a circular ring. The count sits inside the ring. When all are complete, the ring shows a check mark and "All done for today."

2. **100% completion message.** "All done for today" inside or below the ring. No confetti, no animation.

3. **Time-of-day greeting.** "Good morning" (before 12:00), "Good afternoon" (12:00–16:59), "Good evening" (17:00+). Replaces the generic "Ready for your first session?" for new users.

4. **Streak / days active counter.** If streak exists: "🔥 X-day streak". If no streak but has history: "Active for X days". If no sessions: not shown. The streak counts calendar days with at least one session. No punitive messaging.

**Constraints:** no motivational quotes, no animations beyond CSS transitions, no gamification elements.
