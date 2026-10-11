# UI/UX Discussion v6 — Decisions

**Date:** 11 October 2026

One feature. This document covers the redesign of Today screen activity cards from button-based to tappable cards.

---

## FEAT-009: Tappable activity cards on Today screen

### Problem

Every incomplete activity card on the Today screen has two buttons: a filled orange "Log" button (50% width) and a grey outline "Remind" button (50% width). When 4–5 cards stack vertically, the screen shows a wall of identical orange rectangles in the left column and grey rectangles in the right column. Every card has the same visual weight, the same layout, the same proportions. The repetition creates visual monotony and the buttons become wallpaper.

The Log button is redundant. The card represents the activity. Tapping the card should log the activity. A button inside a card that says "Log this card" adds a layer of indirection.

### Options considered

- **A.** Make Log full-width, shrink Remind to an icon-only button. Cheapest change. Still has a button on every card.
- **B.** Remove Remind from the card entirely. Clean but hides a useful feature.
- **C.** Make the entire card tappable for Log. Move Remind to a three-dot overflow menu. The card becomes a clean tappable surface.
- **D.** Replace buttons with text links. Lighter but less interactive-looking.

### Decision

Option C. The card itself is the primary action.

### Incomplete card design

```
┌─────────────────────────────────────┐
│ [icon]  Stretching              ··· │
│         5 min target                │
└─────────────────────────────────────┘
```

- The entire card is tappable. Tapping calls `onStartSession(routineId)`.
- The card uses a hover/pressed state to communicate interactivity.
- A three-dot overflow button (···) in the top-right corner opens a menu with Remind options.
- The overflow button stops event propagation so it does not trigger the card tap.
- No filled buttons on the card.

### Completed card design

```
┌─────────────────────────────────────┐
│ [icon]  Stretching          ✓ Done  │
│         5 min · +10% vs last        │
│                                     │
│         Log again                   │
└─────────────────────────────────────┘
```

- Completed cards are not tappable (the primary action is done).
- "Log again" stays as a small text link for repeat logging.
- The two-button row (Completed badge + Log again button) is replaced by a compact layout: a "Done" badge inline with the name, and a "Log again" text link below the measurements.

### Remind feature

Remind moves into the overflow menu (···). The menu structure stays the same: 15 min, 30 min, 45 min, 1 hour, 2 hours, 4 hours, This evening. Permission handling and confirmation toast are unchanged.

### Rationale

The Today screen's job is to show what needs doing and let the user tap through activities quickly. With 3–7 activities per day, removing one tap per activity (card tap vs find-and-tap-button) saves meaningful interaction cost. The card-as-action pattern is standard in task/checklist apps.
