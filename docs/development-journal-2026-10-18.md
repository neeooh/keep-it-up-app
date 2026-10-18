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
