/**
 * ProgressScreen — trends and progress.
 *
 * Shows consistency %, performance deltas, volume/duration totals, and
 * inline SVG trend charts. Handles the "not enough data" state.
 *
 * Spec reference: mvp_product_spec.md section 16.
 */

import { BarChart3, TrendingUp, TrendingDown, Minus, Play } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { useAppStore } from '../store/useAppStore'
import {
  calculateConsistency,
  calculateProgress,
  calculateTrend,
  calculateVolume,
  sessionsInRange,
} from '../domain/calculations'
import type { Navigate } from '../App'
import type { MeasurementType, TrendPoint } from '../domain/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function weeksAgo(weeks: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - weeks * 7)
  return d.toISOString().slice(0, 10)
}

function startOfISOWeek(d: Date): string {
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() + diff)
  return monday.toISOString().slice(0, 10)
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
          className="text-foreground"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r="3"
            className="fill-foreground"
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

  const todayStr = today()
  const fourWeeksAgo = weeksAgo(4)
  const weekStart = startOfISOWeek(new Date())

  // Check if we have enough data
  const totalSessions = sessions.length
  const hasEnoughData = totalSessions >= 2

  if (routines.length === 0 || !hasEnoughData) {
    return (
      <div data-testid="screen-progress" className="flex flex-col min-h-full">
        <div className="px-4 pt-8 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Progress
          </h1>
        </div>
        <div
          data-testid="progress-not-enough-data"
          className="flex flex-1 flex-col items-center justify-center px-6 text-center"
        >
          <BarChart3
            size={40}
            className="text-muted-foreground mb-3"
            aria-hidden="true"
          />
          <p className="text-foreground font-medium">Your progress charts will appear here</p>
          <p className="text-sm text-muted-foreground mt-1">
            Complete two sessions to start tracking your trends.
          </p>
          <Button
            data-testid="progress-empty-cta"
            onClick={() => navigate('dashboard')}
            className="mt-4"
          >
            <Play size={16} className="mr-2" aria-hidden="true" />
            Log a session
          </Button>
        </div>
      </div>
    )
  }

  // Consistency per routine (4 weeks)
  const consistencyData = routines.map((r) => ({
    routine: r,
    consistency: calculateConsistency(sessions, r, {
      start: fourWeeksAgo,
      end: todayStr,
    }),
  }))

  // Progress deltas
  const progressEntries = routines.flatMap((r) =>
    r.activities.flatMap((a) => calculateProgress(sessions, a)),
  )

  // Volume this week (weight-based activities)
  const weekSessions = sessionsInRange(sessions, {
    start: weekStart,
    end: todayStr,
  })
  let weeklyVolume = 0
  for (const routine of routines) {
    for (const activity of routine.activities) {
      if (activity.measurements.some((m) => m.type === 'weight')) {
        for (const session of weekSessions) {
          weeklyVolume += calculateVolume(session, activity.id)
        }
      }
    }
  }

  // Duration this week
  let weeklyDuration = 0
  for (const session of weekSessions) {
    for (const result of session.results) {
      const dur = result.measurements['duration']
      if (dur !== undefined) {
        weeklyDuration += dur
      }
    }
  }

  // Trend data — pick the first meaningful metric per activity
  const trendData = routines.flatMap((r) =>
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

  return (
    <div data-testid="screen-progress" className="flex flex-col min-h-full">
      <div className="px-4 pt-8 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Progress
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-5">
        {/* Consistency per routine */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Consistency (4 weeks)
          </h2>
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-3">
                {consistencyData.map(({ routine, consistency }) => (
                  <div key={routine.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-foreground truncate mr-4">
                        {routine.name}
                      </span>
                      <span className="text-muted-foreground">{consistency}%</span>
                    </div>
                    <Progress value={consistency} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance deltas */}
        {progressEntries.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              Performance
            </h2>
            <Card>
              <CardContent className="pt-4">
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
                        ? 'text-green-600'
                        : entry.deltaPercent < 0
                          ? 'text-red-500'
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Volume this week */}
        {weeklyVolume > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              Volume
            </h2>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold text-foreground">
                  {weeklyVolume.toLocaleString()} kg
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  this week
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Duration this week */}
        {weeklyDuration > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              Duration
            </h2>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold text-foreground">
                  {formatDuration(weeklyDuration)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  this week
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trend charts */}
        {trendData.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              Trends
            </h2>
            {trendData.map(({ activity, metric, points }) => (
              <Card key={`${activity.id}-${metric}`} className="mb-3">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-foreground">
                    {activity.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metric} ({metricUnit(metric)})
                  </p>
                  <TrendChart points={points} unit={metricUnit(metric)} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
