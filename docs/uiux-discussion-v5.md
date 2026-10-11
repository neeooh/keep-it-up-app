# UI/UX Discussion v5 — Decisions

**Date:** 11 October 2026

One issue. This document covers the redesign of the delete button on the Edit Routine screen.

---

## FEAT-008: Move delete button away from save on Edit Routine screen

### Problem

The Edit Routine screen has a full-width red "Delete routine" button under a "Danger zone" section header. The fixed footer directly below contains the "Save changes" button. On short screens or after scrolling to the bottom, the destructive delete button and the primary save button sit adjacent to each other. A misclick can open the delete confirmation dialog when the user intends to save.

The confirmation dialog prevents accidental deletion, but the proximity still creates unnecessary anxiety and cognitive load.

### Decision

Replace the "Danger zone" section and its full-width destructive button with a small, low-prominence text link at the bottom of the scrollable form area.

**Before:**
```
[form sections]

DANGER ZONE
[ 🗑 Delete routine ]  ← full-width red button
  This removes the routine...

───────────────────────────
[ Save changes ]
  Cancel
```

**After:**
```
[form sections]

                  ···

  Delete this routine   ← small muted text link, text-sm

───────────────────────────
[ Save changes ]
  Cancel
```

Changes:
- Remove the "Danger zone" SectionHeader.
- Remove the full-width destructive Button.
- Remove the explanatory paragraph below the button.
- Add a small text button at the bottom of the scroll area: "Delete this routine" styled as `text-sm text-destructive` with no background or border.
- Add vertical spacing between the last form section and the delete text link.
- The confirmation dialog stays unchanged. Tapping the text link still opens the "Delete routine?" dialog with Cancel and Delete buttons.

The delete action requires four deliberate steps: scroll past settings → find the small text → tap it → confirm in dialog.
