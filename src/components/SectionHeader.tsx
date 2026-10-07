import type { ReactNode } from 'react'

interface Props {
  title: string
  action?: ReactNode
}

export function SectionHeader({ title, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  )
}
