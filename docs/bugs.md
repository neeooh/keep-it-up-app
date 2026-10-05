# Bug List

## Fixed

### BUG-001: Adding a second activity
**Status:** Fixed
**Severity:** High

**Steps to reproduce:**
1. Open the app
2. Go through the inital on-boarding process until you arrive at the Home screen.
3. Click on the "+" button (top right corner) and add a new (any) activity to track.
4. Once you are taken to the home screen, observe the "This week" section - the newly added activity is not added to the section. The newly created activity is not present in the Review section either.

**Expected:**
The newly created activity is successfully added to the app memory and also to the "This week" section, and Progress, Review section as well.

**Actual:**
It's not added anywhere.

---

### BUG-002: New Activity not added to the Continue section
**Status:** Open
**Severity:** High

**Steps to reproduce:**
1. Open the app
2. Go to the Home screen (complete the onboarding process to add the first activity is needed)
3. Click on the "+" button (top right corner) and add a new (any) activity to track.
4. Once you are taken back to the home screen, observe the "Continue" section - the newly added activity is not added to the section. It seems like the way the "Continue" section was designed it supports only one activity. The "Start session" button also only logs that one activity.

**Expected:**
The newly created activity is added  to the "Continue" section on the home screen - and this section must support displaying multiple tasks/activities that are due to do. The "Start Session button" should be renamed to "Log Session", and it should be for each activity.
Finally, rename the "Continue" to "Your Plan for Today".

**Actual:**
The newly added activity is not added to the "Continue" section on the home screen, therefore preventing the user for logging it.

---

### BUG-003: Edit Activity screen allows free text input for activity preferred time
**Status:** Open
**Severity:** Medium

**Steps to reproduce:**
1. On the Home Scree, look at the  "Your Plan for Today" section, and click on the pencil icon beside the activity in order to access the edit screen for the activity.
2. Look at the "preferred time (optional) section" -  it allows free text input which is incorrect 

**Expected:**
it should be buttons (just like on the on-boarding "pick your preferred days" screen under the "time of day" section)

**Actual:**
it allows free text input

---
