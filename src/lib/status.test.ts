import { describe, expect, it } from 'vitest'
import { computePlotStatuses } from './status'
import type { Plot, Spraying } from './types'

const now = new Date('2026-01-10T12:00:00.000Z')

const plot = (overrides: Partial<Plot> = {}): Plot => ({
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
  ...overrides,
})

const spraying = (appliedAt: string, plotIds = ['plot-1']): Spraying => ({
  id: `spraying-${appliedAt}`,
  applied_at: appliedAt,
  notes: null,
  plot_ids: plotIds,
  items: [],
})

describe('computePlotStatuses', () => {
  it('marks a planned plot with no spraying history as overdue', () => {
    const [result] = computePlotStatuses([plot()], [], 24, now)

    expect(result.status).toBe('overdue')
    expect(result.last_sprayed_at).toBeNull()
    expect(result.next_due_at).toBeNull()
  })

  it('uses the latest spraying to calculate due soon and next due date', () => {
    const lastSprayed = '2026-01-05T12:00:00.000Z'
    const [result] = computePlotStatuses([plot()], [spraying(lastSprayed)], 48, now)

    expect(result.status).toBe('due_soon')
    expect(result.last_sprayed_at).toBe(lastSprayed)
    expect(result.next_due_at).toBe('2026-01-12T12:00:00.000Z')
  })

  it('keeps an unplanned plot out of the spraying status flow', () => {
    const [result] = computePlotStatuses([plot({ planned: false })], [], 24, now)

    expect(result.status).toBe('unplanned')
  })

  it('does not let an unrelated plot spraying affect this plot', () => {
    const [result] = computePlotStatuses(
      [plot()],
      [spraying('2026-01-09T12:00:00.000Z', ['other-plot'])],
      24,
      now,
    )

    expect(result.status).toBe('overdue')
  })
})
