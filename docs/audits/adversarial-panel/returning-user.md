# Perspective: Returning user (day 14 of a 30-day challenge)

**Who I am:** I set up a "Strength workout 3× per week" challenge two weeks ago. I have logged 5 out of 6 planned sessions. I open this app 3–4 times a week to log my workout after the gym.

---

## My situation

I am past the setup phase. I know what this app does. What I care about now is speed. I want to open the app, record my sets, and close it — ideally in under a minute. I am standing in the gym, sweaty, phone in one hand. Every extra tap is friction. I am also starting to wonder: is this app helping me, or am I just entering data for no reason?

## My reaction

I open the app and I see the welcome screen again. "What do you want to work on?" I already set this up two weeks ago. Every time I refresh the page or reopen the browser, I land here. My routine is still saved — I can see it if I somehow get past this screen — but the app does not take me there. I have to know that my data is behind this wall. A new user would think their data is gone.

Once I get to the dashboard (by creating another routine, which duplicates my existing one, or by finding a workaround), the logging experience is slow. I tap "Start session", and I see three empty input fields for kg and reps. No defaults from my last session. I did 60 kg × 10 reps on bench press last time. The app knows this — it is in the session history — but every time I start a new session, I type from scratch.

## My specific challenges

### 1. The app forgets where I am on every page load

The `App.tsx` always starts at `initialScreen = 'welcome'`. My routines are in localStorage. The app loads them into state. But the screen routing does not check "are there existing routines? → show the dashboard". Every browser refresh, every new tab, every morning when I reopen the app — I see the onboarding wizard for a product I have been using for two weeks.

> *Designer note: **Genuine gap.** This is a code-level bug. `AppShell` should check `state.routines.length > 0` on mount and start at `'dashboard'` instead of `'welcome'`. Without this fix, the app is not usable as a daily tool — the core loop (open → log → close) is broken at step one.*

### 2. Session logging requires manual entry every time

I did bench press at 60 kg × 10 reps × 3 sets on Monday. Today is Wednesday. I open "Start session" and see three rows of empty kg and reps fields. The app does not pre-fill from my last session. I have to type "60" and "10" six times (two fields × three sets). On a phone keyboard, in the gym, this is slow and annoying.

Competitor apps (Strong, JEFIT) remember your last weights and pre-fill them. The user just confirms or adjusts. That takes one tap per set instead of two text inputs per set.

> *Designer note: **Genuine gap.** The `ActiveSessionScreen` creates empty sets with no default values. The session history contains previous entries for the same routine. Pre-filling the last-used kg and reps values would cut logging time by 80% for returning users. This is the single biggest friction point for the daily use case.*

### 3. No quick-log or "same as last time" shortcut

Some days I do the exact same workout as last time. Same weight, same reps, same sets. There is no "repeat last session" button. There is no way to tap once and record "I did it". Every session requires manual data entry, even when nothing changed.

For the "Stop doing something" path (e.g. "No smoking"), the equivalent issue is: do I need to open the app and actively confirm I did not smoke? What does a session log look like for an avoidance habit? The current session screen shows kg × reps fields, which do not make sense for non-exercise activities.

> *Designer note: **Genuine gap.** Two separate issues here. (a) A "repeat last session" button on the dashboard would serve returning users who do consistent workouts. (b) The session logging screen is exercise-specific — it always shows kg/reps fields regardless of activity type. The "avoid" direction has different measurements in the data model (`direction: 'AVOID'`) but the session screen does not adapt to it.*

### 4. Duplicate routines accumulate silently

Because the app restarts at the welcome screen, I went through onboarding again and created a second "Strength workout" routine. Now the dashboard shows two identical routines. There is no merge, no warning ("you already have this"), and no visible "created on" date to tell them apart. The localStorage confirms two entries with different UUIDs but the same name.

> *Designer note: **Genuine gap.** The `addRoutine` function in the store appends without checking for duplicates. At minimum, the app should warn when creating a routine with the same name as an existing one. Better: if routines exist, skip onboarding entirely (see challenge 1).*

### 5. The progress tab is still empty after 5 sessions

I have logged 5 sessions over two weeks. When I tap the Progress tab, it says "Not enough data yet — Complete at least two sessions to see your progress." I have completed more than two. Either the threshold is wrong, or the progress calculation is not counting my sessions, or the data from my "duplicate routine" situation is split across two routine IDs.

> *Designer note: **Uncertain — could not fully verify.** The progress screen requires 2+ sessions per routine. If the user's sessions are split across duplicate routines (which this bug enables), no single routine reaches the threshold. This is a compounding effect of the duplicate-routine problem. Needs code inspection to confirm the exact threshold logic.*

### 6. The History tab does not show enough context

The History tab lists past sessions but does not show what I actually logged (the weights, the reps). I want to see "Monday: Bench press 60 kg × 10 × 3 sets" so I can remember what I did last time and progress. If the history is just a list of dates, it is a calendar, not a training log.

> *Designer note: **Valid.** The history empty state says "No sessions yet" — I could not verify the populated state because the app reset before I could log sessions in this review. However, the data model stores `entries` per session with `setResults` (kg, reps, completed). If the history screen does not surface this detail, it misses the primary reason a gym user checks their history: to decide what weight to use today.*

## What would make me OK with this

1. Open the app → see the dashboard. Do not show me onboarding when I already have routines.
2. Pre-fill last session's values when I start a new one.
3. Give me a "same as last time" one-tap option.
4. Show actual weights and reps in the history, not just dates.
