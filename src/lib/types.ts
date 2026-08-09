export type MaterialType =
  | 'pesticide'
  | 'insecticide'
  | 'fungicide'
  | 'herbicide'
  | 'fertilizer'
  | 'adjuvant'
  | 'other'

export interface Material {
  id: string
  name: string
  type: MaterialType
  unit: string
  notes: string | null
  created_at: string
}

export type PlotKind = 'greenhouse' | 'open_field'

export interface Plot {
  id: string
  name: string
  kind: PlotKind
  spray_interval_days: number
  planned: boolean
  grid_x: number
  grid_y: number
  grid_w: number
  grid_h: number
  notes: string | null
  created_at: string
}

export interface SprayingItem {
  material_id: string
  quantity: number
  unit: string
  material_name?: string
}

export interface Spraying {
  id: string
  applied_at: string
  notes: string | null
  plot_ids: string[]
  items: SprayingItem[]
}

export type PlotStatus = 'overdue' | 'due_soon' | 'ok' | 'unplanned'

export interface PlotWithStatus extends Plot {
  status: PlotStatus
  last_sprayed_at: string | null
  next_due_at: string | null
}

export interface AppSettings {
  notification_lead_hours: number
}

export const MATERIAL_TYPES: MaterialType[] = [
  'pesticide',
  'insecticide',
  'fungicide',
  'herbicide',
  'fertilizer',
  'adjuvant',
  'other',
]

export const LEAD_HOUR_OPTIONS = [6, 12, 24, 48]
