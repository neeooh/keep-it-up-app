import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  ThemeProvider,
  useTheme,
  THEME_STORAGE_KEY,
  THEME_COLOR_LIGHT,
  THEME_COLOR_DARK,
} from './useTheme'

// ─── Test helper ──────────────────────────────────────────────────────────────

/** Renders a small component that exposes theme state and a toggle button. */
function TestConsumer() {
  const { theme, resolvedTheme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button data-testid="toggle" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <ThemeProvider>
      <TestConsumer />
    </ThemeProvider>,
  )
}

// ─── matchMedia mock ──────────────────────────────────────────────────────────

let mediaListeners: Array<(e: { matches: boolean }) => void> = []
let prefersDark = false

function mockMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
        mediaListeners.push(cb)
      },
      removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
        mediaListeners = mediaListeners.filter((l) => l !== cb)
      },
      dispatchEvent: vi.fn(),
    })),
  })
}

// ─── Meta tag helper ──────────────────────────────────────────────────────────

function ensureMetaTag() {
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('content', THEME_COLOR_LIGHT)
    document.head.appendChild(meta)
  }
  return meta
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  prefersDark = false
  mediaListeners = []
  mockMatchMedia()
  ensureMetaTag()
})

afterEach(() => {
  document.documentElement.classList.remove('dark')
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ThemeProvider', () => {
  it('defaults to system → light when OS prefers light', () => {
    prefersDark = false
    mockMatchMedia()
    renderWithProvider()

    expect(screen.getByTestId('theme').textContent).toBe('system')
    expect(screen.getByTestId('resolved').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('defaults to system → dark when OS prefers dark', () => {
    prefersDark = true
    mockMatchMedia()
    renderWithProvider()

    expect(screen.getByTestId('theme').textContent).toBe('system')
    expect(screen.getByTestId('resolved').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('reads stored "dark" from localStorage on mount', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    renderWithProvider()

    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('resolved').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('reads stored "light" from localStorage on mount', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    prefersDark = true
    mockMatchMedia()
    renderWithProvider()

    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(screen.getByTestId('resolved').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggles from light to dark', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    expect(screen.getByTestId('resolved').textContent).toBe('light')

    await user.click(screen.getByTestId('toggle'))

    expect(screen.getByTestId('resolved').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('toggles from dark to light', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const user = userEvent.setup()
    renderWithProvider()

    expect(screen.getByTestId('resolved').textContent).toBe('dark')

    await user.click(screen.getByTestId('toggle'))

    expect(screen.getByTestId('resolved').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('updates meta theme-color when toggling to dark', async () => {
    const user = userEvent.setup()
    const meta = ensureMetaTag()
    renderWithProvider()

    await user.click(screen.getByTestId('toggle'))

    expect(meta.getAttribute('content')).toBe(THEME_COLOR_DARK)
  })

  it('updates meta theme-color when toggling to light', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const user = userEvent.setup()
    const meta = ensureMetaTag()
    renderWithProvider()

    await user.click(screen.getByTestId('toggle'))

    expect(meta.getAttribute('content')).toBe(THEME_COLOR_LIGHT)
  })

  it('reacts to OS preference change when in system mode', () => {
    prefersDark = false
    mockMatchMedia()
    renderWithProvider()

    expect(document.documentElement.classList.contains('dark')).toBe(false)

    // Simulate OS switching to dark.
    act(() => {
      prefersDark = true
      mockMatchMedia()
      mediaListeners.forEach((cb) => cb({ matches: true }))
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})

describe('useTheme outside provider', () => {
  it('throws when used without ThemeProvider', () => {
    // Suppress console.error from the expected throw.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<TestConsumer />)).toThrow(
      'useTheme must be used within a ThemeProvider',
    )

    spy.mockRestore()
  })
})
