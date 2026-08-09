import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { App } from '@capacitor/app'
import type { PlotWithStatus } from './types'

const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000
const SCHEDULE_WINDOW_DAYS = 14

export function stableId(key: string): number {
  let hash = 0
  for (const char of key) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0
  }
  return hash & 0x7fffffff
}

export interface ReminderEntry {
  id: number
  plotId: string
  plotName: string
  fireAt: Date
}

export interface ReminderSchedule {
  scheduled: ReminderEntry[]
  immediate: ReminderEntry[]
}

export function buildReminderSchedule(
  plots: PlotWithStatus[],
  leadHours: number,
  now: Date = new Date(),
): ReminderSchedule {
  const scheduled: ReminderEntry[] = []
  const immediate: ReminderEntry[] = []
  const nowMs = now.getTime()
  const windowEnd = nowMs + SCHEDULE_WINDOW_DAYS * DAY_MS

  for (const plot of plots) {
    if (!plot.planned || !plot.next_due_at) continue

    const nextDueMs = Date.parse(plot.next_due_at)
    const remindMs = nextDueMs - leadHours * HOUR_MS
    const entry: ReminderEntry = {
      id: stableId(`${plot.id}|${plot.next_due_at}`),
      plotId: plot.id,
      plotName: plot.name,
      fireAt: new Date(remindMs),
    }

    if (remindMs > nowMs && remindMs <= windowEnd) {
      scheduled.push(entry)
    } else if (remindMs <= nowMs) {
      immediate.push(entry)
    }
  }

  return { scheduled, immediate }
}

let refreshFn: (() => void) | null = null
const firedImmediate = new Set<string>()

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export async function initNotifications(refresh: () => void): Promise<void> {
  if (!isNative()) return
  refreshFn = refresh
  await LocalNotifications.requestPermissions()
  App.addListener('resume', () => refreshFn?.())
}

export async function updateNativeReminders(
  plots: PlotWithStatus[],
  leadHours: number,
  translate: (key: string) => string,
): Promise<void> {
  if (!isNative()) return

  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications })
  }

  const { scheduled, immediate } = buildReminderSchedule(plots, leadHours)
  const notifications = []

  for (const entry of scheduled) {
    notifications.push({
      id: entry.id,
      title: translate('notif.banner.overdue'),
      body: entry.plotName,
      schedule: { at: entry.fireAt },
    })
  }

  for (const entry of immediate) {
    const key = `${entry.plotId}|immediate`
    if (firedImmediate.has(key)) continue
    firedImmediate.add(key)
    notifications.push({
      id: entry.id,
      title: translate('notif.banner.overdue'),
      body: entry.plotName,
      schedule: { at: new Date(Date.now() + 5000) },
    })
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
  }
}

export async function sendTestNotification(body: string): Promise<void> {
  if (!isNative()) {
    alert(body)
    return
  }
  await LocalNotifications.schedule({
    notifications: [{
      id: 1,
      title: 'SprayLog',
      body,
      schedule: { at: new Date(Date.now() + 3000) },
    }],
  })
}
