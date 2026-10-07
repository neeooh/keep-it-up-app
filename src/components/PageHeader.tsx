import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  backAction?: () => void
  rightAction?: ReactNode
}

export function PageHeader({ title, description, backAction, rightAction }: Props) {
  return (
    <div className="px-5 pt-8 pb-4">
      <div className="flex items-center gap-3">
        {backAction && (
          <button
            type="button"
            aria-label="Back"
            onClick={backAction}
            className="-ml-2 flex items-center justify-center size-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </div>
  )
}
