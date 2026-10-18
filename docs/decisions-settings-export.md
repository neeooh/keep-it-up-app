# Settings and Data Export — Spec and Decisions

Date: 2026-10-18

## Summary

A new Settings screen lets the user set a display name and export their data. The display name appears in the dashboard greeting. Export supports three formats: JSON, CSV, and Markdown.

## Features

### 1. Personalized greeting

The dashboard greeting changes from "Good morning" to "Good morning, Alice" when the user sets a name. The name is optional. The greeting works without it.

### 2. Data export

Three export formats are available from the Settings screen:

- **JSON** — full backup of all routines and sessions. The output matches the internal data structure. A user can save this file and use it as a backup.
- **CSV** — one row per activity result per session. Columns: Date, Routine, Activity, Direction, Measurements, Sets, Stayed On Track. Opens in Excel, Google Sheets, or any spreadsheet tool.
- **Markdown** — human-readable summary with routine details and session history grouped by date. Good for pasting into notes apps or journals.

### 3. Settings screen

Accessible via a cog icon in the dashboard header. Contains two sections:

1. **Profile** — a name input with a Save button. Shows confirmation text on save.
2. **Your Data** — three export buttons (JSON, CSV, Markdown). Each triggers a browser download. Buttons are disabled when no data exists.

The settings screen hides the bottom navigation bar and shows a back arrow to return to the dashboard.

## Architecture

```
usePreferences (React Context)
  ↓ stores { userName } in localStorage under 'keep-it-up:preferences'
  ↓ read by DashboardScreen for the greeting
  ↓ read/written by SettingsScreen for the name input

export.ts (pure functions)
  ↓ exportJSON(state) → string
  ↓ exportCSV(state) → string
  ↓ exportMarkdown(state) → string
  ↓ downloadFile(content, filename, mimeType) → triggers browser download

SettingsScreen
  ↓ reads usePreferences() for the name
  ↓ reads useAppStore() for export data
  ↓ calls export functions + downloadFile on button click
```

## Decisions

### 1. Separate preferences store

User preferences (name, future settings) live in their own React Context and localStorage key (`keep-it-up:preferences`). This keeps the domain store (`keep-it-up:state`) focused on routines and sessions.

The same pattern applies as with the theme store: UI concerns live in their own context.

### 2. Settings as a full screen, not a dialog

A dialog would work for one field. A full screen provides room for future settings and for the three export buttons. The cog icon in the header is a standard pattern users recognize.

### 3. JSON, CSV, and Markdown — no PDF or DOCX

JSON and CSV cover the two main use cases: full backup and spreadsheet analysis. Markdown adds a readable format at near-zero cost (string concatenation, no dependencies).

PDF would need a library (jspdf or pdfmake). DOCX would need another library. Both add dependency weight for marginal value. Users who want a formatted document can open the CSV in Sheets or paste the Markdown into their notes app.

### 4. Export uses pure functions

The three export functions (`exportJSON`, `exportCSV`, `exportMarkdown`) are pure functions in `src/domain/export.ts`. They accept an `AppState` and return a string. This makes them easy to test without any browser or React dependencies.

The `downloadFile` helper handles the browser download mechanism. It creates a Blob, generates an object URL, clicks a temporary anchor, and cleans up.

### 5. Cog icon placement

The cog sits in the dashboard PageHeader rightAction area, between the theme toggle and the "+" (add routine) button. This groups all header actions in one spot.

The settings icon appears only on the dashboard. Other screens do not need it because the user can always return to the dashboard first.

### 6. Greeting stays simple

The greeting function accepts an optional name parameter. When the name is set, it appends it: "Good morning, Alice". When empty, it shows the time-of-day greeting without a name.

No complex greeting logic, no random messages, no animation. The goal is warmth, not novelty.

## Files changed

| File | Change |
|---|---|
| `src/hooks/usePreferences.tsx` | New. PreferencesProvider context and usePreferences hook. |
| `src/domain/export.ts` | New. exportJSON, exportCSV, exportMarkdown, downloadFile. |
| `src/domain/export.test.ts` | New. 15 tests for all three export formats. |
| `src/screens/SettingsScreen.tsx` | New. Settings screen with profile and export sections. |
| `src/screens/types.ts` | Added `settings` to Screen type and MAIN_SCREENS. |
| `src/App.tsx` | Added SettingsScreen route, PreferencesProvider wrapper, hide nav on settings. |
| `src/App.test.tsx` | Updated to handle settings screen nav hiding. |
| `src/screens/DashboardScreen.tsx` | Added cog icon, usePreferences for greeting personalization. |
| `src/screens/__tests__/fixtures.tsx` | Added PreferencesProvider to StoreWrapper. |
