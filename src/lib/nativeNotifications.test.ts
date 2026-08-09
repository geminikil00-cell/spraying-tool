import { describe, expect, it } from 'vitest'
import { buildReminderSchedule, stableId } from './nativeNotifications'
import type { PlotWithStatus } from './types'

const now = new Date('2026-01-10T12:00:00.000Z')

const plot = (overrides: Partial<PlotWithStatus> = {}): PlotWithStatus => ({
  id: 'plot-1',
  name: 'Greenhouse 1',
  kind: 'greenhouse',
  spray_interval_days: 7,
  planned: true,
  grid_x: 0,
  grid_y: 0,
  grid_w: 2,
  grid_h: 2,
  notes: null,
  created_at: now.toISOString(),
  status: 'ok',
  last_sprayed_at: null,
  next_due_at: null,
  ...overrides,
})

describe('stableId', () => {
  it('is deterministic and non-negative', () => {
    expect(stableId('plot-1|2026-01-12T12:00:00.000Z')).toBe(stableId('plot-1|2026-01-12T12:00:00.000Z'))
    expect(stableId('anything')).toBeGreaterThanOrEqual(0)
  })

  it('produces different ids for different keys', () => {
    expect(stableId('a')).not.toBe(stableId('b'))
  })
})

describe('buildReminderSchedule', () => {
  it('schedules a reminder at next_due_at minus lead hours', () => {
    const plots = [
      plot({ status: 'ok', next_due_at: '2026-01-13T12:00:00.000Z' }),
    ]
    const result = buildReminderSchedule(plots, 24, now)

    expect(result.scheduled).toHaveLength(1)
    expect(result.scheduled[0].fireAt.toISOString()).toBe('2026-01-12T12:00:00.000Z')
    expect(result.scheduled[0].plotId).toBe('plot-1')
  })

  it('excludes plots whose reminder window is beyond 14 days', () => {
    const plots = [
      plot({ status: 'ok', next_due_at: '2026-02-10T12:00:00.000Z' }),
    ]
    const result = buildReminderSchedule(plots, 24, now)

    expect(result.scheduled).toHaveLength(0)
  })

  it('flags overdue plots as immediate', () => {
    const plots = [plot({ status: 'overdue', next_due_at: '2026-01-08T12:00:00.000Z' })]
    const result = buildReminderSchedule(plots, 24, now)

    expect(result.immediate).toHaveLength(1)
    expect(result.immediate[0].plotId).toBe('plot-1')
    expect(result.scheduled).toHaveLength(0)
  })

  it('excludes unplanned plots', () => {
    const plots = [plot({ status: 'unplanned', planned: false })]
    const result = buildReminderSchedule(plots, 24, now)

    expect(result.scheduled).toHaveLength(0)
    expect(result.immediate).toHaveLength(0)
  })

  it('marks a plot inside the lead window as immediate too', () => {
    const plots = [
      plot({ status: 'due_soon', next_due_at: '2026-01-11T00:00:00.000Z' }),
    ]
    const result = buildReminderSchedule(plots, 24, now)

    expect(result.immediate).toHaveLength(1)
    expect(result.scheduled).toHaveLength(0)
  })
})
