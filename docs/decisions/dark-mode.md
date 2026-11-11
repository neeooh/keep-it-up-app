# Dark Mode — Spec and Decisions

Date: 2026-10-18

## Summary

The app supports light and dark themes. A toggle button in the page header lets the user switch between them. The app respects the operating system preference on first visit and persists the user's manual choice in localStorage.

## Requirements

1. The user can switch between light and dark themes with a toggle button.
2. The toggle shows a Moon icon in light mode and a Sun icon in dark mode.
3. On first visit, the app matches the OS colour-scheme preference.
4. A manual choice persists in localStorage and survives page refreshes.
5. The PWA status bar colour updates to match the active theme.
6. No white flash appears when a dark-mode user reloads the page.

## Architecture

```
index.html (inline script)
  ↓ reads localStorage + matchMedia
  ↓ sets .dark on <html> before first paint

ThemeProvider (React Context)
  ↓ wraps AppStoreProvider inside App.tsx
  ↓ manages theme state, applies .dark class, updates <meta theme-color>

ThemeToggle (component)
  ↓ reads useTheme() hook
  ↓ renders Sun/Moon icon button
  ↓ calls toggleTheme on click

PageHeader rightAction
  ↓ ThemeToggle placed alongside existing buttons (e.g. "+")
  ↓ on screens without other actions, ThemeToggle is the sole rightAction
```

## Decisions

### 1. Separate React Context for theme state

Theme preference is a UI concern. It does not belong in the domain app store (`useAppStore`), which holds routines and sessions.

A dedicated `ThemeProvider` context keeps the two concerns independent. The theme context reads and writes its own localStorage key (`keep-it-up:theme`). The domain store uses a different key (`keep-it-up:state`).

### 2. Respect OS preference on first visit

When no stored preference exists, the app reads `prefers-color-scheme` from the operating system. This matches user expectations on modern devices.

The provider listens to `matchMedia` change events. If the user has not made a manual choice and then changes the OS setting, the app updates in real time.

After the first manual toggle, the app stores an explicit `'light'` or `'dark'` value. This overrides the OS preference from that point on.

### 3. Persist in localStorage under `keep-it-up:theme`

localStorage provides the simplest persistence for a client-only app. The key `keep-it-up:theme` follows the same namespace pattern as the app store key.

Valid stored values are `'light'` and `'dark'`. Any other value (or absent key) means "follow the system".

### 4. Update `<meta name="theme-color">` dynamically

The `<meta name="theme-color">` tag controls the browser address bar and PWA status bar colour.

Light mode uses `#FAF9F6` (the warm off-white background). Dark mode uses `#2E2C28` (the warm dark charcoal background). The ThemeProvider updates this tag every time the resolved theme changes.

The PWA manifest in `vite.config.ts` still has a static `theme_color: '#D97745'`. The manifest value applies only during installation and splash screen. The `<meta>` tag takes precedence at runtime.

### 5. Inline script for flash-of-wrong-theme (FOWT) prevention

A small inline `<script>` block in `index.html` runs before the React bundle loads. It reads the stored theme from localStorage and checks `matchMedia`. If dark mode should be active, it adds `.dark` to the `<html>` element and updates the `<meta theme-color>` tag.

This script runs synchronously before the first paint. It prevents the brief white flash that would otherwise appear when a dark-mode user reloads the page.

The script is ~10 lines of vanilla JavaScript with no imports or module syntax.

### 6. Toggle placement in PageHeader

The toggle button sits in the `PageHeader` component's `rightAction` slot. This is the same area where the "+" (add routine) button appears on the Dashboard and Plan screens.

On screens that already have a rightAction button, the toggle appears alongside it in a flex container. On screens without an existing rightAction (History, Progress, Weekly Review), the toggle is the sole rightAction.

The toggle does not appear on:
- Onboarding screens (keep the flow focused and clean).
- Active Session screen (focused task, has a back button).
- Edit Routine screen (focused task, has a back button).

### 7. CSS tokens already existed

The `index.css` file already contained a complete `.dark` block with all design tokens adapted for dark surfaces. No new CSS was needed. The only change was adding the mechanism to activate the `.dark` class.

## Files changed

| File | Change |
|---|---|
| `src/hooks/useTheme.tsx` | New. ThemeProvider context and useTheme hook. |
| `src/hooks/useTheme.test.tsx` | New. 10 tests for the hook and provider. |
| `src/components/ThemeToggle.tsx` | New. Sun/Moon toggle button component. |
| `src/components/ThemeToggle.test.tsx` | New. 5 tests for the toggle component. |
| `src/App.tsx` | Wrapped AppStoreProvider with ThemeProvider. |
| `src/screens/DashboardScreen.tsx` | Added ThemeToggle to both PageHeader instances. |
| `src/screens/PlanScreen.tsx` | Added ThemeToggle to both PageHeader instances. |
| `src/screens/HistoryScreen.tsx` | Added ThemeToggle to both PageHeader instances. |
| `src/screens/ProgressScreen.tsx` | Added ThemeToggle to both PageHeader instances. |
| `src/screens/WeeklyReviewScreen.tsx` | Added ThemeToggle to both PageHeader instances. |
| `src/screens/__tests__/fixtures.tsx` | Added ThemeProvider to StoreWrapper test fixture. |
| `src/test-setup.ts` | Added global matchMedia mock for jsdom. |
| `index.html` | Changed default theme-color to `#FAF9F6`. Added FOWT prevention script. |
