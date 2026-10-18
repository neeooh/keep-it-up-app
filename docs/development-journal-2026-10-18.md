# Development Journal — Session 2026-10-18

This document records the features developed, decisions made, user feedback, and steering during the development session.

## Timeline

### 02:24 — Dark mode toggle

**User request:** Add dark mode with a Sun/Moon toggle icon.

**Discussion:**
- Toggle placement: user chose PageHeader (option A).
- OS preference: user chose to respect OS `prefers-color-scheme` on first visit (option A).
- Meta theme-color: user asked for explanation of what it controls (PWA status bar / browser chrome). After seeing the explanation, chose to update it dynamically to match the theme.

**Decisions:**
- Theme state in its own React Context, separate from domain store.
- Persist in localStorage under `keep-it-up:theme`.
- FOWT prevention via inline script in `index.html`.
- Toggle hidden on onboarding and focused screens (active session, edit routine).
- Dark CSS tokens already existed in `index.css`. No new CSS was needed.

**Outcome:** ThemeProvider, ThemeToggle component, 15 new tests. Documented in `docs/decisions-dark-mode.md`.

### 03:05 — History edit button bug fix

**User report:** Clicking Edit on a history entry navigates to home page instead of allowing edits.

**Root cause:** The Edit button handler was `navigate('dashboard')` — a placeholder that was never replaced with real functionality.

**Fix:**
- Added `updateSession()` to the app store.
- Created `EditSessionDialog` component — a dialog overlay with form fields for all activity types (strength sets, metric inputs, AVOID toggle).
- Replaced `navigate('dashboard')` with dialog open.
- 5 new tests covering all activity types.

### 03:09 — Settings screen with personalized greeting and data export

**User request:** Greet the user by name. Considered a settings page but worried one field is not enough. Suggested adding data export.

**My recommendation:** Settings screen with Profile (name) and Data Export (JSON, CSV, Markdown). Skip PDF and DOCX — they need libraries for marginal value.

**User agreed.** Also asked for Markdown format in the export.

**Decisions:**
- Separate preferences store (`keep-it-up:preferences`) for UI concerns.
- Settings as a full screen (not a dialog) — room to grow, standard cog icon pattern.
- Three export formats: JSON (full backup), CSV (spreadsheet), Markdown (readable).
- No PDF/DOCX — dependency weight not worth it.
- Cog icon in dashboard header.
- Greeting: "Good morning, Alice" when name is set.

**Outcome:** usePreferences hook, SettingsScreen, export functions with 15 tests. Documented in `docs/decisions-settings-export.md`.

### 03:25 — Settings screen UI polish

**User feedback:**
1. Remove the Save button — auto-save the name as the user types.
2. Replace three export buttons with one dropdown + single Export button.

**Reasoning:** Less clutter. The Save button adds unnecessary friction. Three identical-looking buttons are harder to scan than a dropdown.

**Fix:** Debounced auto-save (400ms), single `<select>` + Export button. Net -28 lines of code.

### 03:30 — Welcome screen polish

**User report:** The "What do you want to work on?" screen content sits at the top with empty space below. Wanted to brainstorm improvements.

**Problems identified:**
1. Not vertically centered (CSS `min-h-full` not stretching in flex parent).
2. No visual warmth — all text, no icons.
3. Brand mark too small (tiny uppercase small-caps).
4. Two choice cards look identical — no visual distinction.
5. Same copy for first-use and add-routine contexts.

**User chose:** A (fix centering) + B (add icons) + C (bigger brand) + E (differentiate contexts). Deferred D (illustration/emoji) and F (animation) for later.

**Fix:**
- `flex-1` instead of `min-h-full` for true centering.
- Target icon for DO, ShieldX icon for AVOID, each with subtitle text.
- Brand mark: `text-lg font-bold` (was `text-sm uppercase`).
- First-use: "What do you want to work on?" / Add-routine: "Add a routine".

### 03:48 — Frequency → scheduled days pre-selection bug

**User report:** Whatever frequency the user selects should pre-populate the day buttons on the next screen.

**Root cause:** `onFrequencyChange` only set `frequency` on the draft, not `scheduledDays`.

**Fix:** Frequency change now sets default days:
- daily → Mon–Sun
- 3x_week → Mon, Wed, Fri
- 2x_week → Tue, Thu
- 1x_week → Sat
- flexible → none

### 03:50 — Challenge option icons

**User request:** Add icons to the 30/60/90 day challenge options. Suggested trophy, medals, gold/silver/bronze.

**Implementation:**
- 30 days: bronze Medal icon (#CD7F32)
- 60 days: silver Medal icon (#A0A0A0)
- 90 days: gold Trophy icon (#D4A017)

Visual escalation that communicates increasing commitment.

### 03:56 — Motivation field

**User request:** Let the user specify why they want to do this routine. Will serve as motivation later.

**Discussion:** Brainstormed where to surface the motivation:
- A. Dashboard streak milestone
- B. Active session (before logging) ← **selected**
- C. Weekly review
- D. Progress screen
- E. Re-engagement nudge
- F. Edit routine screen ← **selected**

**User chose B + F.** Most actionable placement (session screen) plus ability to edit (routine editor).

**Decisions:**
- Optional `motivation` field on the Routine type.
- Captured on PlanReviewScreen with "Why does this matter to you?" textarea.
- Displayed on ActiveSessionScreen as a warm card with Flame icon.
- Editable on EditRoutineScreen.
- Renamed "Create my plan" button to "Commit!" with Rocket icon.

### 04:02 — Button text change

**User request:** Change "Create my plan" to "Commit!" with a rocket or start icon.

**Implementation:** Rocket icon + "Commit!" text. Stronger call to action.

### 04:15 — Contextual motivation placeholders

**User feedback:** The placeholder "I want to feel strong and energetic again" does not suit Meditation or Journaling.

**Fix:** Created `motivationPlaceholder()` function that maps each template to a unique placeholder. 18 specific placeholders + keyword-based fallback for custom routines + generic fallback.

Examples:
- Meditation → "I want a calmer mind and less stress"
- Journaling → "I want to understand myself better and process my thoughts"
- No smoking → "I want to breathe freely and protect my health"

### 04:21 — Motivation as predefined badge choices (current)

**User feedback:** Free text forces the user to retype if they like the placeholder. Suggested predefined "positive outcome" badges that the user can tap to select, with a custom free-text option.

**Observation:** All placeholders start with "I want to..." — this becomes the badge pattern.

**Status:** Implementing now.

## Patterns observed

1. **User steers by feel.** Features start as vague ideas ("greet the user by name") and get refined through discussion. The user trusts the technical recommendation and adjusts the scope.

2. **Polish follows function.** The user builds the feature first, then comes back to refine the UX (Settings Save button → auto-save, three export buttons → dropdown, placeholder text → badge choices).

3. **Small details matter.** The user notices mismatches (placeholder text not matching the activity) and cares about the first impression (Welcome screen centering and warmth).

4. **Git discipline.** The user wants feature branches, clean merges, and documented decisions. Not just working code — traceable development history.

### 04:27 — Shorter inline motivation badges

**User feedback:** Badge text is too long. Should be short positive-outcome words, not full sentences. Layout should be inline wrapping, not vertical stack. Fill 2-3 lines maximum.

**Fix:**
- Shortened all badge text to 2-4 words: "Feel strong", "Calm mind", "Breathe free".
- 4 options per template (up from 3) to fill the space.
- Changed layout from `flex-col` to `flex-wrap` with `rounded-full` pill styling.
- Renamed "Write my own" to "Custom".

### 04:36 — Multi-select badges + emotional custom text

**User feedback:** Three refinements in one:
1. Users should select multiple badges, not just one.
2. The "Custom" option should not be a badge toggle. It should be a separate, always-visible textarea for raw emotional free text.
3. The placeholder text should be deeply human and vulnerable — imagine psychological pain and the desire to change.

**User also requested:** Rename button to something warmer than "Commit!". Save all decisions and steering to disk.

**My response:** Proposed "I'm ready" + Rocket icon as the button text. Proposed combined storage format: "Badge1 · Badge2 — personal note". Proposed emotionalPlaceholder() with 18 deeply honest placeholders.

**Implementation:**
- Multi-select: tapping badges toggles them independently. Multiple can be active.
- Separate emotional section with Heart icon: "What is really driving you?"
- Placeholders like "My mind will not stop and I need to find some peace" (meditation) and "I am scared of what this is doing to me" (no smoking).
- Combined motivation stored as single string: badges joined with " · ", custom note after " — ".
- Both PlanReviewScreen and EditRoutineScreen parse the combined string back into badges + note on mount.
- Button renamed from "Commit!" to "I'm ready" with Rocket icon.

**Steering pattern:** The user refined the motivation feature across 4 iterations in ~20 minutes:
1. Free text textarea → too much friction
2. Single-select badges → user cannot like the placeholder text
3. Short inline multi-select pills → almost there
4. Multi-select + separate emotional text → final form

Each iteration was a small, precise correction. The user knew what felt wrong before knowing the exact solution. The conversation was a discovery process, not a specification handoff.

### 04:46–05:01 — Motivation pills: iterated and removed

**04:46 — Custom badge input idea.** User asked about adding a custom badge input to the pill row. I advised against it — two typing surfaces (custom badge + emotional textarea) creates a UX decision nobody wants to make. User agreed to skip.

**04:49 — More pills, limit to 3.** User wanted pills to fill two full rows (no wrapping to third). Expanded to 7 pills per template, capped selection at 3. Added dimming on unselected pills when at capacity.

**04:53 — Tighter padding.** Still wrapping to 3 rows. Reduced `px-3.5` to `px-2.5` and `gap-1.5` to `gap-1`.

**04:55 — Still 3 rows. User questioned the feature.** Asked if the pills are even useful or just unnecessary mental exercise.

**My honest assessment:** The pills are overthought. Generic outcomes like "Feel strong" and "More energy" do not tell the user something they do not already know. The emotional textarea is the stronger feature — personal, unique, impossible to capture with predefined options.

**Decision: remove pills entirely from PlanReview and EditRoutine.** Keep only the emotional textarea with Heart icon.

**04:58 — Pills relocated to session logging (future feature).** User had the insight that feeling pills belong on the log-activity screen, not the planning screen. After completing a run, the user taps "Felt free" or "Felt energised". This becomes visible in history and progress.

**This is a better design because:**
1. The user is in the moment (just finished the activity).
2. It is a micro-reflection, not a planning exercise.
3. Over time, the data reveals emotional patterns ("You felt energised in 8 of your last 10 runs").

**Decision: document as a planned future feature. Do not implement now — it touches Session data model, ActiveSessionScreen, HistoryScreen, and ProgressScreen. Deserves its own focused session.**

## Planned Features (Backlog)

### Session feeling pills

**Concept:** After logging measurements for an activity, the user can tap 1-3 short feeling pills that describe how the session made them feel. Examples: "Felt strong", "Enjoyed it", "Felt free", "Struggled", "Low energy".

**Where it shows up:**
- **ActiveSessionScreen** — pill row after measurements, before the Log button.
- **HistoryScreen** — feeling pills displayed alongside measurements in each session entry.
- **ProgressScreen** — aggregate emotional patterns over time ("Felt energised in 8 of 10 runs").

**Data model change:** Add `feelings?: string[]` to `ActivityResult` in the Session type.

**Status:** Documented. Not yet implemented.

### Celebrity / Influencer Routine Presets

**Origin:** User feedback that the template list felt impersonal. Led to the idea of presets based on real people.

**Concept:** Pre-built routine bundles inspired by famous people. The user picks a persona and gets a complete routine pre-configured — activities, frequencies, measurements, and a motivation quote attributed to the source.

**Examples:**
- **Marcus Aurelius** — Morning journaling (10 min daily), Evening reflection (10 min daily), Walking (30 min daily). Motivation: "You have power over your mind, not outside events."
- **Arnold Schwarzenegger** — Strength workout (6×/week), Cardio (3×/week). Motivation: "The mind is the limit."
- **Jordan Peterson** — Clean your room (daily), Reading (30 min daily), Journaling (daily). Motivation: "Compare yourself to who you were yesterday."
- **Andrew Huberman** — Morning sunlight (10 min daily), Cold exposure (3×/week), Meditation (10 min daily).
- **Stoic starter** — Journaling, Meditation, Walking, Reading. A philosophical daily practice.
- **Couch to 5K** — Progressive running plan (3×/week, distance increases weekly).

**Revenue potential:**
- Free tier: 3-5 classic presets (Stoic, Minimalist, Basic fitness).
- Premium tier: influencer-branded presets, unlocked via subscription or one-time purchase.
- Partnership tier: official presets co-created with influencers (revenue share).

**Implementation notes:**
- Each preset is a complete Routine object (multiple activities, schedule, motivation).
- New screen: "Browse presets" accessible from the activity selection screen.
- Presets could be fetched from a backend (future) or bundled as JSON (MVP).
- Requires careful IP/likeness handling — public-domain figures (philosophers) are safe. Modern influencers need licensing or careful attribution.

**Status:** Backlog. Documented for future consideration. Requires backend for scalable delivery and potential monetisation.
