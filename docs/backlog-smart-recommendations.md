# Backlog: Smart Activity Recommendations on Today Screen

**Date:** 8 October 2026
**Status:** Proposed
**Priority:** Medium
**Type:** Feature

## Summary

Add a summarized feedback section to the Today screen that learns from the user's patterns and recommends what to focus on today. The recommendations appear above the activity list as short, actionable nudges.

## Problem

The Today screen shows activities in a fixed sort order (preferredTime → duration → completion). It does not account for the user's recent behavior. A user who missed "Reading" three days in a row sees it in the same position as a user who has been consistent. There is no signal that says "this one needs attention."

## Proposed Behavior

A small section below the daily completion summary and above the activity list. Shows 1-2 short recommendations based on pattern analysis. Hidden when there is nothing useful to say.

### Example Recommendations

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
- Do not show recommendations for activities already completed today.
- Do not show recommendations when the user has no session history (first day).
- Recommendations should be constructive, not punitive. Frame missed activities as opportunities, not failures.
- Do not reorder the activity list based on recommendations. The recommendation section is informational. The sort order stays consistent.

## Data Sources

All data is already available in localStorage:
- `sessions[]` — when each activity was last completed
- `routines[].activities[]` — scheduled days and preferred times
- Current date and day of week

No new data model fields are needed. The analysis is pure computation over existing session history.

## Suggested Implementation

1. Create a `useRecommendations(routines, sessions, today)` hook that returns `{ text: string; activityId: string }[]`.
2. The hook runs pattern detection functions:
   - `missedYesterday(activity, sessions)` — was this activity scheduled yesterday but not logged?
   - `consecutiveMissedDays(activity, sessions)` — how many consecutive scheduled days were missed?
   - `longestGap(activity, sessions)` — which activity has the longest gap since last session?
   - `timePatterns(activity, sessions)` — does the user consistently log at a specific time of day?
3. Render the recommendations as a compact list between the completion summary and the activity cards.
4. Each recommendation is a plain text line with the activity icon and a muted style.

## Out of Scope

- Machine learning or external APIs. All analysis is local pattern matching.
- Reordering the activity list based on recommendations.
- Push notifications tied to recommendations (the Remind button already handles reminders).
- Multi-week trend analysis (that belongs on the Progress screen).

## Acceptance Criteria

- [ ] Recommendations appear on the Today screen when patterns are detected.
- [ ] A maximum of 2 recommendations are shown.
- [ ] No recommendations appear on the first day (no history).
- [ ] No recommendations appear for completed activities.
- [ ] Recommendations are constructive in tone.
- [ ] The feature has no effect on existing tests (additive only).
- [ ] The recommendation logic has its own unit tests.
