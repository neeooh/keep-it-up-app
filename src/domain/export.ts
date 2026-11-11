/**
 * Export utilities — convert app state to downloadable formats.
 *
 * Three formats:
 * - JSON: full-fidelity backup of all commitments and sessions.
 * - CSV: one row per session, spreadsheet-friendly.
 * - Markdown: human-readable summary for notes and journals.
 */

import type { AppState, Commitment, MeasurementType } from '../domain/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function metricUnit(type: MeasurementType): string {
  switch (type) {
    case 'duration': return 'min'
    case 'distance': return 'km'
    case 'quantity': return ''
    case 'sets': return 'sets'
    case 'reps': return 'reps'
    case 'weight': return 'kg'
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function commitmentById(commitments: Commitment[], id: string): Commitment | undefined {
  return commitments.find((c) => c.id === id)
}

// ─── JSON export ──────────────────────────────────────────────────────────────

export function exportJSON(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Build a CSV string with one row per session.
 *
 * Columns: Date, Commitment, Activity, Type, Measurements, Sets, Stayed On Track
 */
export function exportCSV(state: AppState): string {
  const header = ['Date', 'Commitment', 'Activity', 'Direction', 'Measurements', 'Sets', 'Stayed On Track']
  const rows: string[][] = []

  const sorted = [...state.sessions].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  )

  for (const session of sorted) {
    const commitment = commitmentById(state.commitments, session.commitmentId)
    const commitmentName = commitment?.name ?? 'Unknown'

    for (const result of session.results) {
      const activity = commitment?.activities.find((a) => a.id === result.activityId)
      const activityName = activity?.name ?? 'Unknown'
      const direction = activity?.direction ?? ''

      // Measurements
      const measurementParts: string[] = []
      for (const [type, value] of Object.entries(result.measurements)) {
        if (value !== undefined) {
          const unit = metricUnit(type as MeasurementType)
          measurementParts.push(`${value}${unit ? ' ' + unit : ''}`)
        }
      }

      // Sets
      const setsParts: string[] = []
      if (result.sets && result.sets.length > 0) {
        for (const s of result.sets) {
          const parts: string[] = []
          if (s.weight !== undefined) parts.push(`${s.weight} kg`)
          if (s.reps !== undefined) parts.push(`${s.reps} reps`)
          setsParts.push(parts.join(' × '))
        }
      }

      // Stayed on track
      const stayedOnTrack =
        result.stayedOnTrack === true ? 'Yes'
        : result.stayedOnTrack === false ? 'No'
        : ''

      rows.push([
        session.completedAt.slice(0, 10),
        commitmentName,
        activityName,
        direction,
        measurementParts.join('; '),
        setsParts.join('; '),
        stayedOnTrack,
      ])
    }
  }

  const lines = [
    header.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ]
  return lines.join('\n')
}

// ─── Markdown export ──────────────────────────────────────────────────────────

/**
 * Build a Markdown document with commitments and session history.
 */
export function exportMarkdown(state: AppState): string {
  const lines: string[] = []

  lines.push('# Keep It Up — Data Export')
  lines.push('')
  lines.push(`Exported on ${formatDate(new Date().toISOString())}`)
  lines.push('')

  // Commitments
  lines.push('## Commitments')
  lines.push('')

  if (state.commitments.length === 0) {
    lines.push('No commitments.')
  } else {
    for (const commitment of state.commitments) {
      lines.push(`### ${commitment.name}`)
      lines.push('')
      lines.push(`- Created: ${formatDate(commitment.createdAt)}`)
      if (commitment.challengeDurationDays) {
        lines.push(`- Challenge: ${commitment.challengeDurationDays} days (started ${commitment.challengeStartDate ?? 'unknown'})`)
      }
      lines.push(`- Activities: ${commitment.activities.length}`)
      lines.push('')

      for (const activity of commitment.activities) {
        lines.push(`**${activity.name}** (${activity.direction})`)
        const details: string[] = []
        details.push(`Frequency: ${activity.frequency}`)
        if (activity.scheduledDays && activity.scheduledDays.length > 0) {
          const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
          details.push(`Days: ${activity.scheduledDays.map((d) => dayNames[d - 1]).join(', ')}`)
        }
        if (activity.preferredTime) {
          details.push(`Preferred time: ${activity.preferredTime}`)
        }
        for (const m of activity.measurements) {
          const unit = m.unit ?? metricUnit(m.type)
          const target = m.target ? ` (target: ${m.target}${unit ? ' ' + unit : ''})` : ''
          details.push(`${m.type}${target}`)
        }
        lines.push(details.map((d) => `  - ${d}`).join('\n'))
        lines.push('')
      }
    }
  }

  // Sessions
  lines.push('## Session History')
  lines.push('')

  const sorted = [...state.sessions].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  )

  if (sorted.length === 0) {
    lines.push('No sessions recorded.')
  } else {
    lines.push(`${sorted.length} session${sorted.length === 1 ? '' : 's'} total.`)
    lines.push('')

    // Group by date
    let currentDate = ''
    for (const session of sorted) {
      const dateStr = session.completedAt.slice(0, 10)
      if (dateStr !== currentDate) {
        currentDate = dateStr
        lines.push(`### ${formatDate(session.completedAt)}`)
        lines.push('')
      }

      const commitment = commitmentById(state.commitments, session.commitmentId)
      lines.push(`**${commitment?.name ?? 'Unknown commitment'}** — ${formatDateTime(session.completedAt)}`)
      lines.push('')

      for (const result of session.results) {
        const activity = commitment?.activities.find((a) => a.id === result.activityId)
        const name = activity?.name ?? 'Unknown'

        if (result.stayedOnTrack !== undefined) {
          lines.push(`- ${name}: ${result.stayedOnTrack ? '✓ Stayed on track' : '✗ Slipped'}`)
        } else if (result.sets && result.sets.length > 0) {
          const setLines = result.sets
            .map((s, i) => {
              const parts: string[] = []
              if (s.weight !== undefined) parts.push(`${s.weight} kg`)
              if (s.reps !== undefined) parts.push(`${s.reps} reps`)
              return `  ${i + 1}. ${parts.join(' × ')}`
            })
            .join('\n')
          lines.push(`- ${name}:`)
          lines.push(setLines)
        } else {
          const parts: string[] = []
          for (const [type, value] of Object.entries(result.measurements)) {
            if (value !== undefined) {
              const unit = metricUnit(type as MeasurementType)
              parts.push(`${value}${unit ? ' ' + unit : ''}`)
            }
          }
          if (parts.length > 0) {
            lines.push(`- ${name}: ${parts.join(', ')}`)
          }
        }
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

// ─── Download helper ──────────────────────────────────────────────────────────

/**
 * Trigger a browser download of the given content as a file.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
