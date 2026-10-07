import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  unit?: string
  delta?: number
  deltaLabel?: string
}

export function StatCard({ label, value, unit, delta, deltaLabel }: Props) {
  return (
    <div className="rounded-xl bg-surface p-4 ring-1 ring-foreground/5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {delta !== undefined && delta !== 0 && (
        <div className={`flex items-center gap-1 mt-1.5 text-sm font-medium ${
          delta > 0 ? 'text-success' : 'text-destructive'
        }`}>
          {delta > 0 ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
          <span>{delta > 0 ? '+' : ''}{delta}%{deltaLabel ? ` ${deltaLabel}` : ''}</span>
        </div>
      )}
    </div>
  )
}
