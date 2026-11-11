/**
 * useNotification — notification scheduling hook.
 *
 * Supports two scheduling modes:
 * - scheduleAtTime: schedule at a specific clock time (e.g. "09:00")
 * - scheduleReminder: schedule after a delay in minutes (legacy)
 *
 * Two notification types:
 * - alert: silent notification
 * - alarm: notification with a short audible tone via Web Audio API
 *
 * Limitations:
 * - Notifications require the browser tab or installed PWA to be alive.
 *   If the user fully closes the browser, the timer is lost.
 * - iOS Safari requires the PWA to be installed to the home screen
 *   (Add to Home Screen) and iOS 16.4+.
 */

import { useCallback, useRef, useState } from 'react'
import type { ReminderType } from '../domain/types'

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

interface ScheduledReminder {
  timerId: ReturnType<typeof setTimeout>
  activityName: string
  fireAt: Date
}

export interface UseNotificationResult {
  /** Current permission state. */
  permission: NotificationPermissionState
  /** Request notification permission from the user. Returns the new state. */
  requestPermission: () => Promise<NotificationPermissionState>
  /** Schedule a notification at a specific clock time (HH:MM). Returns a reminder ID or null. */
  scheduleAtTime: (activityName: string, timeHHMM: string, type: ReminderType) => string | null
  /** Schedule a local notification after a delay. Returns a reminder ID or null. */
  scheduleReminder: (activityName: string, delayMinutes: number) => string | null
  /** Cancel a previously scheduled reminder. */
  cancelReminder: (reminderId: string) => void
  /** The most recently scheduled confirmation message, or null. */
  confirmation: string | null
  /** Clear the confirmation message. */
  clearConfirmation: () => void
}

function getPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission as NotificationPermissionState
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Calculate the delay in milliseconds from now to the next occurrence of
 * the given HH:MM time. If the time has passed today, schedule for tomorrow.
 */
export function msUntilTime(timeHHMM: string, now: Date = new Date()): number {
  const [hours, minutes] = timeHHMM.split(':').map(Number)
  const target = new Date(now)
  target.setHours(hours!, minutes!, 0, 0)

  let delay = target.getTime() - now.getTime()
  if (delay <= 0) {
    // Time has passed today — schedule for tomorrow
    delay += 24 * 60 * 60 * 1000
  }
  return delay
}

/** Play a short audible tone using the Web Audio API. */
function playAlarmTone(): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = 800
    gain.gain.value = 0.3

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    // Fade out after 150ms
    gain.gain.setTargetAtTime(0, ctx.currentTime + 0.15, 0.02)
    osc.stop(ctx.currentTime + 0.25)

    // Cleanup after the tone finishes
    setTimeout(() => ctx.close(), 500)
  } catch {
    // Web Audio API not available — silently ignore
  }
}

export function useNotification(): UseNotificationResult {
  const [permission, setPermission] = useState<NotificationPermissionState>(getPermission)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const reminders = useRef<Map<string, ScheduledReminder>>(new Map())

  const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported')
      return 'unsupported'
    }
    const result = await Notification.requestPermission()
    const state = result as NotificationPermissionState
    setPermission(state)
    return state
  }, [])

  /** Internal: fire a notification and optionally play an alarm tone. */
  const fireNotification = useCallback((activityName: string, type: ReminderType, id: string) => {
    const isAlarm = type === 'alarm'
    new Notification('Keep It Up', {
      body: `Time to start: ${activityName}`,
      icon: '/pwa-192x192.png',
      tag: id,
      silent: !isAlarm,
    })
    if (isAlarm) {
      playAlarmTone()
    }
    reminders.current.delete(id)
  }, [])

  const scheduleAtTime = useCallback(
    (activityName: string, timeHHMM: string, type: ReminderType): string | null => {
      if (permission !== 'granted') return null
      if (type === 'none') return null

      const id = crypto.randomUUID()
      const delayMs = msUntilTime(timeHHMM)
      const fireAt = new Date(Date.now() + delayMs)

      const timerId = setTimeout(() => {
        fireNotification(activityName, type, id)
      }, delayMs)

      reminders.current.set(id, { timerId, activityName, fireAt })
      setConfirmation(`Reminder set for ${formatTime(fireAt)}`)
      setTimeout(() => setConfirmation(null), 3000)

      return id
    },
    [permission, fireNotification],
  )

  const scheduleReminder = useCallback(
    (activityName: string, delayMinutes: number): string | null => {
      if (permission !== 'granted') return null

      const id = crypto.randomUUID()
      const fireAt = new Date(Date.now() + delayMinutes * 60_000)

      const timerId = setTimeout(() => {
        fireNotification(activityName, 'alert', id)
      }, delayMinutes * 60_000)

      reminders.current.set(id, { timerId, activityName, fireAt })
      setConfirmation(`Reminder set for ${formatTime(fireAt)}`)
      setTimeout(() => setConfirmation(null), 3000)

      return id
    },
    [permission, fireNotification],
  )

  const cancelReminder = useCallback((reminderId: string) => {
    const reminder = reminders.current.get(reminderId)
    if (reminder) {
      clearTimeout(reminder.timerId)
      reminders.current.delete(reminderId)
    }
  }, [])

  const clearConfirmation = useCallback(() => setConfirmation(null), [])

  return {
    permission,
    requestPermission,
    scheduleAtTime,
    scheduleReminder,
    cancelReminder,
    confirmation,
    clearConfirmation,
  }
}
