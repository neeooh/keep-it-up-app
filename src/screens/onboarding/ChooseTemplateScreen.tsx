import type { Navigate } from '../../App'
import type { Direction } from '../../domain/types'

interface Props {
  navigate: Navigate
  direction: Direction | null
}

export function ChooseTemplateScreen({ navigate: _navigate, direction: _direction }: Props) {
  return (
    <div data-testid="screen-choose-template" className="flex flex-col items-center justify-center min-h-full p-6">
      <h1 className="text-2xl font-semibold text-foreground">Choose activity</h1>
      <p className="text-muted-foreground mt-2">Placeholder — onboarding task 6</p>
    </div>
  )
}
