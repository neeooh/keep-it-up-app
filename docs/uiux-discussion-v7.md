# UI/UX Discussion v7 — Decisions

**Date:** 11 October 2026

Four small engagement improvements to the Today screen.

---

## FEAT-010: Today screen engagement improvements

### 1. Circular progress ring

Replace the "X of Y completed" text + thin horizontal progress bar with a circular progress ring. The count sits inside the ring. The ring fills clockwise using the brand colour as activities are completed.

When all activities are complete, the ring shows a check mark inside and the text changes to "All done for today."

### 2. 100% completion message

When all activities are complete, display "All done for today" inside or below the progress ring. No confetti, no animation. A clear signal of closure.

### 3. Time-of-day greeting

Add a greeting above the date in the header:

- Before 12:00: "Good morning"
- 12:00 to 16:59: "Good afternoon"
- 17:00+: "Good evening"

The date line stays below the greeting. The greeting replaces the generic "Ready for your first session?" for new users.

### 4. Streak / days active counter

Show a small stat below the progress ring:

- If the user has a streak (consecutive days with at least one session): "🔥 X-day streak"
- If no streak but has session history: "Active for X days"
- If no sessions yet: not shown

The streak counts calendar days where at least one session was logged. A day without a session breaks the streak. The counter resets quietly — no punitive messaging.

### Constraints

- No motivational quotes.
- No animations beyond CSS transitions.
- No gamification elements.
- The streak counter is informational, not a scoring mechanism.
