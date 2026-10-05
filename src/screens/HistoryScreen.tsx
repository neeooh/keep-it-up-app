/**
 * HistoryScreen — session history list.
 *
 * Shows sessions in reverse chronological order. Tapping a session opens
 * a detail sheet with all activity results.
 *
 * Spec reference: mvp_product_spec.md section 15.
 */

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet'
import { useAppStore } from '../store/useAppStore'
import { calculateVolume } from '../domain/calculations'
import type { Navigate } from '../App'
import type { Session, MeasurementType } from '../domain/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  })
}

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function metricUnit(type: MeasurementType): string {
  switch (type) {
    case 'weight': return 'kg'
    case 'distance': return 'km'
    case 'duration': return 'min'
    case 'quantity': return ''
    case 'sets': return 'sets'
    case 'reps': return 'reps'
  }
}

/** Pick the most interesting metric from a session to show in the list. */
function topMetric(session: Session): string | null {
  // Try weight-based (max weight from any set)
  for (const result of session.results) {
    if (result.sets && result.sets.length > 0) {
      const maxWeight = Math.max(
        ...result.sets.map((s) => s.weight ?? 0).filter((w) => w > 0),
      )
      const reps = result.sets.find((s) => s.weight === maxWeight)?.reps
      if (maxWeight > 0) {
        return `${maxWeight} kg${reps ? ` × ${reps}` : ''}`
      }
    }
  }

  // Try any scalar measurement
  for (const result of session.results) {
    for (const [type, value] of Object.entries(result.measurements)) {
      if (value !== undefined) {
        const unit = metricUnit(type as MeasurementType)
        return `${value}${unit ? ` ${unit}` : ''}`
      }
    }
  }

  // AVOID
  for (const result of session.results) {
    if (result.stayedOnTrack !== undefined) {
      return result.stayedOnTrack ? 'On track' : 'Slipped'
    }
  }

  return null
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function HistoryScreen({ navigate: _navigate }: Props) {
  const { state } = useAppStore()
  const { routines, sessions } = state

  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  // Reverse chronological
  const sorted = [...sessions].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  )

  if (sessions.length === 0) {
    return (
      <div data-testid="screen-history" className="flex flex-col min-h-full">
        <div className="px-4 pt-8 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            History
          </h1>
        </div>
        <div
          data-testid="history-empty"
          className="flex flex-1 flex-col items-center justify-center px-6 text-center"
        >
          <Clock size={40} className="text-muted-foreground mb-3" aria-hidden="true" />
          <p className="text-muted-foreground">No sessions yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Complete a session to see your history here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="screen-history" className="flex flex-col min-h-full">
      <div className="px-4 pt-8 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          History
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3">
        {sorted.map((session) => {
          const routine = routines.find((r) => r.id === session.routineId)
          const metric = topMetric(session)

          return (
            <Card
              key={session.id}
              data-testid={`history-entry-${session.id}`}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedSession(session)}
            >
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {formatDateShort(session.completedAt)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {routine?.name ?? 'Unknown routine'} ·{' '}
                      {session.results.length}{' '}
                      {session.results.length === 1 ? 'activity' : 'activities'}
                    </p>
                  </div>
                  {metric && (
                    <span className="text-sm text-muted-foreground whitespace-nowrap ml-3">
                      {metric}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detail sheet */}
      <Sheet
        open={selectedSession !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSession(null)
        }}
      >
        <SheetContent data-testid="session-detail-sheet">
          {selectedSession && (
            <SessionDetail
              session={selectedSession}
              routineName={
                routines.find((r) => r.id === selectedSession.routineId)?.name ??
                'Unknown routine'
              }
              activities={
                routines.find((r) => r.id === selectedSession.routineId)
                  ?.activities ?? []
              }
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ─── Session detail ───────────────────────────────────────────────────────────

function SessionDetail({
  session,
  routineName,
  activities,
}: {
  session: Session
  routineName: string
  activities: { id: string; name: string }[]
}) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>{formatDate(session.completedAt)}</SheetTitle>
      </SheetHeader>
      <div className="mt-4 flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{routineName}</p>

        {session.results.map((result) => {
          const activity = activities.find((a) => a.id === result.activityId)
          return (
            <div
              key={result.activityId}
              data-testid={`detail-result-${result.activityId}`}
              className="rounded-xl border border-border p-3"
            >
              <p className="text-sm font-medium text-foreground mb-2">
                {activity?.name ?? 'Activity'}
              </p>

              {/* Sets */}
              {result.sets && result.sets.length > 0 && (
                <div className="flex flex-col gap-1">
                  {result.sets.map((set, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      Set {i + 1}: {set.weight ?? '—'} kg × {set.reps ?? '—'}
                    </p>
                  ))}
                  <p className="text-xs text-foreground mt-1">
                    Volume: {calculateVolume(session, result.activityId)} kg
                  </p>
                </div>
              )}

              {/* Scalar measurements */}
              {(!result.sets || result.sets.length === 0) &&
                Object.entries(result.measurements).map(([type, value]) => (
                  <p key={type} className="text-xs text-muted-foreground">
                    {type}: {value} {metricUnit(type as MeasurementType)}
                  </p>
                ))}

              {/* AVOID */}
              {result.stayedOnTrack !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {result.stayedOnTrack ? '✓ Stayed on track' : '✗ Slipped'}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
