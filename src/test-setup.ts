import '@testing-library/jest-dom'

// ─── matchMedia mock for jsdom ────────────────────────────────────────────────
// jsdom does not implement window.matchMedia. ThemeProvider uses it to detect
// the OS colour-scheme preference. This mock returns "no preference" by default.
// Individual tests can override it when they need to simulate dark OS preference.

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
