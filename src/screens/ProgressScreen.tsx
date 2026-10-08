/**
 * ProgressScreen — trends and progress.
 *
 * Shows a time-range selector, consistency, performance deltas, volume/duration
 * totals, and inline SVG trend charts. Progress is goal-aware:
 * - AVOID activities show successful days, completion rate, and longest streak.
 * - DO activities show current performance metrics and trends.
 *
 * Spec reference: mvp_product_spec.md section 16.
 */

import { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { StatCard } from '../components/StatCard'
import { SectionHeader } from '../components/SectionHeader'
import { useAppStore } from '../store/useAppStore'
import {
  calculateConsistency,
  calculateProgress,
  calculateTrend,
  calculateVolume,
  sessionsForRoutine,
  sessionsInRange,
} from '../domain/calculations'
import type { Navigate } from '../App'
import type { MeasurementType, Routine, Session, TrendPoint } from '../domain/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
}

type Range = '7d' | '30d' | '90d'

const RANGE_WEEKS: Record<Range, number> = { '7d': 1, '30d': 4, '90d': 13 }

// ─── Date helpers ─────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function weeksAgo(weeks: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - weeks * 7)
  return d.toISOString().slice(0, 10)
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

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const mins = Math.round(totalMinutes % 60)
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/** True when a routine's first activity is an AVOID goal. */
function isAvoidRoutine(routine: Routine): boolean {
  return routine.activities.some((a) => a.direction === 'AVOID')
}

/** Longest run of consecutive stayedOnTrack=true sessions (chronological). */
function longestStreak(sessions: Session[], routineId: string): number {
  const ordered = sessionsForRoutine(sessions, routineId)
  let best = 0
  let current = 0
  for (const session of ordered) {
    const onTrack = session.results.some((r) => r.stayedOnTrack === true)
    if (onTrack) {
      current += 1
      best = Math.max(best, current)
    } else {
      current = 0
    }
  }
  return best
}

// ─── Inline SVG trend chart ───────────────────────────────────────────────────

function TrendChart({
  points,
  unit,
}: {
  points: TrendPoint[]
  unit: string
}) {
  if (points.length < 2) return null

  const width = 280
  const height = 80
  const padding = { top: 10, right: 10, bottom: 20, left: 10 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const values = points.map((p) => p.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1

  const coords = points.map((p, i) => ({
    x: padding.left + (i / (points.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((p.value - minVal) / range) * chartHeight,
  }))

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ')

  const first = points[0]!
  const last = points[points.length - 1]!

  return (
    <div data-testid="trend-chart" className="mt-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-20"
        aria-label="Trend chart"
        role="img"
      >
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-brand"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r="3"
            className="fill-brand text-brand"
          />
        ))}
        {/* First label */}
        <text
          x={coords[0]!.x}
          y={height - 2}
          textAnchor="start"
          className="fill-muted-foreground text-[9px]"
        >
          {first.value}{unit ? ` ${unit}` : ''}
        </text>
        {/* Last label */}
        <text
          x={coords[coords.length - 1]!.x}
          y={height - 2}
          textAnchor="end"
          className="fill-muted-foreground text-[9px]"
        >
          {last.value}{unit ? ` ${unit}` : ''}
        </text>
      </svg>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ProgressScreen({ navigate }: Props) {
  const { state } = useAppStore()
  const { routines, sessions } = state

  const [range, setRange] = useState<Range>('30d')

  // Check if we have enough data
  const totalSessions = sessions.length
  const hasEnoughData = totalSessions >= 2

  if (routines.length === 0 || !hasEnoughData) {
    return (
      <div data-testid="screen-progress" className="flex flex-col min-h-full">
        <PageHeader title="Progress" />
        <div data-testid="progress-not-enough-data" className="flex flex-1 flex-col">
          <EmptyState
            icon={<BarChart3 size={32} aria-hidden="true" />}
            title="Your progress charts will appear here"
            description="Complete two sessions to start tracking your trends."
            actionLabel="Log a session"
            onAction={() => navigate('dashboard')}
          />
        </div>
      </div>
    )
  }

  const weeks = RANGE_WEEKS[range]
  const todayStr = today()
  const rangeStart = weeksAgo(weeks)
  const dateRange = { start: rangeStart, end: todayStr }

  const avoidRoutines = routines.filter(isAvoidRoutine)
  const doRoutines = routines.filter((r) => !isAvoidRoutine(r))

  // Consistency per routine over the selected range.
  // Clamp range start to routine createdAt so new routines are not
  // penalized for days before they existed. Pass todayStr for pro-rating.
  const consistencyData = routines.map((r) => {
    const created = r.createdAt.slice(0, 10)
    const effectiveStart = created > rangeStart ? created : rangeStart
    return {
      routine: r,
      consistency: calculateConsistency(sessions, r, { start: effectiveStart, end: todayStr }, todayStr),
    }
  })

  const rangeSessions = sessionsInRange(sessions, dateRange)

  // ── AVOID stats ───────────────────────────────────────────────────────────
  const avoidStats = avoidRoutines.map((routine) => {
    const inRange = rangeSessions.filter((s) => s.routineId === routine.id)
    const successfulDays = inRange.filter((s) =>
      s.results.some((r) => r.stayedOnTrack === true),
    ).length
    const completionRate =
      inRange.length > 0
        ? Math.round((successfulDays / inRange.length) * 100)
        : 0
    const streak = longestStreak(sessions, routine.id)
    return { routine, successfulDays, completionRate, streak }
  })

  // ── DO: performance deltas (only DO activities) ─────────────────────────────
  const progressEntries = doRoutines.flatMap((r) =>
    r.activities.flatMap((a) => calculateProgress(sessions, a)),
  )

  // ── DO: volume + duration over the selected range (weight-based only) ───────
  let rangeVolume = 0
  for (const routine of doRoutines) {
    for (const activity of routine.activities) {
      if (activity.measurements.some((m) => m.type === 'weight')) {
        for (const session of rangeSessions) {
          if (session.routineId === routine.id) {
            rangeVolume += calculateVolume(session, activity.id)
          }
        }
      }
    }
  }

  let rangeDuration = 0
  for (const session of rangeSessions) {
    if (!doRoutines.some((r) => r.id === session.routineId)) continue
    for (const result of session.results) {
      const dur = result.measurements['duration']
      if (dur !== undefined) {
        rangeDuration += dur
      }
    }
  }

  // ── DO: trend data — pick the first meaningful metric per activity ──────────
  const trendData = doRoutines.flatMap((r) =>
    r.activities.flatMap((a) => {
      const metricTypes = a.measurements
        .filter((m) => m.type !== 'sets' && m.type !== 'reps')
        .map((m) => m.type)

      // For strength, use weight (volume trend)
      if (a.measurements.some((m) => m.type === 'weight')) {
        const points = calculateTrend(sessions, a.id, 'weight')
        if (points.length >= 2) {
          return [{ activity: a, metric: 'weight' as MeasurementType, points }]
        }
      }

      for (const metric of metricTypes) {
        const points = calculateTrend(sessions, a.id, metric)
        if (points.length >= 2) {
          return [{ activity: a, metric, points }]
        }
      }

      return []
    }),
  )

  const rangeLabel =
    range === '7d' ? 'last 7 days' : range === '30d' ? 'last 30 days' : 'last 90 days'

  return (
    <div data-testid="screen-progress" className="flex flex-col min-h-full">
      <PageHeader title="Progress" />

      {/* Time range selector */}
      <div className="flex gap-1 bg-surface-muted rounded-lg p-1 mx-5 mb-4">
        {(['7d', '30d', '90d'] as const).map((r) => (
          <button
            key={r}
            type="button"
            data-testid={`range-${r}`}
            onClick={() => setRange(r)}
            aria-pressed={range === r}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              range === r
                ? 'bg-brand text-brand-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {r === '7d' ? '7 days' : r === '30d' ? '30 days' : '90 days'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-6">
        {/* Consistency per routine */}
        <div>
          <SectionHeader title={`Consistency (${rangeLabel})`} />
          <div className="rounded-xl bg-surface p-4 ring-1 ring-foreground/5">
            <div className="flex flex-col gap-3">
              {consistencyData.map(({ routine, consistency }) => (
                <div key={routine.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground truncate mr-4">
                      {routine.name}
                    </span>
                    <span className="text-muted-foreground">{consistency}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${consistency}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AVOID progress (goal-aware — no weight/volume stats) */}
        {avoidStats.map(({ routine, successfulDays, completionRate, streak }) => (
          <div key={routine.id}>
            <SectionHeader title={routine.name} />
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="On track" value={successfulDays} unit="days" />
              <StatCard label="Success rate" value={completionRate} unit="%" />
              <StatCard label="Best streak" value={streak} unit="days" />
            </div>
          </div>
        ))}

        {/* DO: Performance deltas */}
        {progressEntries.length > 0 && (
          <div>
            <SectionHeader title="Performance" />
            <div className="rounded-xl bg-surface p-4 ring-1 ring-foreground/5">
              <div className="flex flex-col gap-3">
                {progressEntries.map((entry) => {
                  const Icon =
                    entry.deltaPercent > 0
                      ? TrendingUp
                      : entry.deltaPercent < 0
                        ? TrendingDown
                        : Minus
                  const colorClass =
                    entry.deltaPercent > 0
                      ? 'text-success'
                      : entry.deltaPercent < 0
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                  return (
                    <div
                      key={`${entry.activityId}-${entry.metric}`}
                      data-testid="progress-performance-entry"
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {entry.activityName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.firstValue} → {entry.latestValue}{' '}
                          {metricUnit(entry.metric)}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 ${colorClass}`}>
                        <Icon size={14} aria-hidden="true" />
                        <span className="text-sm font-medium">
                          {entry.deltaPercent > 0 ? '+' : ''}
                          {entry.deltaPercent}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* DO: Volume + duration totals */}
        {(rangeVolume > 0 || rangeDuration > 0) && (
          <div>
            <SectionHeader title="Totals" />
            <div className="grid grid-cols-2 gap-3">
              {rangeVolume > 0 && (
                <StatCard
                  label="Volume"
                  value={rangeVolume.toLocaleString()}
                  unit="kg"
                />
              )}
              {rangeDuration > 0 && (
                <StatCard label="Duration" value={formatDuration(rangeDuration)} />
              )}
            </div>
          </div>
        )}

        {/* DO: Trend charts */}
        {trendData.length > 0 && (
          <div>
            <SectionHeader title="Trends" />
            <div className="flex flex-col gap-3">
              {trendData.map(({ activity, metric, points }) => (
                <div
                  key={`${activity.id}-${metric}`}
                  className="rounded-xl bg-surface p-4 ring-1 ring-foreground/5"
                >
                  <p className="text-sm font-medium text-foreground">
                    {activity.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metric} ({metricUnit(metric)})
                  </p>
                  <TrendChart points={points} unit={metricUnit(metric)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
