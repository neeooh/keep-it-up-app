# **Personal Routine Consistency Tracker**

## **1. Product Overview**

Build a simple, polished web application that helps people become more consistent with behaviours they want to adopt or avoid.

The core problem is:

**“I know what I want to do regularly. Why can’t I actually stick with it?”**

The application is not primarily a checklist, habit logger, or exercise tracker. It helps users:

1. Define what they want to change.
2. Create realistic routines.
3. Track what actually happens.
4. Understand consistency and progress.
5. Reflect on their performance.
6. Adjust their routine when reality does not match the original plan.

The core product loop is:

**Plan → Do → Measure → Reflect → Adjust**

The application supports both:

- **DO goals:** activities the user wants to perform.
- **AVOID goals:** behaviours the user wants to avoid.

Examples:

- Exercise 3 times per week.
- Read for 20 minutes every day.
- Run 5 km twice per week.
- Practise guitar 3 times per week.
- Do not eat fast food.
- Do not smoke.
- Do not use social media after 10 PM.

The product should encourage consistency rather than perfection.

### **Core product principle**

**Do not punish missed days.**

A missed session should not make the application feel like the user has failed. The system should measure consistency against the user’s intended plan and help the user adjust unrealistic goals.

---

# **2. MVP Goals**

The MVP should demonstrate that a user can go from a blank application to a functioning routine and understand their progress.

The complete core journey is:

**Create routine → Set intention → Perform activity → Record result → Review progress → Adjust plan**

The MVP should feel like a coherent product rather than a collection of technical demonstrations.

---

# **3. Target User**

The primary user is someone who already knows approximately what they want to do or stop doing but struggles with consistency.

Examples:

- Someone who wants to exercise regularly.
- Someone trying to read more.
- Someone learning a skill.
- Someone trying to establish a morning routine.
- Someone trying to stop smoking.
- Someone trying to reduce fast food or social media use.

The product should not assume that the user needs recommendations about what they should do.

The user decides the behaviour. The application helps them follow and understand it.

---

# **4. Core Domain Model**

The product should use a small, generic domain model.

### **Routine**

A repeatable plan containing one or more activities.

Example:

**Strength Training**

- Frequency: 3 times per week
- Activities:
    - Bench press
    - Kettlebell swings
    - Push-ups

### **Activity**

A specific behaviour within a routine.

An activity has:

- Name
- Direction: `DO` or `AVOID`
- Measurement configuration
- Target
- Optional unit
- Optional schedule

### **Measurement Types**

Measurement fields are composable rather than mutually exclusive.

Supported MVP measurements:

- **Duration**
- **Distance**
- **Quantity**
- **Sets**
- **Reps**
- **Weight**

Examples:

**Running**

- Distance: 5 km
- Duration: 30 minutes

**Strength training**

- Sets: 3
- Reps: 8
- Weight: 60 kg

**Reading**

- Duration: 20 minutes

**Drinking water**

- Quantity: 2 litres

An activity does not need every measurement.

### **DO vs AVOID**

`DO` means success comes from performing the behaviour.

Example:

Run 5 km.

`AVOID` means success comes from not performing the behaviour.

Example:

No fast food.

An AVOID activity does not require the user to log the unwanted behaviour itself. The user records whether they stayed on track.

### **Session**

A completed occurrence of a routine.

A session contains the results of its activities.

### **Activity Result**

The measurements recorded for an activity during a session.

For example:

```
Running
Distance: 5.2 km
Duration: 31:42
```

or:

```
Bench Press
Set 1: 60 kg × 8
Set 2: 60 kg × 8
Set 3: 62.5 kg × 7
```

### **Challenge**

A routine or activity can optionally have a fixed duration.

Examples:

- 30 days
- 60 days
- 90 days

A challenge has:

- Start date
- End date
- Target behaviour
- Progress

Challenges are an optional mode, not the core product.

---

# **5. Predefined Activity Templates**

The application should provide a small library of predefined templates to make onboarding faster.

Templates are presets, not fixed domain objects.

## **Exercise**

- Strength workout
- Running
- Walking
- Cycling
- Swimming
- Yoga
- Stretching

## **Personal development**

- Reading
- Learning
- Practice a skill
- Meditation
- Journaling

## **Daily life**

- Morning routine
- Evening routine
- Go outside

## **Breaking habits**

- No smoking
- No fast food
- No social media
- No alcohol
- No unnecessary spending

There should always be:

**Create your own**

The application should not attempt to maintain a comprehensive exercise or habit database.

---

# **6. Template Defaults**

Templates should provide sensible starting values that users can modify.

Examples:

### **Running**

- Direction: DO
- Measurements: Distance + Duration
- Target distance: 5 km
- Frequency: 2× per week

### **Walking**

- Direction: DO
- Measurement: Duration
- Target: 30 minutes
- Frequency: 5× per week

### **Strength workout**

- Direction: DO
- Measurements: Sets + Reps + Weight
- Target: 3 exercises × 3 sets × 10 reps
- Frequency: 3× per week

### **Reading**

- Direction: DO
- Measurement: Duration
- Target: 20 minutes
- Frequency: Daily

### **Meditation**

- Direction: DO
- Measurement: Duration
- Target: 10 minutes
- Frequency: Daily

### **No smoking**

- Direction: AVOID
- Frequency: Daily
- Optional challenge: 30 days

### **No fast food**

- Direction: AVOID
- Frequency: Daily
- Optional challenge: 30 days

Templates should only provide defaults. Users can change them.

---

# **7. Onboarding and Routine Creation**

The first experience should not look like a large traditional form.

The user should answer one question at a time.

## **Screen 1: Welcome / Intent**

Heading:

**What do you want to work on?**

Supporting text:

Build something you want to do more consistently, or break a habit you want to leave behind.

Two primary choices:

**Do something**

**Stop doing something**

---

## **Screen 2: Choose Activity**

For DO:

**What do you want to do?**

Display activity templates as simple cards.

Example:

- Strength workout
- Running
- Walking
- Reading
- Learning
- Meditation
- Something else

For AVOID:

**What do you want to avoid?**

Display:

- No smoking
- No fast food
- No social media
- No alcohol
- No unnecessary spending
- Something else

The user can always create a custom activity.

---

# **8. Activity Configuration**

The configuration screen adapts to the selected activity.

For example, Running:

**How do you want to measure your runs?**

Distance:

`5 km`

Duration:

`30 min`

For Reading:

**How do you want to measure reading?**

Duration:

`20 min`

For Strength:

**What does your workout include?**

Activities can be added:

```
Bench Press
3 × 8

Kettlebell Swings
3 × 12

Push-ups
3 × 10

+ Add activity
```

The UI should only expose relevant measurement fields.

The user should never have to configure irrelevant fields such as distance for reading or sets/reps for meditation.

---

# **9. Frequency**

The user chooses a realistic frequency.

**How often feels realistic?**

Options:

- Every day
- 3× per week
- 2× per week
- Once a week
- I’ll decide each time

The user can modify the frequency later.

The application should use this intended frequency when calculating consistency.

For example:

If the user chooses 3× per week:

- 3 completed = 100%
- 2 completed = 67%
- 1 completed = 33%
- 0 completed = 0%

This is preferable to treating every routine as a daily streak.

---

# **10. Optional Schedule**

The user can optionally specify preferred days or times.

Examples:

**Days**

Monday / Wednesday / Friday

**Time**

Morning

The schedule should remain optional.

The product should not become a calendar application.

---

# **11. Optional Challenge**

After configuring the routine:

**Make this a challenge?**

Options:

- 30 days
- 60 days
- 90 days
- No end date

A challenge creates a defined period for the routine.

Example:

```
30 Day Challenge

No fast food

Oct 5 → Nov 3

0 / 30 days
```

The challenge system should remain personal in the MVP.

---

# **12. Plan Review**

Before starting, show a concise summary.

Example:

**Your plan**

### **Strength Training**

**3× per week**

Bench Press

3 × 8

Kettlebell Swings

3 × 12

Push-ups

3 × 10

**Start today**

Secondary action:

**Edit plan**

This gives the user an opportunity to verify their intention before committing.

---

# **13. Dashboard**

The dashboard should answer:

**“How am I doing?”**

It should not simply show a list of unchecked boxes.

Suggested heading:

**Your momentum**

Show:

### **Overall consistency**

**82%**

Optional comparison:

+7% compared with last month

### **This week**

```
Exercise       3 / 4
Reading        5 / 5
Meditation     4 / 4
```

### **Continue**

Show the next relevant routine:

**Strength Training**

Last session:

Bench Press · 70 kg × 8

Primary action:

**Start session**

### **Progress**

Examples:

Bench Press

70 kg ↑ from 60 kg

Reading

25 min ↑ from 15 min

The dashboard should prioritise progress and momentum over streaks.

---

# **14. Active Session**

When the user starts a routine, show only what is necessary to record the session.

For a strength workout:

```
Strength Training

Bench Press

Set 1
60 kg × 8

Set 2
60 kg × 8

Set 3
62.5 kg × 7

Kettlebell Swings
...

Finish session
```

For running:

```
Running

Target
5 km

Distance
5.2 km

Duration
31:42

Complete
```

For reading:

```
Reading

Target
20 minutes

Duration
25 minutes

Complete
```

For AVOID:

```
No Fast Food

Today

Did you stay on track?

Yes, I'm on track
```

The session UI should be fast and focused.

---

# **15. History**

The user should be able to see previous sessions.

Example:

```
October 5
Strength Training
3 activities
70 kg × 8

October 3
Strength Training
3 activities
67.5 kg × 8

October 1
Strength Training
3 activities
65 kg × 8
```

History should support understanding progress, not merely provide a database of old entries.

---

# **16. Progress**

The Progress screen shows meaningful trends calculated from recorded data.

Examples:

### **Consistency**

87% over the last 4 weeks

### **Performance**

Bench Press

60 kg → 70 kg

**+17%**

### **Volume**

Total training volume

4,820 kg this week

### **Duration**

Reading

2h 15m this week

### **Trend**

Show simple historical charts where useful.

All calculations should be deterministic and performed locally.

No machine learning is required.

---

# **17. Weekly Review**

The weekly review is one of the key differentiating features.

Example:

**Your week**

### **Consistency**

**4 / 5 planned sessions**

**80%**

### **Progress**

Bench Press

65 kg → 70 kg

**+8%**

### **Momentum**

15 of your last 18 planned sessions completed.

### **Reflection**

Show useful observations based on deterministic data.

Example:

You completed most of your planned sessions, but missed two morning sessions.

### **Adjust your plan**

Options:

- Keep routine
- Reduce frequency
- Change schedule
- Edit routine

The system should encourage adjusting unrealistic plans rather than punishing missed sessions.

Example:

You’ve missed your 3× weekly target several times. A 2× weekly target may be more realistic.

This is a suggestion based on recorded behaviour, not AI-generated coaching.

---

# **18. Core Calculations**

The application should contain pure deterministic domain functions.

Examples:

- `calculateConsistency()`
- `calculateCompletionRate()`
- `calculateWeeklySummary()`
- `calculateProgress()`
- `calculateVolume()`
- `calculateTrend()`
- `calculateStreak()`
- `calculateChallengeProgress()`
- `calculatePersonalBest()`

The system should be designed so these calculations can be tested independently from the UI.

Important invariants include:

- Consistency is always between 0% and 100%.
- Reordering sets does not change total volume.
- Total volume equals the sum of individual set volumes.
- Incomplete sessions do not count as completed sessions.
- Historical records do not incorrectly alter past results.
- Challenge progress cannot exceed the challenge duration.
- Progress calculations handle missing previous data safely.

---

# **19. What We ARE Building**

### **Core**

- Routine creation
- Activity creation
- Predefined activity templates
- Custom activities
- DO and AVOID goals
- Composable measurement types
- Frequency targets
- Optional schedules
- Optional 30/60/90-day challenges
- Session recording
- Activity results
- History
- Consistency calculations
- Progress calculations
- Weekly review
- Routine adjustment
- Dashboard
- Local persistence

### **Measurement**

- Duration
- Distance
- Quantity
- Sets
- Reps
- Weight

### **Exercise support**

Basic exercise tracking is supported through the generic activity model.

The MVP can track:

- Exercises
- Sets
- Reps
- Weight
- Basic volume
- Basic performance progression

---

# **20. What We ARE NOT Building**

The MVP must explicitly avoid scope expansion.

### **Social**

- No user profiles
- No followers
- No comments
- No forums
- No messaging
- No social feed
- No likes
- No public activity
- No leaderboards
- No community challenges

Community features may be considered in a future version.

### **Advanced exercise system**

- No exercise library
- No muscle-group database
- No equipment taxonomy
- No workout programs
- No personal training
- No exercise recommendations
- No supersets
- No drop sets
- No pyramid sets
- No AMRAP
- No EMOM
- No RPE/RIR
- No tempo tracking
- No advanced training periodisation

### **Other integrations**

- No wearables
- No Apple Health
- No Google Fit
- No calendar integration
- No notifications
- No email reminders
- No nutrition database
- No sleep tracking
- No payments
- No subscriptions
- No authentication requirement
- No cloud backend required for the core MVP

### **AI**

No AI coach is required.

No machine learning is required.

The product’s intelligence comes from:

**good UX + domain modelling + deterministic calculations.**

AI capabilities are demonstrated separately through the Kiro development workflow.

---

# **21. UX Principles**

### **1. One question at a time**

Routine creation should feel progressive rather than like filling out a database form.

### **2. Defaults over configuration**

Templates should provide sensible defaults.

Users can customise them when necessary.

### **3. Do not punish missed days**

Missed sessions are information, not failure.

### **4. Measure consistency against intention**

If the user chooses 3× per week, measure performance against 3× per week.

Do not force a daily streak model onto everything.

### **5. Progress matters**

The app should show how the user is changing, not simply whether they clicked a checkbox.

### **6. Keep the user moving**

The primary flow should always make the next action obvious.

### **7. Avoid unnecessary complexity**

The application should support many behaviours through a small generic model rather than building separate systems for exercise, reading, meditation, etc.

---

# **22. MVP Success Criteria**

A new user should be able to:

1. Open the application.
2. Understand what it does immediately.
3. Create a routine without seeing a large form.
4. Choose a predefined activity or create their own.
5. Configure relevant measurements.
6. Set a realistic frequency.
7. Optionally create a challenge.
8. Start their first session.
9. Record the result.
10. See their consistency.
11. See meaningful progress.
12. Review their week.
13. Adjust their routine.

The application should feel useful after **one completed session**, while becoming more useful as historical data accumulates.

---

# **23. Kiro Project Boundaries**

The application itself should remain relatively small.

The technical complexity for the Kiro University challenge should come from the **development process and engineering artefacts**, not from unnecessary product features.

The project should demonstrate:

1. **Spec-driven development**
    - Product requirements
    - Routine management
    - Activity/session tracking
    - Progress/review
2. **Steering documents**
    - Product principles
    - Architecture/domain conventions
    - Testing conventions
3. **Hooks**
    - Automated validation
    - Testing/type checking
    - Relevant development workflow automation
4. **Property-based testing**
    - Domain calculation invariants
    - Measurement calculations
    - Consistency calculations
    - Volume calculations
    - Challenge calculations
5. **Powers**
    - A custom Routine Tracker Power containing domain-specific skills/resources and MCP configuration.
6. **MCP**
    - Expose useful routine/progress data through a small custom MCP server.
7. **Custom agents**
    - Agents should have genuinely different responsibilities rather than existing purely to satisfy a checkbox.
8. **Kiro Web / cloud**
    - Demonstrate local and cloud-based engineering.
9. **Packaged Power**
    - Publish the Power in a public GitHub repository with `plugin.json` and required resources.

The Kiro features should be connected to the actual product rather than demonstrated as isolated gimmicks.

---

# **24. Product Definition in One Sentence**

**A personal consistency tracker that helps people turn intentions into repeatable routines, measure what actually happens, understand their progress, and adjust their plans when reality gets in the way.**

# **25. Core Product Loop**

```
INTENTION
    ↓
Create a routine
    ↓
PLAN
Set realistic frequency
    ↓
DO / AVOID
Follow the routine
    ↓
MEASURE
Record what happened
    ↓
REFLECT
See consistency + progress
    ↓
ADJUST
Change the plan when necessary
    ↓
Repeat
```

The MVP should be judged primarily on whether this loop feels **simple, coherent, and genuinely useful**.

Everything else is secondary.