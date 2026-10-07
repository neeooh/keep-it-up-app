interface Props {
  current: number
  total: number
}

export function OnboardingProgress({ current, total }: Props) {
  return (
    <div className="flex items-center gap-1.5 px-5 pb-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={[
            'h-1 flex-1 rounded-full transition-colors',
            i < current ? 'bg-brand' : 'bg-surface-muted',
          ].join(' ')}
        />
      ))}
    </div>
  )
}
