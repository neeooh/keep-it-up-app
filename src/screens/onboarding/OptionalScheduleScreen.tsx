import type { Navigate } from '../../App'

interface Props { navigate: Navigate }

export function OptionalScheduleScreen({ navigate: _navigate }: Props) {
  return (
    <div data-testid="screen-optional-schedule" className="flex flex-col items-center justify-center min-h-full p-6">
      <h1 className="text-2xl font-semibold text-foreground">Optional schedule</h1>
      <p className="text-muted-foreground mt-2">Placeholder — onboarding task 7</p>
    </div>
  )
}
