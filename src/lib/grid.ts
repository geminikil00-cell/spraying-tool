import type { Plot } from './types'

export const GRID_COLUMNS = 12

export function suggestGridPosition(plots: Plot[]): { x: number; y: number } {
  let y = 0
  for (const plot of plots) {
    y = Math.max(y, plot.grid_y + plot.grid_h)
  }
  return { x: 0, y }
}

export function clampGrid(
  x: number,
  y: number,
  w: number,
  h: number,
): { x: number; y: number; w: number; h: number } {
  const safeX = Math.min(Math.max(Math.floor(x) || 0, 0), GRID_COLUMNS - 1)
  const safeY = Math.max(Math.floor(y) || 0, 0)
  const safeW = Math.min(Math.max(Math.floor(w) || 1, 1), GRID_COLUMNS - safeX)
  const safeH = Math.max(Math.floor(h) || 1, 1)
  return { x: safeX, y: safeY, w: safeW, h: safeH }
}
