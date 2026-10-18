/**
 * SettingsScreen — user preferences and data export.
 *
 * Two sections:
 * 1. Profile — set a display name used in the dashboard greeting.
 * 2. Your Data — export all routines and sessions as JSON, CSV, or Markdown.
 *
 * Accessible via the cog icon in the dashboard header.
 */

import { useState } from 'react'
import { FileJson, FileSpreadsheet, FileText, Download } from 'lucide-react'
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SettingsScreen({ navigate }: Props) {
  const { preferences, updatePreferences } = usePreferences()
  const { state } = useAppStore()
  const [nameValue, setNameValue] = useState(preferences.userName)
  const [saved, setSaved] = useState(false)

  function handleSaveName() {
    updatePreferences({ userName: nameValue.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sessionCount = state.sessions.length
  const routineCount = state.routines.length
  const hasData = sessionCount > 0 || routineCount > 0
  const dateStamp = new Date().toISOString().slice(0, 10)

  function handleExportJSON() {
    const content = exportJSON(state)
    downloadFile(content, `keep-it-up-${dateStamp}.json`, 'application/json')
  }

  function handleExportCSV() {
    const content = exportCSV(state)
    downloadFile(content, `keep-it-up-${dateStamp}.csv`, 'text/csv')
  }

  function handleExportMarkdown() {
    const content = exportMarkdown(state)
    downloadFile(content, `keep-it-up-${dateStamp}.md`, 'text/markdown')
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
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-name">Your name</Label>
              <p className="text-sm text-muted-foreground">
                Used in the dashboard greeting.
              </p>
              <div className="flex gap-2">
                <Input
                  id="user-name"
                  data-testid="settings-name-input"
                  type="text"
                  placeholder="Enter your name"
                  value={nameValue}
                  onChange={(e) => {
                    setNameValue(e.target.value)
                    setSaved(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                  }}
                  className="flex-1"
                  maxLength={50}
                />
                <Button
                  data-testid="settings-save-name"
                  onClick={handleSaveName}
                  disabled={nameValue.trim() === preferences.userName}
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  Save
                </Button>
              </div>
              {saved && (
                <p
                  data-testid="settings-name-saved"
                  className="text-sm text-success font-medium"
                >
                  Name saved.
                </p>
              )}
            </div>
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

          <div className="flex flex-col gap-2">
            <Button
              data-testid="export-json"
              variant="outline"
              onClick={handleExportJSON}
              disabled={!hasData}
              className="justify-start gap-3 h-12"
            >
              <FileJson size={18} className="text-brand shrink-0" aria-hidden="true" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Export as JSON</span>
                <span className="text-xs text-muted-foreground">Full backup. All data included.</span>
              </div>
              <Download size={14} className="ml-auto text-muted-foreground shrink-0" aria-hidden="true" />
            </Button>

            <Button
              data-testid="export-csv"
              variant="outline"
              onClick={handleExportCSV}
              disabled={!hasData}
              className="justify-start gap-3 h-12"
            >
              <FileSpreadsheet size={18} className="text-brand shrink-0" aria-hidden="true" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Export as CSV</span>
                <span className="text-xs text-muted-foreground">Open in Excel or Google Sheets.</span>
              </div>
              <Download size={14} className="ml-auto text-muted-foreground shrink-0" aria-hidden="true" />
            </Button>

            <Button
              data-testid="export-markdown"
              variant="outline"
              onClick={handleExportMarkdown}
              disabled={!hasData}
              className="justify-start gap-3 h-12"
            >
              <FileText size={18} className="text-brand shrink-0" aria-hidden="true" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Export as Markdown</span>
                <span className="text-xs text-muted-foreground">Readable summary for notes and journals.</span>
              </div>
              <Download size={14} className="ml-auto text-muted-foreground shrink-0" aria-hidden="true" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
