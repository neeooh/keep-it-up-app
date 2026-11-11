# Perspective: Resister (the person who stops opening the app)

**Who I am:** I downloaded this app five days ago after a New Year's resolution conversation. I set up a "Strength workout 3× per week" plan. I went to the gym once, logged it, and have not opened the app since. Today is day 5 and I am looking for a reason to either open it or delete it.

---

## My situation

I am not anti-fitness. I am not lazy. I am someone who has tried six different habit apps and abandoned all of them within a month. The pattern is always the same: I set up something ambitious, I skip a day, the app makes me feel bad about it, and I stop opening it to avoid the feeling. The app becomes the thing I am avoiding, not the habit.

What I need from an app is forgiveness. What I need is for it to say "you skipped — that is fine, here is today" instead of "you are at 33% consistency and your momentum is dropping". I know I skipped. I do not need a scoreboard to remind me.

## My reaction

It has been four days since I last opened the app. I open it. I see the welcome screen. "What do you want to work on?" I already set this up. Did the app lose my data? I feel confused, then annoyed. I almost close it.

I tap through the onboarding again, hoping my old data appears. Instead, I create a second routine. Now the dashboard shows two "Strength workout" entries. Great. More mess to deal with.

The dashboard says "Your momentum: Overall consistency 0%". Actually, I logged one session earlier this week. But the new duplicate routine has 0 sessions. The original routine (if I can find it) might show something. The numbers are wrong or confusing, and either way, the message is: you are failing.

I tap the Review tab. "You missed several planned sessions this week. A lower frequency target may be more realistic and help you build consistency." The app is telling me, five days into a new habit, that I should aim lower. Maybe it is right, but it does not feel supportive — it feels like the app has given up on me.

I close the app. I will open it again in a week. Probably not.

## My specific challenges

### 1. The app punishes absence instead of welcoming return

Every metric on the dashboard is a deficit. "0%" consistency, "0/3" sessions this week, review suggesting I reduce my goals. There is no "welcome back" state. No "it has been 4 days — ready to pick up?" message. No distinction between "new user with no data" and "returning user who skipped some days". Both see the same zeros.

Apps that retain resisters (Duolingo, Calm) lead with the positive: streak-repair mechanics, "glad you are back", or a fresh-start option. This app leads with the scorecard.

> *Designer note: **Genuine gap.** The app needs at least two presentation modes: (a) new-user state where zeros are expected and messaging is encouraging, and (b) returning-user state where messaging acknowledges the gap without scoring it negatively. The Review tab's "reduce your frequency" suggestion is data-driven and arguably correct, but the tone is wrong for someone teetering on the edge of quitting. Consider: "You did 1 session this week — that counts. Want to adjust your target?"*

### 2. There is no way to restart or reset without deleting everything

I want to say "OK, last week did not happen — let me start fresh with this same plan." There is no reset-progress button. There is no "restart challenge" option. My choices are: live with the 0% guilt, or somehow delete the routine and re-create it (which I cannot even do easily — see the first-time user's challenge about missing delete).

Duolingo has streak repair. Apple Fitness has "close your rings today" without referencing yesterday. This app has a permanent record of failure with no eraser.

> *Designer note: **Genuine gap.** A "restart challenge" or "reset this week" action would serve this user. The challenge countdown (30-day challenge) should probably have a restart option, and the weekly review could offer "start a fresh week" as a positive action instead of only "reduce frequency" and "change schedule".*

### 3. The "Stop doing something" path does not adapt to relapse

I set up "No smoking — Daily". On day 3, I had a cigarette. What do I do in the app? The session log wants kg × reps. There is no "I slipped today" button. There is no distinction between "I did not log" (skipped the app) and "I relapsed" (smoked). The data model has `direction: 'AVOID'` but the session experience does not use it.

For someone trying to quit a habit, the moment of relapse is when they most need the app. If the app has nothing to say at that moment, they will not come back.

> *Designer note: **Genuine gap.** The avoid-direction activities need a completely different session experience: a daily check-in ("Did you stay on track today? Yes / No"), with a "No" option that records the slip without judgement and optionally asks what triggered it. The current kg/reps session screen is wrong for every non-exercise activity.*

### 4. The frequency default is wrong for avoidance habits

"No smoking" defaults to "3× per week" on the frequency screen. No smoking is a daily commitment. The app should default to "Every day" when the preset already says "Daily" next to the name. A user who does not change this will get a plan that expects them to not smoke only 3 days a week, which is nonsensical.

> *Designer note: **Genuine gap.** The frequency screen defaults to `3x_week` regardless of what the template specifies. The template data for "No smoking" says "Daily" in the button label, but the frequency screen ignores this. The `SetFrequencyScreen` should receive the template's recommended frequency as its default.*

### 5. There is no notification or reminder

I did not open the app for 4 days because nothing reminded me. No push notification, no email, no calendar nudge. The app is entirely passive — it waits for me to remember it exists. For a habit tracker, reminders are not a nice-to-have; they are the product. Without them, the app competes with my memory, and my memory always loses.

> *Designer note: **Valid, but out of scope for MVP.** Push notifications require a service worker (PWA) or native wrapper. This is a significant feature that belongs on the roadmap but is not a quick fix. In the meantime, the schedule screen collects preferred days and time — the app could at least display a message like "Add a reminder to your calendar" with a link to create a calendar event.*

### 6. The empty states feel abandoned

The History tab says "No sessions yet. Complete a session to see your history here." The Progress tab says "Not enough data yet." These are factual but lifeless. They do not encourage me to take the action that would fill them. They read like placeholder text that was never replaced with real copy.

Compare Headspace's empty meditation log: "Your journey starts with one session. Ready?" — that is the same information with a different emotional payload.

> *Designer note: **Valid.** Empty states are a retention opportunity. Each empty state should include: (a) a clear call to action ("Log your first session"), (b) a tap target that takes me to the session screen, and (c) copy that makes the empty state feel like a beginning, not a void.*

## What would make me OK with this

1. Do not greet me with a failure scorecard. Show me what to do today, not what I missed.
2. Give me a way to restart my challenge or reset this week without deleting everything.
3. Build a real check-in flow for avoidance habits — not kg and reps.
4. Remind me to open the app. If the app cannot push-notify, tell me to set a calendar reminder.
5. Make the empty states feel like an invitation, not a dead end.
