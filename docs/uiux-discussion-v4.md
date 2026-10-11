# UI/UX Discussion v4 — Decisions

**Date:** 11 October 2026

One feature with three sub-parts. This document covers the removal of Morning/Evening routine templates and the addition of time-of-day grouping on the Today screen.

---

## FEAT-007: Replace Morning/Evening routine templates with time-of-day grouping

### Problem

"Morning routine" and "Evening routine" appear as templates alongside primitive activities like Running, Walking, and Meditation. But they are fundamentally different:

- **Running** is atomic. You run. You measure distance and time. The data is meaningful.
- **Morning routine** is a container. It tells the app nothing about what happens inside it. Logging "25 min morning routine" produces a number with no insight.

The user cannot track improvement per component (Stretching improved but Journaling did not) because the app treats the whole routine as one opaque activity.

Meanwhile, the app already has the building blocks for morning/evening routines. Activities can be tagged with a preferred time (Morning, Afternoon, Evening). The Today screen already sorts by preferred time. The structure exists — the app just does not surface it.

### Decision

Three changes:

### 1. Remove Morning routine and Evening routine templates

The template list should contain only primitive, measurable activities. Containers do not belong.

**Before (daily life category):**
- Morning routine
- Evening routine
- Go outside

**After (daily life category):**
- Go outside

The user can still create a custom activity called "Morning routine" through "Something else" if they want. But the app does not suggest it.

### 2. Add defaultPreferredTime to templates

Add a `defaultPreferredTime` field to the `ActivityTemplate` type. Templates that have a natural time-of-day association get a default:

| Template | Default preferred time |
|---|---|
| Stretching | Morning |
| Yoga | Morning |
| Meditation | Morning |
| Journaling | Morning |
| Go outside | Morning |
| Reading | Evening |

All other templates: no default (the user picks or leaves it as Anytime).

When the user selects a template during onboarding, `defaultPreferredTime` is applied to the draft alongside `defaultFrequency` and `defaultMeasurements`. The user can change it in the optional schedule step.

### 3. Add time-of-day section headers to the Today screen

The Today screen currently shows a flat list of activity cards sorted by preferred time. Add visual group headers based on preferred time:

```
MORNING
  ○ Stretching          5 min target
  ○ Meditation         10 min target
  ○ Journaling         15 min target

EVENING
  ○ Reading            20 min target

ANYTIME
  ○ Running             5 km target
```

Grouping rules:
- Cards are grouped by their preferred time value (Morning, Afternoon, Evening, or empty/Anytime).
- Each group gets a section header. The header only appears when there are cards in that group.
- Within each group, the existing sort order applies (duration ascending, then creation order).
- If all activities have the same preferred time (or none), a single header appears. This avoids a visual change for users who do not use preferred time.
- The "Anytime" header only appears when other time groups also exist. If all activities are untagged, no header is shown (the current flat-list behavior is preserved).

### What this does NOT require

- No new data model. The `preferredTime` field already exists on Activity.
- No new screen. The onboarding flow already has a time preference step.
- No "routine builder" or sub-activity system. Each activity remains standalone.

### What if the user does not assign time preferences?

Activities fall into the "Anytime" group. No group headers appear (the flat list looks the same as before). The grouping is additive — it improves the experience for users who tag activities, and changes nothing for those who do not.
