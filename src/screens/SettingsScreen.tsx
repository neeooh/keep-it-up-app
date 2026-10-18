/**
 * SettingsScreen — user preferences and data export.
 *
 * Two sections:
 * 1. Profile — display name auto-saves as the user types (debounced).
 * 2. Your Data — format dropdown + single export button.
 *
 * Accessible via the cog icon in the dashboard header.
 */

import { useState, useEffect, useRef } from 'react'
import { Download } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { PageHeader } from '../components/PageHeader'
import { SectionHeader } from '../components/SectionHeader'
import { ThemeToggle } from '../components/ThemeToggle'
import { usePreferences } from '../hooks/usePreferences'
import { useAppStore } from '../store/useAppStore'
import { exportJSON, exportCSV, exportMarkdown, downloadFile } from '../domain/export'
import type { Navigate } from '../App'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: Navigate
}

// ─── Export format options ────────────────────────────────────────────────────

type ExportFormat = 'json' | 'csv' | 'markdown'

const FORMAT_OPTIONS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'json', label: 'JSON', description: 'Full backup — all data included' },
  { value: 'csv', label: 'CSV', description: 'Spreadsheet — Excel, Google Sheets' },
  { value: 'markdown', label: 'Markdown', description: 'Readable summary for notes' },
]

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SettingsScreen({ navigate }: Props) {
  const { preferences, updatePreferences } = usePreferences()
  const { state } = useAppStore()
  const [nameValue, setNameValue] = useState(preferences.userName)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-save name with a 400ms debounce.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      const trimmed = nameValue.trim()
      if (trimmed !== preferences.userName) {
        updatePreferences({ userName: trimmed })
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [nameValue, preferences.userName, updatePreferences])

  const sessionCount = state.sessions.length
  const routineCount = state.routines.length
  const hasData = sessionCount > 0 || routineCount > 0
  const dateStamp = new Date().toISOString().slice(0, 10)

  function handleExport() {
    switch (exportFormat) {
      case 'json':
        downloadFile(exportJSON(state), `keep-it-up-${dateStamp}.json`, 'application/json')
        break
      case 'csv':
        downloadFile(exportCSV(state), `keep-it-up-${dateStamp}.csv`, 'text/csv')
        break
      case 'markdown':
        downloadFile(exportMarkdown(state), `keep-it-up-${dateStamp}.md`, 'text/markdown')
        break
    }
  }

  return (
    <div data-testid="screen-settings" className="flex flex-col min-h-full">
      <PageHeader
        title="Settings"
        backAction={() => navigate('dashboard')}
        rightAction={<ThemeToggle />}
      />

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-6">
        {/* ── Profile section ──────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Profile" />
          <div className="flex flex-col gap-1.5 mt-2">
            <Label htmlFor="user-name">Your name</Label>
            <p className="text-sm text-muted-foreground">
              Used in the dashboard greeting.
            </p>
            <Input
              id="user-name"
              data-testid="settings-name-input"
              type="text"
              placeholder="Enter your name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              maxLength={50}
            />
          </div>
        </section>

        {/* ── Data export section ──────────────────────────────────────── */}
        <section>
          <SectionHeader title="Your data" />
          <p className="text-sm text-muted-foreground mt-2 mb-3">
            {hasData
              ? `${routineCount} ${routineCount === 1 ? 'routine' : 'routines'} and ${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'} available to export.`
              : 'No data to export yet. Complete some sessions first.'}
          </p>

          <div className="flex gap-2">
            <select
              data-testid="export-format-select"
              aria-label="Export format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.description}
                </option>
              ))}
            </select>

            <Button
              data-testid="export-button"
              onClick={handleExport}
              disabled={!hasData}
              className="bg-brand text-brand-foreground hover:bg-brand/90 shrink-0"
            >
              <Download size={16} className="mr-1.5" aria-hidden="true" />
              Export
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
