/**
 * HistoryScreen — session history list.
 *
 * Shows sessions in reverse chronological order, grouped by date.
 * Tapping a session expands it inline to show metadata (logged time),
 * edit and delete actions. Tapping again collapses it.
 *
 * The summary line shows logged measurements directly (no "1 session" count).
 */

import { useState } from 'react'
import { Clock, ChevronRight, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { SectionHeader } from '../components/SectionHeader'
import { ActivityIcon } from '../components/ActivityIcon'
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
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function dayKey(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

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

/**
 * Build a compact summary of all measurements in a session.
 * e.g. "60 kg × 8 · 3 sets" or "5.2 km · 31 min" or "✓ Stayed on track".
 */
function sessionSummary(session: Session): string {
  const parts: string[] = []

  for (const result of session.results) {
    // AVOID
    if (result.stayedOnTrack !== undefined) {
      parts.push(result.stayedOnTrack ? '✓ Stayed on track' : '✗ Slipped')
      continue
    }

    // Strength sets
    if (result.sets && result.sets.length > 0) {
      const maxWeight = Math.max(
        ...result.sets.map((s) => s.weight ?? 0).filter((w) => w > 0),
      )
      const reps = result.sets.find((s) => s.weight === maxWeight)?.reps
      if (maxWeight > 0) {
        parts.push(`${maxWeight} kg${reps ? ` × ${reps}` : ''}`)
      }
      parts.push(`${result.sets.length} sets`)
      continue
    }

    // Scalar measurements
    for (const [type, value] of Object.entries(result.measurements)) {
      if (value !== undefined) {
        const unit = metricUnit(type as MeasurementType)
        parts.push(`${value}${unit ? ` ${unit}` : ''}`)
      }
    }
  }

  return parts.join(' · ')
}

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
  const { state, deleteSession } = useAppStore()
  const { routines, sessions } = state

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function toggleExpand(sessionId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
    // Clear any pending delete confirmation when toggling
    setConfirmDeleteId(null)
  }

  function handleDelete(sessionId: string) {
    deleteSession(sessionId)
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.delete(sessionId)
      return next
    })
    setConfirmDeleteId(null)
  }

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

  const sorted = [...sessions].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  )

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
                const summary = sessionSummary(session)
                const status = sessionStatus(session)
                const isExpanded = expandedIds.has(session.id)

                return (
                  <div key={session.id}>
                    <div
                      data-testid={`history-entry-${session.id}`}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() => toggleExpand(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleExpand(session.id)
                        }
                      }}
                      className="flex cursor-pointer items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-surface-muted rounded-lg -mx-2 px-2 transition-colors"
                    >
                      <ActivityIcon name={routine?.name ?? ''} size={28} className="mr-3" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            {routine?.name ?? 'Unknown routine'}
                          </p>
                          <StatusBadge variant={status.variant} label={status.label} />
                        </div>
                        {summary && (
                          <p className="text-sm text-muted-foreground mt-0.5 truncate">
                            {summary}
                          </p>
                        )}
                      </div>
                      {isExpanded
                        ? <ChevronDown size={16} className="text-muted-foreground shrink-0 ml-2" aria-hidden="true" />
                        : <ChevronRight size={16} className="text-muted-foreground shrink-0 ml-2" aria-hidden="true" />
                      }
                    </div>

                    {/* Expanded detail: metadata + actions */}
                    {isExpanded && (
                      <div
                        data-testid={`history-detail-${session.id}`}
                        className="pl-12 pr-2 pb-3 flex flex-col gap-3"
                      >
                        <div className="text-sm text-muted-foreground">
                          <p>Logged {formatDateTime(session.completedAt)}</p>
                        </div>

                        {/* Actions */}
                        {confirmDeleteId === session.id ? (
                          <div className="flex flex-col gap-2">
                            <p className="text-sm text-destructive font-medium">Delete this session?</p>
                            <div className="flex gap-2">
                              <Button
                                data-testid={`confirm-delete-${session.id}`}
                                variant="destructive"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleDelete(session.id) }}
                              >
                                <Trash2 size={14} className="mr-1" aria-hidden="true" />
                                Delete
                              </Button>
                              <Button
                                data-testid={`cancel-delete-${session.id}`}
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              data-testid={`edit-session-${session.id}`}
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Navigate to active session screen to re-log
                                navigate('dashboard')
                              }}
                            >
                              <Pencil size={14} className="mr-1" aria-hidden="true" />
                              Edit
                            </Button>
                            <Button
                              data-testid={`delete-session-${session.id}`}
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(session.id) }}
                            >
                              <Trash2 size={14} className="mr-1" aria-hidden="true" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
