# Feature Backlog

Items proposed but not yet implemented.

---

## Smart Activity Recommendations on Today Screen

**Date:** 8 October 2026
**Priority:** Medium

### Summary

Add a feedback section to the Today screen that learns from the user's patterns and recommends what to focus on today. The recommendations appear above the activity list as short, actionable nudges.

### Problem

The Today screen shows activities in a fixed sort order. It does not account for the user's recent behavior. A user who missed "Reading" three days in a row sees it in the same position as a consistent user. There is no signal that says "this one needs attention."

### Proposed behavior

A small section below the daily completion summary and above the activity list. Shows 1–2 short recommendations based on pattern analysis. Hidden when there is nothing useful to say.

| Pattern detected | Recommendation |
|---|---|
| Missed an activity yesterday | "You skipped Reading yesterday. Start with it today?" |
| Activity missed 3+ days in a row | "Meditation has not been logged since Monday. A short session today can restart the habit." |
| Longest gap for any activity | "Strength workout has the longest gap. Consider doing it first." |
| All activities on track | No recommendation shown. |
| Activity always done at a specific time | "You usually do Journaling in the morning. Good time to start." |
| Completed everything yesterday | "Strong day yesterday. Keep it going." |

### Rules

- Show a maximum of 2 recommendations at a time.
- Do not show recommendations for completed activities.
- Do not show recommendations on the first day (no history).
- Recommendations are constructive, not punitive.
- Do not reorder the activity list. The recommendation section is informational.

### Data sources

All data is already in localStorage: `sessions[]`, `routines[].activities[]`, current date. No new data model fields are needed.

### Suggested implementation

1. Create a `useRecommendations(routines, sessions, today)` hook.
2. Run pattern detection: `missedYesterday()`, `consecutiveMissedDays()`, `longestGap()`, `timePatterns()`.
3. Render recommendations between the completion summary and the activity cards.

### Out of scope

- Machine learning or external APIs.
- Reordering the activity list.
- Push notifications tied to recommendations.
- Multi-week trend analysis (belongs on Progress screen).

---

## Session Feeling Pills

**Date:** 18 October 2026
**Priority:** Low

After logging measurements, the user taps 1–3 short feeling pills that describe how the session made them feel. Examples: "Felt strong", "Enjoyed it", "Felt free", "Struggled", "Low energy".

Surfaces on ActiveSessionScreen, HistoryScreen, and ProgressScreen (aggregate emotional patterns over time).

Data model change: add `feelings?: string[]` to `ActivityResult`.

---

## Path Progression System

**Priority:** Low (Phase 3+)

After a 30-day streak on a persona path, the user can "discover" one activity from another path. After 90 days, the path can "evolve" (The Stoic becomes The Sage). See [persona-paths.md](persona-paths.md) for details.
