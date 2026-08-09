import { describe, expect, it } from 'vitest'
import { clampGrid, suggestGridPosition } from './grid'
import type { Plot } from './types'

const plot = (overrides: Partial<Plot>): Plot => ({
  id: 'p',
  name: 'P',
  kind: 'open_field',
  spray_interval_days: 7,
  planned: true,
  grid_x: 0,
  grid_y: 0,
  grid_w: 2,
  grid_h: 2,
  notes: null,
  created_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('suggestGridPosition', () => {
  it('places the first plot at the origin', () => {
    expect(suggestGridPosition([])).toEqual({ x: 0, y: 0 })
  })

  it('stacks below the lowest existing plot', () => {
    const plots = [plot({ grid_y: 0, grid_h: 2 }), plot({ grid_y: 3, grid_h: 1 })]
    expect(suggestGridPosition(plots)).toEqual({ x: 0, y: 4 })
  })
})

describe('clampGrid', () => {
  it('fixes invalid sizes and positions', () => {
    expect(clampGrid(-1, -2, 0, 0)).toEqual({ x: 0, y: 0, w: 1, h: 1 })
  })

  it('keeps the plot inside the 12-column board', () => {
    expect(clampGrid(10, 0, 5, 2)).toEqual({ x: 10, y: 0, w: 2, h: 2 })
    expect(clampGrid(20, 0, 4, 4)).toEqual({ x: 11, y: 0, w: 1, h: 4 })
  })

  it('keeps valid values unchanged', () => {
    expect(clampGrid(0, 0, 12, 12)).toEqual({ x: 0, y: 0, w: 12, h: 12 })
  })
})
