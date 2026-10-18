import { Sun, Moon } from 'lucide-react'
import { Button } from './ui/button'
import { useTheme } from '../hooks/useTheme'

/**
 * ThemeToggle — a ghost icon button that switches between light and dark mode.
 *
 * Shows a Moon icon in light mode ("switch to dark") and a Sun icon in dark
 * mode ("switch to light"). Matches the ghost icon-button pattern used by
 * the "+" add-routine buttons in PageHeader.
 */
export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      data-testid="theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
    >
      {isDark ? (
        <Sun size={20} aria-hidden="true" className="transition-transform duration-200" />
      ) : (
        <Moon size={20} aria-hidden="true" className="transition-transform duration-200" />
      )}
    </Button>
  )
}
