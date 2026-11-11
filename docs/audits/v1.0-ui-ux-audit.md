# Keep It Up — UI/UX Audit & Remediation Plan

## Purpose

This document is an implementation-oriented UI/UX audit of the current app screens shown in the supplied user-journey screenshots.

The goal is **not** to make the app prettier for its own sake. The goal is to make the product feel like a deliberate, polished consumer app rather than a collection of shadcn components assembled into screens.

The audit covers:

- visual hierarchy
- spacing and layout
- typography
- component consistency
- navigation
- onboarding
- dashboard
- active sessions
- history
- progress
- weekly review
- routine management
- interaction patterns
- accessibility
- copy/content
- branding
- responsive/mobile behaviour

### Severity

- **P0 — Critical:** materially harms usability, comprehension, or the primary task.
- **P1 — High:** obvious UX/UI problem that should be fixed before calling the UI polished.
- **P2 — Medium:** meaningful inconsistency, friction, or visual-quality issue.
- **P3 — Low:** refinement / polish.

---

# 1. Global design-system problems

## 1.1 P0 — The app has almost no distinctive visual identity

### Problem

The interface is overwhelmingly white, black, grey and very light borders. Apart from small success/progress accents, there is little visual language that makes this feel like a specific product.

It currently looks close to a generic shadcn prototype.

This is especially problematic for an app whose core promise is motivation and consistency. The visual design should communicate momentum, progress and encouragement.

### Fix

Define a small product-specific visual system:

- Primary brand colour.
- Secondary/supporting accent.
- Success colour.
- Warning/destructive colour.
- Neutral surface hierarchy.
- Typography hierarchy.
- Consistent corner radius.
- Consistent border treatment.
- Consistent icon style.
- Consistent button hierarchy.

Do **not** simply add colour everywhere. Use the brand colour strategically for:

- primary actions
- selected states
- progress indicators
- important achievement states
- key navigation state
- positive reinforcement

The UI should remain clean and restrained.

---

## 1.2 P1 — shadcn defaults are too visually prominent

### Problem

Many cards, inputs and buttons look like unmodified/default shadcn components. The result is technically consistent with the library but not necessarily consistent with the product.

A component library should provide primitives, not dictate the final visual identity.

### Fix

Create a small app-level design system on top of shadcn.

Standardise:

- card radius
- input height
- button height
- border colour
- shadow usage
- typography
- spacing
- selected states
- disabled states
- focus states

Prefer a small number of deliberate variants over ad-hoc styling on every page.

---

## 1.3 P1 — Border/card treatment is too repetitive

### Problem

Almost everything appears inside a bordered rounded rectangle.

This creates visual monotony and makes all information appear equally important.

### Fix

Use three levels of containment:

1. **Page-level content** — no card where possible.
2. **Primary content card** — subtle surface/border.
3. **Secondary information** — plain content separated by spacing/dividers.

Do not put every piece of content inside a card.

---

## 1.4 P1 — Too much empty space on several screens

### Problem

History, Progress and parts of onboarding contain very large unused areas.

The empty space does not feel intentional. It makes the application feel unfinished, especially on a mobile-sized viewport.

### Fix

Use responsive content containers with deliberate vertical rhythm.

For sparse states:

- explain what the screen is for
- show useful empty-state content
- show the next action
- show relevant historical/goal context

Do not artificially fill space with decorative UI.

---

## 1.5 P1 — Vertical spacing rhythm is inconsistent

### Problem

The screenshots show several different relationships between:

- page title → subtitle
- section heading → content
- card → card
- label → field
- field → field
- content → primary action

Some areas feel cramped while others have excessive whitespace.

### Fix

Define a spacing scale and use it everywhere.

For example:

- 4px: icon/text micro spacing
- 8px: tightly related elements
- 12px: field internals
- 16px: normal component spacing
- 24px: section spacing
- 32px: major section spacing

Avoid arbitrary one-off margins.

---

## 1.6 P1 — Typography hierarchy is too weak

### Problem

Headings, labels, helper text and secondary text are visually too similar.

Some screens have a large heading followed by tiny/light text, making the information hierarchy difficult to scan.

### Fix

Define explicit text styles:

- Display / page title
- Section title
- Card title
- Body
- Body-small
- Label
- Caption
- Muted/help text

Do not rely only on font size. Use weight, colour and spacing.

---

## 1.7 P1 — Muted text is often too faint

### Problem

Several subtitles, metadata lines and secondary labels have very low contrast.

This is especially noticeable in the onboarding and dashboard screens.

### Fix

Increase contrast for meaningful secondary information.

Use muted text only for genuinely optional/contextual information.

Verify colour contrast against WCAG AA where practical.

---

## 1.8 P2 — Shadows and borders do not establish a clear hierarchy

### Problem

Cards mostly rely on faint borders, while some elements have stronger outlines. The hierarchy is inconsistent.

### Fix

Choose one primary card treatment.

Recommended:

- subtle background/surface distinction
- very subtle border
- minimal shadow, only for elevated/interactive surfaces

Avoid mixing several card styles without a semantic reason.

---

## 1.9 P1 — Interactive and non-interactive elements are visually too similar

### Problem

A static card, selectable option, button-like control and editable field can look very similar.

### Fix

Establish explicit visual states:

- static
- hover
- focus
- selected
- pressed
- disabled
- destructive

Selectable controls should look selectable even before interaction.

---

# 2. Global navigation

## 2.1 P0 — Bottom navigation contains too many destinations

### Problem

The bottom navigation appears to expose several top-level destinations, including Home, History, Progress and Review.

For a small routine-tracking app, this is too much navigation competing for attention.

### Fix

Reduce the primary navigation to the smallest meaningful set.

Recommended structure:

- **Today**
- **History**
- **Progress**
- **Review**

Keep routine/settings management inside Today or a secondary route if it is not a daily destination.

Do not promote every feature to bottom navigation.

---

## 2.2 P1 — Navigation labels/icons are difficult to distinguish at a glance

### Problem

The icons are small and visually similar. The selected/unselected difference is subtle.

### Fix

- Increase icon clarity.
- Use a stronger selected state.
- Keep labels readable.
- Make the active destination unmistakable.
- Ensure touch targets are at least ~44px high.

---

## 2.3 P1 — Navigation hierarchy does not communicate the app's primary job

### Problem

The most important task is completing today's routine, yet the navigation competes visually with the actual daily action.

### Fix

Make **Today/Home** the clear centre of the information architecture.

The primary screen should answer immediately:

> What should I do now?

Everything else should support that question.

---

## 2.4 P2 — Navigation appears visually detached from content

### Problem

The bottom navigation is a generic persistent component rather than something visually integrated with the product.

### Fix

Give it a deliberate treatment:

- consistent surface
- subtle top border
- appropriate safe-area padding
- stronger active state
- consistent icon size

Avoid heavy visual decoration.

---

# 3. Onboarding

## 3.1 P0 — Onboarding asks too much before demonstrating value

### Problem

The onboarding journey contains multiple screens:

1. what do you want to work on?
2. select goal
3. workout details
4. frequency
5. plan

This is a significant amount of setup before the user gets to experience the product.

### Fix

Reduce the setup to the minimum information required to create a useful first routine.

Ideal flow:

1. What do you want to improve?
2. What does success look like?
3. How often?
4. Review your plan
5. Start

Only ask for information that directly affects the generated routine.

---

## 3.2 P1 — The onboarding title repeats the same question

### Problem

Several screens use variations of:

> What do you want to...?

This creates a repetitive questionnaire feeling.

### Fix

Use progressive, contextual headings.

For example:

- **What do you want to improve?**
- **What does success look like?**
- **How often feels realistic?**
- **Here's your plan**

Each heading should explain why the next question matters.

---

## 3.3 P1 — Progress through onboarding is unclear

### Problem

The screenshots do not show a strong indication of where the user is in the process.

A multi-step onboarding flow needs orientation.

### Fix

Add a compact progress indicator:

`1 of 4`

or a subtle segmented progress bar.

Do not use a large stepper that consumes valuable mobile space.

---

## 3.4 P1 — Back navigation is inconsistent/too subtle

### Problem

Back arrows appear on some screens, but the hierarchy is not strongly communicated.

### Fix

Use one consistent onboarding header:

- back button on all non-first steps
- centred/left-aligned step title as appropriate
- progress indicator
- no duplicated page-title treatment

---

## 3.5 P1 — The selectable goal list is too dense

### Problem

The "What do you want to work on?" list contains many options stacked vertically.

It looks like a form rather than a friendly onboarding choice.

### Fix

Use a more scannable selection pattern:

- 2-column grid for short labels, or
- large selectable rows with icon + title + short description

Show selection with a clear filled/outlined state and check indicator.

---

## 3.6 P1 — Selection state is too subtle

### Problem

Selected options are mostly communicated through small changes in border/fill.

### Fix

Selected state should be unmistakable:

- brand-colour border
- subtle brand-colour background
- check icon
- optionally stronger text weight

Do not depend on colour alone.

---

## 3.7 P1 — Input screens mix different interaction patterns

### Problem

Some fields look like text inputs, some like segmented controls, some like cards and some like dropdowns.

There is no obvious common interaction language.

### Fix

Use the right shadcn primitive consistently:

- RadioGroup for one-of-many choices.
- Checkbox for independent selections.
- Select/Combobox for long lists.
- Input for numeric/text values.
- Segmented control for very small mutually exclusive sets.

Do not visually disguise one control as another.

---

## 3.8 P1 — Workout configuration is unnecessarily form-like

### Problem

The workout setup screen appears to expose several low-level fields immediately.

This conflicts with the product's promise of making consistency easier.

### Fix

Use progressive disclosure.

Example:

**Strength workout**

- Exercise
- Sets × reps
- Optional weight

Then allow advanced details through "Edit details".

---

## 3.9 P1 — Numeric inputs lack strong unit hierarchy

### Problem

Values such as sets/reps/weight are difficult to parse because the units compete with the values.

### Fix

Use compact grouped controls:

`3 sets × 10 reps`

`20 kg`

Make the numeric value visually dominant and the unit secondary.

---

## 3.10 P1 — "How often feels realistic?" needs stronger guidance

### Problem

This is actually an important behavioural-design question, but it looks like a generic form field.

### Fix

Make it motivational and practical.

Show options such as:

- Every day
- 3–4 days/week
- 2 days/week
- Once/week

Add a short reassurance:

> Choose what you can realistically keep doing. Consistency beats ambition.

This is core product value, not filler copy.

---

## 3.11 P2 — The final plan screen is too sparse

### Problem

The plan confirmation screen contains little information relative to the importance of the decision.

### Fix

Show a compact plan summary:

- Goal
- Routine name
- Frequency
- Exercises/habits
- Expected session length

Then make the primary action explicit:

**Create my plan**

Secondary action:

**Edit plan**

---

## 3.12 P1 — Primary CTA placement is inconsistent

### Problem

The primary CTA changes position and spacing between onboarding screens.

### Fix

Use a persistent bottom action area:

- full-width primary button
- safe-area padding
- optional secondary action above it

The button should stay in the same visual location throughout onboarding.

---

# 4. Dashboard / Today

## 4.1 P0 — The dashboard does not establish a strong "do this now" hierarchy

### Problem

The home screen contains several cards, but the most important action is not sufficiently dominant.

For a consistency app, the first screen should immediately communicate:

> Here's what you need to do today.

### Fix

Use this hierarchy:

1. Greeting/date
2. Today's status
3. Primary "Start today's routine" action
4. Progress/momentum
5. Secondary information
6. Routine management

---

## 4.2 P1 — "Let's get started" is generic

### Problem

The heading does not communicate the user's actual next action.

### Fix

Use task-oriented copy:

- **Today's routine**
- **Ready for today's workout?**
- **Keep your streak going**
- **One session today**

The heading should reflect current state.

---

## 4.3 P1 — Dashboard cards compete with one another

### Problem

Several cards use similar borders, spacing and typography, so they appear equally important.

### Fix

Create a clear primary card.

Example:

**Today's routine**

`Strength workout`

`3 exercises · ~20 min`

**Start workout**

Then place secondary stats below.

---

## 4.4 P1 — Momentum/progress card is visually weak

### Problem

The "Your momentum" content appears useful but is visually similar to ordinary information.

### Fix

Make momentum a meaningful feedback component:

- large percentage/score
- concise interpretation
- small trend indicator
- supporting metric

Example:

**Momentum**

`84%`

> Up 8% from last week

Avoid overloading it with several tiny statistics.

---

## 4.5 P1 — Success feedback is too generic

### Problem

Completing a routine appears to rely mostly on a button/state change.

### Fix

After completion, provide clear positive feedback:

- completion state
- progress update
- concise encouraging message
- optional next milestone

Avoid gamification clutter.

---

## 4.6 P2 — Dashboard terminology is inconsistent

### Problem

Terms such as:

- routine
- workout
- goal
- momentum
- progress
- review

are all used, but the relationship between them is not always clear.

### Fix

Define the domain vocabulary once and use it consistently.

Recommended model:

- **Goal** = what the user wants to improve/avoid.
- **Routine** = the recurring structure.
- **Session** = today's execution of the routine.
- **Progress** = long-term measurement.
- **Momentum** = current consistency signal.
- **Review** = weekly reflection.

---

# 5. Active session: DO

## 5.1 P0 — The session UI is too dense for an active task

### Problem

During a workout, users should be executing, not reading a spreadsheet.

The current screen contains multiple rows, fields and controls competing for attention.

### Fix

Optimise the screen for fast input:

- exercise name
- current set
- reps/weight
- completion control
- next exercise

Everything else should be secondary.

---

## 5.2 P1 — Current set is not visually dominant

### Problem

The UI does not create a strong visual focal point around the action the user is currently performing.

### Fix

Highlight the current set.

Example:

**Set 2 of 3**

`10 reps`

`20 kg`

**Complete set**

Previous/next controls should be secondary.

---

## 5.3 P1 — Data-entry controls are too small

### Problem

Workout inputs appear compact and desktop-form-like.

This is a poor fit for touch interaction.

### Fix

Use larger touch targets and larger numbers.

Minimum target size should be approximately 44×44px.

---

## 5.4 P1 — Completion CTA is too visually similar to ordinary buttons

### Problem

The main "Complete" action looks like a generic shadcn button.

### Fix

Give the primary session action stronger semantic emphasis.

Use one clear primary CTA:

**Complete set**

Then after the final set:

**Finish workout**

---

## 5.5 P1 — The user cannot easily see how far through the session they are

### Problem

There is little obvious progress information.

### Fix

Add compact progress:

`Exercise 2 of 4`

or

`3 / 4 exercises`

A small progress bar can reinforce this without dominating the UI.

---

# 6. Active session: AVOID

## 6.1 P0 — Avoid goals need a fundamentally different interaction model

### Problem

An "avoid" goal is conceptually different from doing an exercise.

The interface appears to reuse too much of the same structure.

### Fix

Model avoidance as a simple daily check-in:

**Did you avoid [behaviour] today?**

- Yes, I did
- No, I didn't
- Not applicable / skip, if the product requires it

Do not force an avoidance goal into an exercise-style session UI.

---

## 6.2 P1 — Avoid-goal feedback should focus on success/failure, not data entry

### Problem

The current design gives too much attention to form-like controls.

### Fix

Use a large, obvious daily status control.

Example:

`✓ Kept my goal today`

with a secondary option to correct the answer.

---

# 7. History

## 7.1 P0 — History is too empty and uninformative

### Problem

The History screen is essentially a list of small entries with lots of unused space.

It does not feel like a useful record.

### Fix

Use a compact timeline/list:

**Today**
- Strength workout
- Completed
- 18 min

**Yesterday**
- Avoided late-night snacking
- Completed

Group by date.

---

## 7.2 P1 — History entries need clearer information hierarchy

### Problem

The important information is difficult to scan because title, date and result have similar visual weight.

### Fix

Each entry should have:

- primary activity/goal
- completion status
- date/time
- useful summary metric

Use a clear status indicator.

---

## 7.3 P2 — Empty-history state is missing

### Problem

If the user has no history, the screen risks looking broken rather than intentionally empty.

### Fix

Create a proper empty state:

**Your history starts here**

> Complete your first session and you'll see it here.

Primary CTA:

**Start today's routine**

---

# 8. Progress

## 8.1 P0 — Progress screen is too sparse

### Problem

The Progress screen contains a small amount of information surrounded by a large amount of empty space.

It does not feel like a destination worth visiting.

### Fix

Show a small number of meaningful progress indicators:

- current consistency
- best consistency
- completion rate
- goal-specific metric
- trend over time

Use simple visualisations rather than adding lots of statistics.

---

## 8.2 P1 — The "weight" metric appears disconnected from the goal

### Problem

The screen appears to show a weight-related number even though the app supports different goal types.

This creates a conceptual mismatch.

### Fix

Progress must be goal-aware.

For a strength goal:

- sessions completed
- consistency
- volume/reps
- personal best

For an avoidance goal:

- successful days
- completion rate
- longest streak

For another measurable goal:

- use the relevant metric.

Never show irrelevant metrics.

---

## 8.3 P1 — No clear time range/context

### Problem

Progress numbers are hard to interpret without a time range.

### Fix

Provide a compact range selector:

- 7 days
- 30 days
- 90 days

or a simple default such as **Last 30 days**.

---

## 8.4 P2 — Progress lacks trend context

### Problem

A number such as `20%` or a weight value has little meaning by itself.

### Fix

Always answer:

> Is this improving?

Use:

- previous-period comparison
- small trend arrow
- simple line/bar chart where useful

Avoid decorative charts.

---

# 9. Weekly review

## 9.1 P0 — Weekly Review does not look meaningfully different from Progress

### Problem

The Weekly Review screen largely presents another collection of cards and percentages.

The user needs to understand why this screen exists.

### Fix

Make Review explicitly reflective and action-oriented.

Structure:

**Your week**

1. What went well?
2. Where did you struggle?
3. What should change next week?
4. Suggested adjustment
5. Confirm next week's plan

---

## 9.2 P1 — Review content is too verbose inside cards

### Problem

Some cards contain long sentences but have weak typographic hierarchy.

### Fix

Use:

- short heading
- one key metric
- one insight
- optional detail

Example:

**You completed 4 of 5 sessions**

`80% consistency`

> Your strongest day was Tuesday.

---

## 9.3 P1 — Review does not lead naturally to an action

### Problem

The user can read their week but the flow does not strongly connect review → improvement.

### Fix

End with a concrete recommendation:

**Keep the same plan**

or

**Adjust next week**

Then allow direct editing of the routine.

---

## 9.4 P2 — Two screenshots show visually similar weekly-review states without enough differentiation

### Problem

The states shown in the journey do not make the change in weekly status especially obvious.

### Fix

Make state changes visible:

- completed review
- pending review
- improved consistency
- missed target
- next-week recommendation

---

# 10. Routine management

## 10.1 P0 — Routine editing screen is overloaded

### Problem

The edit-routine screen contains many fields, days, categories and options at once.

This creates a large cognitive load.

### Fix

Split the screen into logical sections:

### Routine
- Name
- Goal

### Schedule
- Active days

### Activities
- Exercises/habits

### Advanced
- Optional configuration

Use progressive disclosure for advanced settings.

---

## 10.2 P1 — Days-of-week selection is not sufficiently clear

### Problem

The weekday controls are visually small and the selected state is subtle.

### Fix

Use a compact segmented weekday selector with strong selected state:

`M T W T F S S`

Selected days should have:

- brand background
- high-contrast text
- clear focus state

---

## 10.3 P1 — Schedule and frequency are duplicated concepts

### Problem

The onboarding asks how often the user wants to act, then routine management separately asks for days.

This can feel like entering the same information twice.

### Fix

Onboarding should create the initial schedule.

Routine management should edit it.

Do not ask the same question twice unless the second screen clearly modifies the first.

---

## 10.4 P1 — Destructive actions are too easy to confuse with normal actions

### Problem

The routine editing screen contains destructive-looking indicators/actions near normal controls.

### Fix

Destructive actions should:

- be visually separated
- use destructive colour only where appropriate
- require confirmation
- explain consequences

Example:

**Delete routine**

> This removes the routine and its future schedule. Past history will remain.

---

## 10.5 P1 — Save/cancel behaviour needs stronger consistency

### Problem

The screenshots show different action placement and naming patterns such as Save/Continue/Create.

### Fix

Standardise action semantics:

- **Continue** = onboarding step
- **Create plan** = create something new
- **Save changes** = edit existing object
- **Cancel** = discard changes
- **Delete** = destructive action

---

# 11. Buttons and actions

## 11.1 P1 — Too many full-width black buttons

### Problem

Nearly every primary action is a full-width black pill/button.

This makes all actions look equally important and becomes visually monotonous.

### Fix

Use button hierarchy:

### Primary
One per screen.

### Secondary
Outline or subtle button.

### Tertiary
Text/icon button.

Reserve full-width primary buttons for major mobile actions.

---

## 11.2 P2 — Button corner radius feels overly pill-like

### Problem

The combination of large rounded cards and very pill-shaped buttons creates a generic modern-SaaS appearance.

### Fix

Choose one coherent radius scale.

For example:

- cards: 12–16px
- inputs: 8–10px
- buttons: 8–10px

Use fully rounded/pill buttons only for controls that benefit from the shape, such as compact filters.

---

## 11.3 P1 — Disabled buttons are too visually weak

### Problem

Disabled buttons appear as grey bars and may be difficult to distinguish from inactive content.

### Fix

Use disabled styling that clearly communicates:

- unavailable
- not interactive
- why it is unavailable where useful

Do not make disabled text unreadably faint.

---

# 12. Forms and inputs

## 12.1 P1 — Labels and values are too close visually

### Problem

The form fields frequently have small labels and large empty controls without enough explanatory hierarchy.

### Fix

Use:

`Label`

`Input`

`Helper text`

with consistent spacing.

---

## 12.2 P1 — Input heights are too small for mobile

### Problem

Several controls look sized like desktop form inputs.

### Fix

Use approximately 44–48px controls for primary touch inputs.

---

## 12.3 P2 — Focus states are not visible in the static design

### Problem

The visual system does not clearly demonstrate keyboard/focus interaction.

### Fix

Define a strong `:focus-visible` ring across all interactive controls.

Never remove the browser-accessible focus indication without replacing it.

---

## 12.4 P2 — Error/success states are not designed

### Problem

The screenshots mostly show the happy path.

### Fix

Define reusable states for:

- invalid value
- missing required value
- saved successfully
- network/storage failure
- unsaved changes
- destructive confirmation

The AI implementation agent should not invent these independently on every screen.

---

# 13. Content and copy

## 13.1 P1 — Copy sounds functional rather than motivating

### Problem

The UI mostly asks questions and presents data. It does not consistently reinforce the product's central promise: helping users actually stick to routines.

### Fix

Use concise, human language that reinforces consistency without becoming cheesy.

Examples:

- **One small win today.**
- **Keep your momentum going.**
- **You showed up 4 days this week.**
- **Missed yesterday? Today still counts.**

Do not turn every screen into motivational wallpaper.

---

## 13.2 P1 — Terminology needs a content audit

### Problem

The screenshots use several related terms that may be interpreted differently.

### Fix

Create a canonical product glossary and apply it everywhere.

At minimum:

| Term | Meaning |
|---|---|
| Goal | Desired behavioural outcome |
| Routine | Recurring structure of activities |
| Session | One execution of a routine |
| Activity | Individual exercise/habit |
| Momentum | Current consistency signal |
| History | Past completed/missed sessions |
| Progress | Long-term performance |
| Review | Weekly reflection |

---

## 13.3 P2 — Some copy is too small to comfortably read

### Problem

Secondary descriptions are frequently tiny.

### Fix

Avoid using small text for important instructions.

Use approximately:

- 16px body text
- 14px secondary text
- 12px only for metadata/captions

---

# 14. Branding

## 14.1 P0 — There is no obvious brand moment

### Problem

The screenshots do not show a memorable logo, visual mark, colour system or other distinctive product signature.

### Fix

Introduce lightweight branding:

- Keep It Up wordmark/logo
- small brand mark/icon
- distinctive primary accent
- consistent visual motif

The branding should be subtle inside the app, not a giant logo on every screen.

---

## 14.2 P1 — Brand personality should be reflected in microcopy

### Problem

The UI currently feels clinical and generic.

### Fix

Use a consistent personality:

- practical
- encouraging
- calm
- non-judgemental
- concise

Avoid aggressive productivity language.

---

# 15. Empty, loading and edge states

## 15.1 P0 — Empty states are not sufficiently designed

### Problem

Several screens look like they contain missing data rather than intentionally empty states.

### Fix

Every data-driven screen needs a designed empty state.

Include:

1. What this area is for.
2. Why it is empty.
3. What the user should do next.

---

## 15.2 P1 — No visible loading strategy

### Problem

There is no obvious skeleton/loading treatment.

### Fix

Use lightweight skeletons for asynchronous content.

Do not show a blank page while data loads.

---

## 15.3 P1 — No explicit error recovery

### Problem

The happy-path designs do not show what happens when an operation fails.

### Fix

Provide:

- concise error message
- retry action
- preservation of entered data where possible

---

# 16. Accessibility

## 16.1 P0 — Contrast needs a systematic audit

### Problem

Several muted text elements appear too light.

### Fix

Audit text and interactive states against WCAG AA.

Pay particular attention to:

- muted text
- disabled controls
- selected/unselected controls
- navigation labels
- borders used to communicate state

---

## 16.2 P1 — State is sometimes communicated primarily through colour

### Problem

Selected, success and warning states appear to rely heavily on colour.

### Fix

Pair colour with:

- icon
- checkmark
- text
- shape
- position

---

## 16.3 P1 — Touch targets need to be consistently large enough

### Problem

Icons, weekday selectors and small edit controls appear smaller than ideal for touch.

### Fix

Make the interactive hit area at least approximately 44×44px even if the icon itself remains 18–24px.

---

## 16.4 P1 — Mobile safe areas need explicit handling

### Problem

The persistent bottom navigation and bottom CTAs sit close to the bottom edge.

### Fix

Use safe-area insets on mobile:

`padding-bottom: env(safe-area-inset-bottom)`

and ensure content does not disappear behind fixed navigation.

---

# 17. Responsive layout

## 17.1 P1 — The designs appear optimised around one narrow viewport

### Problem

The screenshots suggest a fixed mobile composition rather than a responsive system.

### Fix

Define responsive rules for:

- narrow phones
- standard phones
- tablet
- desktop

On desktop, use a constrained content width rather than stretching cards across the viewport.

---

## 17.2 P1 — Onboarding desktop layout has excessive unused space

### Problem

The multi-screen journey is visually very sparse when viewed at larger widths.

### Fix

For desktop/tablet:

- use a centred max-width container
- optionally use a two-column layout
- keep the form/content column narrow
- use supporting visual/contextual content where useful

Do not simply enlarge mobile cards.

---

# 18. Information architecture

## 18.1 P0 — The app exposes too many concepts at once

### Problem

Goal, routine, session, history, progress, momentum and review are all visible across the primary experience.

The user should not need to understand the internal data model to use the app.

### Fix

Organise the experience around the user's mental model:

### Today
What should I do now?

### History
What have I done?

### Progress
Am I improving?

### Review
What should I change?

Routine management should be subordinate to these questions.

---

## 18.2 P1 — The app should distinguish "execution" from "configuration"

### Problem

Configuration screens and execution screens share too much visual language.

### Fix

Execution screens should be:

- focused
- sparse
- action-oriented

Configuration screens can be:

- form-heavy
- detailed
- editable

Do not make the active session feel like an admin panel.

---

# 19. Interaction consistency

## 19.1 P1 — Similar actions use different visual treatments

### Problem

"Continue", "Save", "Start", "Complete", "Create" and similar actions do not appear to follow one consistent button system.

### Fix

Create a semantic action system:

- `primary`
- `secondary`
- `destructive`
- `ghost`
- `link`

Then map product actions to those variants.

---

## 19.2 P1 — Edit icons are too small and ambiguous

### Problem

Small pencil/edit icons appear without enough context.

### Fix

Use accessible icon buttons with:

- 44×44px hit area
- tooltip/title where appropriate
- visible hover/focus states

---

## 19.3 P2 — Dropdown/menu affordances are inconsistent

### Problem

Some screens appear to use tiny chevrons or menu icons without a strong indication of what they control.

### Fix

Use consistent dropdown triggers and labels.

---

# 20. Motivation and behavioural UX

## 20.1 P0 — The product does not sufficiently reward showing up

### Problem

The core differentiator is consistency, but the interface mostly behaves like a generic tracker.

### Fix

Make consistency the central feedback loop:

**Plan → Do → Record → Reflect → Adjust → Repeat**

The UI should visibly connect these stages.

---

## 20.2 P1 — Missing graceful handling of missed days

### Problem

A consistency app should assume users will sometimes fail to follow the plan.

The screenshots do not show a strong non-judgemental recovery path.

### Fix

Design missed-day states:

> You missed yesterday. No problem. Today's session is ready.

Provide:

**Continue today**

rather than making the user feel they have broken the entire plan.

---

## 20.3 P1 — Avoid creating streak anxiety

### Problem

If momentum is represented only as a streak/percentage, users may feel that one missed day invalidates progress.

### Fix

Use multiple positive measures:

- consistency over time
- sessions completed
- recent trend
- recovery after missed days

Avoid making a single streak number the entire motivational mechanism.

---

# 21. Visual polish pass

## 21.1 P2 — Align content to a consistent page grid

### Fix

Use a shared mobile page layout:

- 16–20px horizontal padding
- consistent max content width
- consistent title position
- consistent section spacing

Do not individually position cards per screen.

---

## 21.2 P2 — Standardise card padding

### Fix

Use one or two card padding sizes.

Example:

- standard card: 16px
- prominent card: 20px

Avoid every card having a different internal rhythm.

---

## 21.3 P2 — Standardise icon sizes

### Fix

Recommended:

- navigation: 20–24px
- inline icon: 16–18px
- icon button: 20px inside 44px hit area
- prominent status icon: 24–32px

---

## 21.4 P2 — Standardise heading alignment

### Problem

Some screens place titles very close to the top while others use more vertical spacing.

### Fix

Create one reusable page-header component.

Example:

```text
<PageHeader
  title="History"
  description="Your completed sessions"
/>
```

---

## 21.5 P2 — Avoid unnecessary horizontal rules/borders

### Problem

Borders are frequently used where spacing would be enough.

### Fix

Use whitespace first. Use borders only when they clarify grouping or separation.

---

# 22. Recommended component architecture

The UI should be refactored around reusable app-level components rather than individually styled pages.

Suggested components:

```text
AppShell
PageHeader
BottomNav
PrimaryAction
SecondaryAction
SectionHeader
StatCard
ProgressCard
EmptyState
GoalSelector
RoutineCard
ActivityCard
SessionHeader
SessionProgress
SetInput
DaySelector
MetricCard
ReviewInsight
StatusBadge
ConfirmDialog
```

Create shared variants rather than duplicating Tailwind classes throughout the application.

---

# 23. Recommended design tokens

Create a central visual token layer.

At minimum:

```text
--background
--foreground

--surface
--surface-muted
--surface-elevated

--border
--border-strong

--brand
--brand-foreground

--success
--success-muted

--warning
--warning-muted

--destructive
--destructive-muted

--radius-sm
--radius-md
--radius-lg

--spacing-page
--spacing-section
```

Do not hard-code arbitrary colours separately in individual screens.

---

# 24. Recommended screen hierarchy after redesign

## Today

```text
Header
  Today / date

Today's focus
  Goal / routine
  Short description
  PRIMARY: Start today's session

Momentum
  Consistency %
  Short trend

Upcoming / remaining
  Secondary information

Manage routine
```

## Active session

```text
Back
Session name
Progress: 2 / 4

Current activity
  Exercise / goal

Current set
  Large input values

PRIMARY: Complete set

Next
  Secondary information
```

## History

```text
Header
Filter/date range

Today
  Completed session

Yesterday
  Completed session

Earlier
  ...
```

## Progress

```text
Header
Time range

Consistency
  Large metric
  Trend

Goal progress
  Relevant goal-specific metric

Activity trend
  Simple visualisation
```

## Weekly Review

```text
Header

Your week
  Completion metric

What went well
  Insight

What was difficult
  Insight

Next week
  Suggested adjustment

PRIMARY: Keep plan / Adjust plan
```

## Routine Management

```text
Header

Routine
  Name
  Goal

Schedule
  Days

Activities
  List

Advanced
  Optional settings

PRIMARY: Save changes
Destructive: Delete routine
```

---

# 25. Implementation priority

Do not attempt to polish every tiny margin before fixing the information architecture.

Implement in this order:

## Phase 1 — P0 structural issues

1. Establish brand/design system.
2. Simplify bottom navigation.
3. Rework Today dashboard hierarchy.
4. Rework active-session UX.
5. Make avoid goals use their own interaction model.
6. Make progress goal-aware.
7. Make weekly review clearly distinct from progress.
8. Design proper empty states.

## Phase 2 — P1 usability

9. Simplify onboarding.
10. Add onboarding progress.
11. Standardise primary CTA placement.
12. Improve selection controls.
13. Improve touch targets.
14. Improve form hierarchy.
15. Improve history information hierarchy.
16. Improve routine-editing structure.
17. Standardise terminology.
18. Add missed-day/recovery UX.
19. Add loading/error states.

## Phase 3 — P2 visual polish

20. Standardise spacing.
21. Standardise typography.
22. Standardise card treatment.
23. Standardise radii.
24. Standardise icon sizes.
25. Improve contrast.
26. Refine navigation styling.
27. Remove unnecessary borders.
28. Refine microcopy.

## Phase 4 — final QA

29. Test narrow mobile viewport.
30. Test larger mobile viewport.
31. Test desktop/tablet.
32. Keyboard navigation.
33. Focus states.
34. Contrast.
35. Screen-reader labels for icon buttons.
36. Verify every interactive element has a clear state.
37. Verify no content is hidden behind fixed navigation.
38. Verify all primary actions are obvious without explanation.

---

# 26. Acceptance criteria for the redesign

The redesign should satisfy all of the following:

- The app looks like a coherent product rather than default shadcn.
- A user can identify today's primary action within 2–3 seconds.
- Each screen has one clear primary action.
- Bottom navigation contains only genuinely top-level destinations.
- Onboarding feels short and purposeful.
- Selected states are immediately obvious.
- Active sessions prioritise execution over configuration.
- Avoid goals have a natural check-in interaction.
- Progress displays only metrics relevant to the user's goal.
- Weekly Review has a clear reflective/actionable purpose.
- History is useful even with very little data.
- Empty states look intentional.
- Missed days have a recovery path.
- Buttons, inputs, cards and spacing follow one design system.
- Interactive touch targets are comfortably usable on mobile.
- Text has sufficient contrast.
- The product has a recognisable but restrained brand identity.
- No screen feels like a collection of unrelated cards.
- No important action relies only on colour to communicate state.
- Desktop/tablet layouts do not simply stretch the mobile UI.
- The interface feels calm, encouraging and focused rather than gamified or corporate.

---

# 27. Important implementation instruction for the coding agent

**Do not blindly implement every suggestion as an isolated UI change.**

First establish the shared design system and information architecture, then refactor the screens to use those primitives.

The correct sequence is:

```text
1. Design tokens
2. Typography
3. Layout/grid
4. Buttons/inputs/cards
5. Navigation
6. Shared page components
7. Today
8. Onboarding
9. Active sessions
10. History
11. Progress
12. Weekly review
13. Routine management
14. Empty/error/loading states
15. Accessibility
16. Responsive QA
```

Avoid introducing new one-off components when an existing shared component can be extended.

Do not solve visual inconsistencies by adding arbitrary Tailwind overrides to individual screens.

The finished UI should feel like **one application designed by one person**, not nine screens designed independently.
