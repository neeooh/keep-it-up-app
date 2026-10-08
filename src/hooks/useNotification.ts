/**
 * useNotification — local notification scheduling hook.
 *
 * Handles permission requests and scheduling local notifications via
 * the Notification API + setTimeout.  Tracks active timers so they can
 * be cancelled.
 *
 * Limitations:
 * - Notifications require the browser tab or installed PWA to be alive.
 *   If the user fully closes the browser, the timer is lost.
 * - iOS Safari requires the PWA to be installed to the home screen
 *   (Add to Home Screen) and iOS 16.4+.
 */

import { useCallback, useRef, useState } from 'react'

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
  /** Schedule a local notification. Returns a reminder ID or null if denied. */
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

  const scheduleReminder = useCallback(
    (activityName: string, delayMinutes: number): string | null => {
      if (permission !== 'granted') return null

      const id = crypto.randomUUID()
      const fireAt = new Date(Date.now() + delayMinutes * 60_000)

      const timerId = setTimeout(() => {
        new Notification('Keep It Up', {
          body: `Time to start: ${activityName}`,
          icon: '/pwa-192x192.png',
          tag: id,
        })
        reminders.current.delete(id)
      }, delayMinutes * 60_000)

      reminders.current.set(id, { timerId, activityName, fireAt })
      setConfirmation(`Reminder set for ${formatTime(fireAt)}`)

      // Auto-clear confirmation after 3 seconds
      setTimeout(() => setConfirmation(null), 3000)

      return id
    },
    [permission],
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
    scheduleReminder,
    cancelReminder,
    confirmation,
    clearConfirmation,
  }
}
