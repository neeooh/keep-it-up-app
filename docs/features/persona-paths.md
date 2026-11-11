# Feature Spec: Choose Your Path — Persona Class System

Date: 2026-10-18

## Concept

The user picks a persona on first launch. The persona determines their starter routine bundle. This is a one-time identity choice, not a shopping cart. The framing is "who do you want to become?", not "what routines do you want?"

Inspired by RPG class selection: you are a Stoic, a Machine, a Carpenter, or a Lobster. You do not play all four at once.

## Why this matters

1. **Identity over tasks.** "I am on the Stoic path" is more motivating than "I have 4 routines." The user identifies with the persona, not the to-do list.
2. **Constraint creates focus.** Picking one means rejecting three. That makes the choice meaningful and the routine set coherent.
3. **Onboarding speed.** One tap from the welcome screen to a fully configured dashboard. Zero form filling.
4. **Social potential.** "What path are you on?" is shareable. "I track journaling and walking" is not.

## User flow

### First launch

```
Welcome Screen
│
├── "Do something" / "Stop doing something" → existing flow
│
└── "Choose your path" section
    │
    ├── 🏛️ The Stoic
    ├── ✝️ The Carpenter
    ├── 🦞 The Lobster
    └── 💪 The Machine
         │
         ↓ tap one
    Path Preview Screen (new)
    │   Shows: persona name, avatar, motivation quote,
    │   list of activities with descriptions, total time per day.
    │   Two buttons: "This is me" (confirm) / "Go back" (choose again)
    │
    ↓ confirm
    Dashboard (with all activities installed, path badge visible)
```

### Returning user

- The chosen path is stored in preferences (`keep-it-up:preferences` → `chosenPath: 'stoic'`).
- A small badge or label on the dashboard or settings shows the current path.
- The user can add more activities manually via the existing "+" flow. The path does not lock them out.
- "Switch path" is available in settings. It does NOT delete existing routines. It installs the new path's activities (with deduplication) and updates the badge.

## The four paths

### 🏛️ The Stoic
**Philosophy:** Inner discipline through daily practice.
**Quote:** "You have power over your mind, not outside events."
**Activities:**
| Activity | Time | Description |
|---|---|---|
| Morning journaling | 10 min, daily, morning | Write 3 things on your mind |
| Reading | 20 min, daily, evening | A few pages of something meaningful |
| Walking | 30 min, daily, morning | Move your body, clear your mind |
| Evening reflection | 10 min, daily, evening | What went well today? |

**Total daily commitment:** ~70 minutes.

### ✝️ The Carpenter
**Philosophy:** Service, stillness, and gratitude.
**Quote:** "Love your neighbour as yourself. Start with showing up for your own life."
**Activities:**
| Activity | Time | Description |
|---|---|---|
| Prayer or meditation | 15 min, daily, morning | Be still and listen |
| Gratitude journaling | 10 min, daily, evening | Write 3 things you are thankful for |
| Act of kindness | 1× daily | One deliberate act for someone else |
| Walking in nature | 20 min, 3×/week | Step outside and be present |

**Total daily commitment:** ~35 minutes (+ kindness).

### 🦞 The Lobster
**Philosophy:** Order, responsibility, and meaning.
**Quote:** "Compare yourself to who you were yesterday, not to who someone else is today."
**Activities:**
| Activity | Time | Description |
|---|---|---|
| Clean your room | 15 min, daily, morning | 15 minutes. One area. Start small. |
| Reading | 30 min, daily, evening | Something that challenges your thinking |
| Journaling | 15 min, daily, evening | Write honestly about what matters |
| No unnecessary spending | daily (AVOID) | Ask: do I need this or want this? |

**Total daily commitment:** ~60 minutes.

### 💪 The Machine
**Philosophy:** Physical mastery, no excuses.
**Quote:** "The mind is the limit. As long as the mind can envision that you can do something, you can do it."
**Activities:**
| Activity | Time | Description |
|---|---|---|
| Strength workout | sets/reps, Mon–Sat | Push yourself. Log every set. |
| Cardio | 30 min, Tue/Thu/Sat | 30 minutes. No shortcuts. |
| No fast food | daily (AVOID) | Fuel your body, not your cravings |

**Total daily commitment:** ~60-90 minutes (training days).

## Path preview screen (new)

A dedicated screen shown after tapping a persona card. Purpose: let the user see exactly what they are signing up for before committing.

**Layout:**
```
← Back

[large emoji]
The Stoic
"You have power over your mind, not outside events."

Daily commitment: ~70 min

┌──────────────────────────────────┐
│ ☀️ Morning                       │
│   Morning journaling · 10 min   │
│   "Write 3 things on your mind" │
│                                  │
│   Walking · 30 min               │
│   "Move your body, clear mind"   │
│                                  │
│ 🌙 Evening                       │
│   Reading · 20 min               │
│   "A few pages of something..."  │
│                                  │
│   Evening reflection · 10 min    │
│   "What went well today?"        │
└──────────────────────────────────┘

[ This is me ]     ← primary CTA
```

## Progression system (future)

### Streaks unlock cross-path activities

After a 30-day streak on your path, you can "discover" one activity from another path. This is the RPG prestige mechanic.

Example: A Stoic with a 30-day streak gets offered "Would you like to add Strength workout from The Machine path?"

This encourages consistency (you need to earn it) and organic growth (your routine expands naturally).

### Path evolution

After 90 days, the user could "evolve" their path. The Stoic becomes The Sage (adds meditation). The Machine becomes The Titan (adds meal prep). New activities unlock as rewards for sustained commitment.

### Seasonal paths

Limited-time paths tied to seasons or events. "The New Year Reset" (January), "The Summer Body" (May), "The Gratitude Month" (November). Creates urgency and freshness.

## Revenue angles

| Tier | Content | Price |
|---|---|---|
| Free | 4 classic paths (Stoic, Carpenter, Lobster, Machine) | Free |
| Premium paths | Huberman Protocol, Goggins Mode, Miyamoto Musashi, etc. | Subscription |
| Partner paths | Official influencer-branded paths (revenue share) | Subscription |
| Path evolution | Prestige unlocks, seasonal paths | Subscription perk |

## Implementation plan

### Phase 1 — MVP (small, now)
- [x] Persona presets exist and install (done)
- [x] Deduplication on install (done)
- [x] Activity descriptions/tips (done)
- [ ] Path preview screen (new screen, show activities before confirm)
- [ ] Store chosen path in preferences
- [ ] Show path badge on dashboard ("🏛️ The Stoic" in header)
- [ ] Single-select: after choosing a path, grey out others (with "Switch path" escape)

### Phase 2 — Polish
- [ ] Path preview shows daily time commitment
- [ ] Activities grouped by morning/evening in preview
- [ ] "Switch path" flow in settings
- [ ] Path shown in data export

### Phase 3 — Growth
- [ ] Streak-based cross-path unlocks
- [ ] Path evolution at 90 days
- [ ] More paths (5-10 total)
- [ ] Backend for dynamic path delivery

### Phase 4 — Revenue
- [ ] Premium paths behind subscription
- [ ] Partner/influencer path program
- [ ] Seasonal limited-time paths

## Data model changes

```typescript
// In preferences (keep-it-up:preferences)
interface Preferences {
  userName: string
  chosenPath?: string  // preset id: 'stoic' | 'jesus' | 'peterson' | 'arnold'
}

// No changes to Routine or Activity types needed.
// The path is a preference, not a domain concept.
// Activities created by a path are normal routines.
```

## Open questions

1. **Can the user modify a path's activities after install?** Yes. The path installs normal routines. The user can edit, delete, or add to them. The path badge is cosmetic.

2. **What happens if the user deletes all path activities?** The badge remains but feels hollow. Option: remove the badge if no path activities remain. Or keep it as "origin story."

3. **Should the path appear on the welcome screen or a separate screen?** Current: welcome screen (horizontal scroll). Proposed: keep on welcome screen but add tap → preview → confirm flow instead of instant install.

4. **Multiple paths?** Phase 1: one at a time. Phase 3: allow mixing via cross-path unlocks.
