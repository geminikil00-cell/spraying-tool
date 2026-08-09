import type { Plot, PlotStatus, PlotWithStatus, Spraying } from './types'

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000

function findLastSprayedAt(plotId: string, sprayings: Spraying[]): string | null {
  let latest: string | null = null
  for (const spraying of sprayings) {
    if (!spraying.plot_ids.includes(plotId)) continue
    if (latest === null || Date.parse(spraying.applied_at) > Date.parse(latest)) {
      latest = spraying.applied_at
    }
  }
  return latest
}

export function computePlotStatuses(
  plots: Plot[],
  sprayings: Spraying[],
  leadHours: number,
  now: Date = new Date(),
): PlotWithStatus[] {
  const nowMs = now.getTime()

  return plots.map((plot) => {
    const last = findLastSprayedAt(plot.id, sprayings)
    let status: PlotStatus
    let nextDueAt: string | null = null

    if (!plot.planned) {
      status = 'unplanned'
    } else if (last === null) {
      status = 'overdue'
    } else {
      const lastMs = Date.parse(last)
      const nextMs = lastMs + plot.spray_interval_days * DAY_MS
      nextDueAt = new Date(nextMs).toISOString()
      const remindMs = nextMs - leadHours * HOUR_MS

      if (nowMs > nextMs) {
        status = 'overdue'
      } else if (nowMs >= remindMs) {
        status = 'due_soon'
      } else {
        status = 'ok'
      }
    }

    return {
      ...plot,
      status,
      last_sprayed_at: last,
      next_due_at: plot.planned ? nextDueAt : null,
    }
  })
}

export interface ReminderInfo {
  overdue: PlotWithStatus[]
  dueSoon: PlotWithStatus[]
}

export function computeReminders(plots: PlotWithStatus[]): ReminderInfo {
  const byName = (a: PlotWithStatus, b: PlotWithStatus) => a.name.localeCompare(b.name)
  return {
    overdue: plots.filter((p) => p.status === 'overdue').sort(byName),
    dueSoon: plots.filter((p) => p.status === 'due_soon').sort(byName),
  }
}
