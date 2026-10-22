/**
 * ProgressScreen — trends, progress, and weekly review.
 *
 * Shows a time-range selector, consistency, performance deltas, volume/duration
 * totals, inline SVG trend charts, and a weekly review card with past reviews.
 * Progress is goal-aware:
 * - AVOID activities show successful days, completion rate, and longest streak.
 * - DO activities show current performance metrics and trends.
 *
 * Spec reference: mvp_product_spec.md section 16.
 */

import { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Minus, CalendarCheck } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { StatCard } from '../components/StatCard'
import { SectionHeader } from '../components/SectionHeader'
import { Button } from '../components/ui/button'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAppStore } from '../store/useAppStore'
import {
  calculateConsistency,
  calculateProgress,
  calculateTrend,
  calculateVolume,
  calculateWeeklySummary,
  sessionsForRoutine,
  sessionsInRange,
} from '../domain/calculations'
import type { Navigate } from '../App'
import type { MeasurementType, Routine, Session, TrendPoint, WeeklySummary } from '../domain/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
  onEditRoutine: (routineId: string) => void
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

// ─── Weekly review date helpers ───────────────────────────────────────────────

/** Return the Monday of the previous ISO week. */
function previousWeekStart(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const thisMonday = new Date(now)
  thisMonday.setUTCDate(now.getUTCDate() + diff)
  thisMonday.setUTCDate(thisMonday.getUTCDate() - 7)
  return thisMonday.toISOString().slice(0, 10)
}

/** Return the Sunday (YYYY-MM-DD) of a week given its Monday. */
function weekSunday(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const monday = new Date(Date.UTC(y!, m! - 1, d!))
  monday.setUTCDate(monday.getUTCDate() + 6)
  return monday.toISOString().slice(0, 10)
}

/** Format as "5 Oct – 11 Oct". */
function formatWeekRange(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const monday = new Date(Date.UTC(y!, m! - 1, d!))
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  const fmt = (dt: Date) => dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt(monday)} \u2013 ${fmt(sunday)}`
}

/** Days with at least one session in the current week (Mon-now). */
function daysWithSessionsThisWeek(sessions: Session[]): number {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const thisMonday = new Date(now)
  thisMonday.setUTCDate(now.getUTCDate() + diff)
  const mondayStr = thisMonday.toISOString().slice(0, 10)
  const todayStr = now.toISOString().slice(0, 10)

  const days = new Set<string>()
  for (const s of sessions) {
    const d = s.completedAt.slice(0, 10)
    if (d >= mondayStr && d <= todayStr) days.add(d)
  }
  return days.size
}

/** Days until next Monday. */
function daysUntilMonday(): number {
  const now = new Date()
  const day = now.getUTCDay()
  return day === 0 ? 1 : (8 - day)
}

/** Get past weeks (up to N) that have session data, newest first. */
function pastReviewWeeks(sessions: Session[], maxWeeks: number): { weekStart: string; weekEnd: string }[] {
  const weeks: { weekStart: string; weekEnd: string }[] = []
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const thisMonday = new Date(now)
  thisMonday.setUTCDate(now.getUTCDate() + diff)

  for (let i = 1; i <= maxWeeks; i++) {
    const monday = new Date(thisMonday)
    monday.setUTCDate(thisMonday.getUTCDate() - i * 7)
    const mondayStr = monday.toISOString().slice(0, 10)
    const sundayStr = weekSunday(mondayStr)

    const hasSessions = sessions.some((s) => {
      const d = s.completedAt.slice(0, 10)
      return d >= mondayStr && d <= sundayStr
    })

    if (hasSessions) {
      weeks.push({ weekStart: mondayStr, weekEnd: sundayStr })
    }
  }
  return weeks
}

// ─── Segmented circle SVG ─────────────────────────────────────────────────────

function SegmentedCircle({ filled, total }: { filled: number; total: number }) {
  const size = 64
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const gap = 4 // degrees gap between segments
  const segmentAngle = (360 - gap * total) / total

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-hidden="true"
    >
      {Array.from({ length: total }, (_, i) => {
        const startAngle = i * (segmentAngle + gap) - 90
        const endAngle = startAngle + segmentAngle
        const isFilled = i < filled

        const startRad = (startAngle * Math.PI) / 180
        const endRad = (endAngle * Math.PI) / 180

        const x1 = center + radius * Math.cos(startRad)
        const y1 = center + radius * Math.sin(startRad)
        const x2 = center + radius * Math.cos(endRad)
        const y2 = center + radius * Math.sin(endRad)

        const largeArc = segmentAngle > 180 ? 1 : 0

        return (
          <path
            key={i}
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke={isFilled ? 'var(--brand)' : 'var(--border)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
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

// ─── Review countdown card (shared between empty and full state) ──────────────

function ReviewCountdownCard({
  daysLogged,
  daysLeft,
}: {
  daysLogged: number
  daysLeft: number
}) {
  return (
    <div data-testid="review-card-countdown" className="rounded-xl bg-surface p-4 ring-1 ring-foreground/5">
      <div className="flex items-center gap-4">
        <SegmentedCircle filled={daysLogged} total={7} />
        <div>
          <p className="text-sm font-medium text-foreground">
            {daysLogged} of 7 days
          </p>
          <p className="text-xs text-muted-foreground">
            {daysLeft <= 1
              ? 'Your first review is almost ready'
              : `Review ready in ${daysLeft} days`
            }
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Your weekly review builds as you log sessions through the week.
      </p>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ProgressScreen({ navigate, onEditRoutine }: Props) {
  const { state } = useAppStore()
  const { routines, sessions } = state

  const [range, setRange] = useState<Range>('30d')

  // Check if we have enough data for progress charts
  const totalSessions = sessions.length
  const hasEnoughData = totalSessions >= 2

  // Weekly Review data (computed regardless of hasEnoughData)
  const lastWeekStart = previousWeekStart()
  const lastWeekEnd = weekSunday(lastWeekStart)
  const reviewSessions = sessionsInRange(sessions, { start: lastWeekStart, end: lastWeekEnd })
  const hasReviewData = reviewSessions.length > 0
  const daysLogged = daysWithSessionsThisWeek(sessions)
  const daysLeft = daysUntilMonday()
  const pastWeeks = pastReviewWeeks(sessions, 12)

  let reviewSummary: WeeklySummary | null = null
  if (hasReviewData) {
    reviewSummary = calculateWeeklySummary(sessions, routines, lastWeekStart)
  }

  // ── Empty / not-enough-data state ─────────────────────────────────────────
  if (routines.length === 0 || !hasEnoughData) {
    return (
      <div data-testid="screen-progress" className="flex flex-col min-h-full">
        <PageHeader title="Progress" rightAction={<ThemeToggle />} />
        <div data-testid="progress-not-enough-data" className="flex flex-col px-5 pb-6">
          {/* Review countdown first, even in empty state */}
          <div className="mb-6">
            <SectionHeader title="Weekly review" />
            <ReviewCountdownCard daysLogged={daysLogged} daysLeft={daysLeft} />
          </div>
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
      <PageHeader title="Progress" rightAction={<ThemeToggle />} />

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-6">
        {/* Weekly Review section — at the top */}
        <div>
          <SectionHeader title="Weekly review" />
          {hasReviewData && reviewSummary ? (
            <div data-testid="review-card-ready" className="rounded-xl bg-surface p-4 ring-1 ring-foreground/5">
              <div className="flex items-center gap-3 mb-3">
                <CalendarCheck size={20} className="text-brand shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground">{formatWeekRange(lastWeekStart)}</p>
                  <p className="text-xs text-muted-foreground">
                    {reviewSummary.entries.reduce((s, e) => s + e.completed, 0)} of{' '}
                    {reviewSummary.entries.reduce((s, e) => s + e.planned, 0)} sessions completed
                  </p>
                </div>
                <span className="ml-auto text-lg font-semibold text-brand">
                  {reviewSummary.overallConsistency}%
                </span>
              </div>
              <Button
                data-testid="review-week-button"
                onClick={() => navigate('weekly-review')}
                className="w-full"
              >
                Review your week
              </Button>
            </div>
          ) : (
            <ReviewCountdownCard daysLogged={daysLogged} daysLeft={daysLeft} />
          )}
        </div>

        {/* Past reviews */}
        {pastWeeks.length > 0 && (
          <div>
            <SectionHeader title="Past reviews" />
            <div className="flex flex-col gap-2">
              {pastWeeks.map(({ weekStart: ws }) => {
                const summary = calculateWeeklySummary(sessions, routines, ws)
                return (
                  <button
                    key={ws}
                    type="button"
                    data-testid={`past-review-${ws}`}
                    onClick={() => navigate('weekly-review')}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left ring-1 ring-foreground/5 hover:bg-surface-muted transition-colors w-full"
                  >
                    <span className="text-sm text-foreground">{formatWeekRange(ws)}</span>
                    <span className="text-sm font-medium text-brand">{summary.overallConsistency}%</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Time range selector */}
        <div className="flex gap-1 bg-surface-muted rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              type="button"
              data-testid={`range-${r}`}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                range === r
                  ? 'bg-brand text-brand-foreground shadow-sm ring-1 ring-brand-dark/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface'
              }`}
            >
              {r === '7d' ? '7 days' : r === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>

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
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
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
            <SectionHeader title={`Totals · ${rangeLabel}`} />
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
