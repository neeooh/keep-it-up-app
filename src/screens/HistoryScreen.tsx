/**
 * HistoryScreen — session history list.
 *
 * Shows sessions in reverse chronological order, grouped by date with smart
 * "Today" / "Yesterday" / formatted headers. Tapping a session opens a detail
 * sheet with all activity results.
 *
 * Spec reference: mvp_product_spec.md section 15.
 */

import { useState } from 'react'
import { Clock, ChevronRight } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { SectionHeader } from '../components/SectionHeader'
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

/** YYYY-MM-DD in local time for day-level grouping/comparison. */
function dayKey(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Smart header: "Today", "Yesterday", or a formatted date ("5 October"). */
function groupLabel(iso: string): string {
  const key = dayKey(iso)
  const now = new Date()
  const todayKey = dayKey(now.toISOString())
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayKey = dayKey(yesterday.toISOString())

  if (key === todayKey) return 'Today'
  if (key === yesterdayKey) return 'Yesterday'
  return formatDate(iso)
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

  return null
}

/**
 * Status badge for a session.
 * AVOID sessions reflect stayedOnTrack; everything else is a completed "Done".
 */
function sessionStatus(
  session: Session,
): { variant: 'success' | 'warning'; label: string } {
  for (const result of session.results) {
    if (result.stayedOnTrack !== undefined) {
      return result.stayedOnTrack
        ? { variant: 'success', label: 'On track' }
        : { variant: 'warning', label: 'Slipped' }
    }
  }
  return { variant: 'success', label: 'Done' }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function HistoryScreen({ navigate }: Props) {
  const { state } = useAppStore()
  const { routines, sessions } = state

  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  if (sessions.length === 0) {
    return (
      <div data-testid="screen-history" className="flex flex-col min-h-full">
        <PageHeader title="History" />
        <div data-testid="history-empty" className="flex flex-1 flex-col">
          <EmptyState
            icon={<Clock size={32} aria-hidden="true" />}
            title="Your history starts here"
            description="Complete your first session and it will appear here."
            actionLabel="Log your first session"
            onAction={() => navigate('dashboard')}
          />
        </div>
      </div>
    )
  }

  // Reverse chronological
  const sorted = [...sessions].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  )

  // Group into contiguous date groups (already newest-first).
  const groups: { label: string; sessions: Session[] }[] = []
  for (const session of sorted) {
    const label = groupLabel(session.completedAt)
    const current = groups[groups.length - 1]
    if (current && current.label === label) {
      current.sessions.push(session)
    } else {
      groups.push({ label, sessions: [session] })
    }
  }

  return (
    <div data-testid="screen-history" className="flex flex-col min-h-full">
      <PageHeader title="History" />

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-6">
        {groups.map((group) => (
          <div key={`${group.label}-${group.sessions[0]!.id}`}>
            <SectionHeader title={group.label} />
            <div>
              {group.sessions.map((session) => {
                const routine = routines.find((r) => r.id === session.routineId)
                const metric = topMetric(session)
                const status = sessionStatus(session)

                return (
                  <div
                    key={session.id}
                    data-testid={`history-entry-${session.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedSession(session)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedSession(session)
                      }
                    }}
                    className="flex cursor-pointer items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-surface-muted rounded-lg -mx-2 px-2 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">
                          {routine?.name ?? 'Unknown routine'}
                        </p>
                        <StatusBadge variant={status.variant} label={status.label} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {session.results.length}{' '}
                        {session.results.length === 1 ? 'session' : 'sessions'}
                        {metric && <span className="ml-2">{metric}</span>}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground shrink-0 ml-2" aria-hidden="true" />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
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
      <div className="mt-4 flex flex-col gap-5">
        <p className="text-base font-semibold text-foreground">{routineName}</p>

        {session.results.map((result) => {
          const activity = activities.find((a) => a.id === result.activityId)
          const volume = calculateVolume(session, result.activityId)
          return (
            <div
              key={result.activityId}
              data-testid={`detail-result-${result.activityId}`}
              className="flex flex-col gap-2"
            >
              <p className="text-sm font-semibold text-foreground">
                {activity?.name ?? 'Activity'}
              </p>

              {/* Sets */}
              {result.sets && result.sets.length > 0 && (
                <div className="flex flex-col gap-1">
                  {result.sets.map((set, i) => (
                    <div key={i} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Set {i + 1}</span>
                      <span>{set.weight ?? '—'} kg × {set.reps ?? '—'}</span>
                    </div>
                  ))}
                  {volume > 0 && (
                    <div className="flex items-center justify-between text-sm font-medium text-foreground mt-1 pt-1 border-t border-border/50">
                      <span>Volume</span>
                      <span>{volume} kg</span>
                    </div>
                  )}
                </div>
              )}

              {/* Scalar measurements */}
              {(!result.sets || result.sets.length === 0) &&
                Object.entries(result.measurements).map(([type, value]) => (
                  <div key={type} className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="capitalize">{type}</span>
                    <span>{value} {metricUnit(type as MeasurementType)}</span>
                  </div>
                ))}

              {/* AVOID */}
              {result.stayedOnTrack !== undefined && (
                <p className="text-sm text-muted-foreground">
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
