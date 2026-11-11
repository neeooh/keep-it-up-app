/**
 * ModeSwitch — two-segment toggle for Build a habit / Break a habit.
 *
 * Build is the default selection. The active segment uses the brand color.
 */

export type Mode = 'build' | 'break'

interface Props {
  value: Mode
  onChange: (mode: Mode) => void
}

export function ModeSwitch({ value, onChange }: Props) {
  return (
    <div
      data-testid="mode-switch"
      className="flex rounded-full bg-muted p-1 gap-1"
      role="radiogroup"
      aria-label="Commitment type"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === 'build'}
        data-testid="mode-build"
        onClick={() => onChange('build')}
        className={[
          'flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors text-center',
          value === 'build'
            ? 'bg-brand text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        ].join(' ')}
      >
        Build a habit
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'break'}
        data-testid="mode-break"
        onClick={() => onChange('break')}
        className={[
          'flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors text-center',
          value === 'break'
            ? 'bg-brand text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        ].join(' ')}
      >
        Break a habit
      </button>
    </div>
  )
}
