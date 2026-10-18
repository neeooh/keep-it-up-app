import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, THEME_STORAGE_KEY } from '../hooks/useTheme'
import { ThemeToggle } from './ThemeToggle'

// ─── matchMedia mock ──────────────────────────────────────────────────────────

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
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

function ensureMetaTag() {
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('content', '#FAF9F6')
    document.head.appendChild(meta)
  }
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  prefersDark = false
  mockMatchMedia()
  ensureMetaTag()
})

afterEach(() => {
  document.documentElement.classList.remove('dark')
})

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ThemeToggle', () => {
  it('renders with Moon icon and "Switch to dark mode" label in light mode', () => {
    renderToggle()

    const btn = screen.getByTestId('theme-toggle')
    expect(btn).toHaveAttribute('aria-label', 'Switch to dark mode')
    // The Moon icon should be present (Lucide renders an SVG).
    expect(btn.querySelector('svg')).toBeInTheDocument()
  })

  it('renders with Sun icon and "Switch to light mode" label in dark mode', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    renderToggle()

    const btn = screen.getByTestId('theme-toggle')
    expect(btn).toHaveAttribute('aria-label', 'Switch to light mode')
    expect(btn.querySelector('svg')).toBeInTheDocument()
  })

  it('toggles from light to dark on click', async () => {
    const user = userEvent.setup()
    renderToggle()

    const btn = screen.getByTestId('theme-toggle')
    expect(btn).toHaveAttribute('aria-label', 'Switch to dark mode')

    await user.click(btn)

    expect(btn).toHaveAttribute('aria-label', 'Switch to light mode')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggles from dark to light on click', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const user = userEvent.setup()
    renderToggle()

    const btn = screen.getByTestId('theme-toggle')
    expect(btn).toHaveAttribute('aria-label', 'Switch to light mode')

    await user.click(btn)

    expect(btn).toHaveAttribute('aria-label', 'Switch to dark mode')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists theme choice in localStorage after toggle', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(screen.getByTestId('theme-toggle'))

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })
})
