# Perspective: First-time user

**Who I am:** A 28-year-old who decided on Sunday evening to "get into fitness". I searched "simple workout tracker", found this app, and opened it on my phone.

---

## My situation

I do not have a gym plan. I do not know what sets and reps mean in context. I have tried MyFitnessPal and Streaks before — both felt like work after a week. I want something that makes me feel good about starting, not overwhelmed by configuration. I will give this app about 90 seconds before I decide whether to keep going or close it.

## My reaction

The first screen is clean. "What do you want to work on?" — I like that. Two clear options. I tap "Do something" and I get a list of preset habits. Good. I pick "Strength workout" because that sounds right.

Then the app asks me to configure exercises with sets, reps, and has an "Add exercise" button. I have not done a strength workout yet. I do not know what exercises to add or what numbers to put in. The defaults are 3 sets of 10 reps — of what? The exercise name field is empty. I feel like I am filling in a form for a gym I have not joined.

I tap Continue anyway. Now it asks how often. Then which days. Then whether I want a challenge. Then it shows me a summary. I count — that was seven screens before I reached the dashboard. For an app I opened 90 seconds ago, that is a lot.

## My specific challenges

### 1. The onboarding is too long for a casual user

Seven screens (welcome → template → configure → frequency → schedule → challenge → summary) before I see the dashboard. Each screen is simple on its own, but the total sequence feels like a bureaucratic intake form. Competitor apps (Streaks, Habitify) get you to a working dashboard in two taps.

> *Designer note: **Genuine gap.** The schedule and challenge screens are optional — but they still appear in the flow. Consider collapsing to: pick a habit → confirm → dashboard, with frequency/schedule/challenge as post-setup settings. A "just start" path that skips everything except the habit name would reduce the barrier from 7 screens to 2.*

### 2. The exercise configuration screen assumes prior knowledge

When I pick "Strength workout", the configure screen asks for an exercise name, sets, and reps. The exercise name field is empty. For someone who does not already have a workout plan, this is a blank exam paper. I am supposed to know what exercises to do before the app helps me track them.

> *Designer note: **Genuine gap.** The template system pre-fills the activity name ("Strength workout") but not the exercise name. For a fitness beginner, suggest common exercises (bench press, squat, deadlift) as tappable presets, or let the user skip exercise configuration entirely and add exercises when they actually go to the gym.*

### 3. The dashboard greets me with "0%"

After all that setup, the dashboard says "Your momentum: Overall consistency 0%". The weekly tracker shows "0 / 3". The review tab says "You missed several planned sessions this week" and suggests I "reduce my frequency". I created this routine 10 seconds ago. The app is already telling me I am failing.

> *Designer note: **Genuine gap.** The consistency calculation and review messaging do not account for the routine's age. A routine created today should show encouragement ("Ready when you are" or "Your first session is waiting"), not a 0% failure metric. The review tab suggestion to "reduce frequency" on day one is especially discouraging — it implies the user has already failed before they started.*

### 4. No explanation of what "session" means

The dashboard has a "Start session" button. When I tap it, I see empty kg and reps fields for 3 sets. There is no explanation of what I am recording, no guidance like "log what you did at the gym". The word "session" is gym jargon. For a reading or meditation habit, "session" does not make sense either.

> *Designer note: **Valid.** The UI vocabulary is gym-centric ("session", "sets", "reps", "kg") even for habits that do not involve exercise. The "Stop doing something" path correctly simplifies to just a check-in, but the "Do something" path forces the gym mental model on all activities. A reading habit should not need sets and reps.*

### 5. I cannot undo or delete anything from the dashboard

I created a routine and now I am on the dashboard. There is an "Edit routine" button but no "Delete routine" button visible. I also see no way to delete a session if I log one by mistake. If I mistype the activity name or pick the wrong template, there is no clear path to start over without figuring out the edit flow.

> *Designer note: **Genuine gap.** Destructive actions (delete routine, delete session) are not discoverable from the dashboard or session list. For a new user who made a mistake during onboarding, the lack of a visible "start over" or "delete" option creates anxiety — especially combined with the fact that refreshing the page sends them back to onboarding while the broken routine silently persists in localStorage.*

## What would make me OK with this

1. Get me to the dashboard in 2–3 taps, not 7. Let me configure details later.
2. Show me encouragement on day one, not a 0% failure metric.
3. Pre-fill exercise suggestions or let me skip exercise configuration entirely.
4. Make "delete routine" easy to find.
