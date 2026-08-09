import { isSupabaseConfigured, supabase } from './supabase'
import type { AppSettings, Material, Plot, Spraying } from './types'

export interface SprayingPayload {
  applied_at: string
  notes: string | null
  plot_ids: string[]
  items: { material_id: string; quantity: number; unit: string }[]
}

function ensureConfigured(): void {
  if (!isSupabaseConfigured) throw new Error('app.configMissing')
}

function normalizeError(message: string): Error {
  if (message.includes('violates foreign key')) return new Error('errors.inUse')
  return new Error(message)
}

function unwrap(result: { data: unknown; error: { message: string } | null }): unknown {
  if (result.error) throw normalizeError(result.error.message)
  return result.data
}

export async function fetchMaterials(): Promise<Material[]> {
  ensureConfigured()
  return unwrap(await supabase.from('materials').select('*').order('name')) as Material[]
}

export async function createMaterial(
  input: Omit<Material, 'id' | 'created_at'>,
): Promise<Material> {
  ensureConfigured()
  return unwrap(await supabase.from('materials').insert(input).select().single()) as Material
}

export async function updateMaterial(
  id: string,
  input: Omit<Material, 'id' | 'created_at'>,
): Promise<Material> {
  ensureConfigured()
  return unwrap(
    await supabase.from('materials').update(input).eq('id', id).select().single(),
  ) as Material
}

export async function deleteMaterial(id: string): Promise<void> {
  ensureConfigured()
  unwrap(await supabase.from('materials').delete().eq('id', id))
}

export async function fetchPlots(): Promise<Plot[]> {
  ensureConfigured()
  return unwrap(await supabase.from('plots').select('*').order('name')) as Plot[]
}

export async function createPlot(input: Omit<Plot, 'id' | 'created_at'>): Promise<Plot> {
  ensureConfigured()
  return unwrap(await supabase.from('plots').insert(input).select().single()) as Plot
}

export async function updatePlot(id: string, input: Omit<Plot, 'id' | 'created_at'>): Promise<Plot> {
  ensureConfigured()
  return unwrap(
    await supabase.from('plots').update(input).eq('id', id).select().single(),
  ) as Plot
}

export async function updatePlotPlanned(id: string, planned: boolean): Promise<void> {
  ensureConfigured()
  unwrap(await supabase.from('plots').update({ planned }).eq('id', id).select().single())
}

export async function deletePlot(id: string): Promise<void> {
  ensureConfigured()
  unwrap(await supabase.from('plots').delete().eq('id', id))
}

interface SprayingRow {
  id: string
  applied_at: string
  notes: string | null
  spraying_plots: { plot_id: string }[] | null
  spraying_items:
    | { material_id: string; quantity: number; unit: string; materials: { name: string } | null }[]
    | null
}

export async function fetchSprayings(): Promise<Spraying[]> {
  ensureConfigured()
  const data = unwrap(
    await supabase
      .from('sprayings')
      .select(
        'id, applied_at, notes, spraying_plots(plot_id), spraying_items(material_id, quantity, unit, materials(name))',
      )
      .order('applied_at', { ascending: false }),
  )
  const rows = data as SprayingRow[]
  return rows.map((row) => ({
    id: row.id,
    applied_at: row.applied_at,
    notes: row.notes,
    plot_ids: (row.spraying_plots ?? []).map((entry) => entry.plot_id),
    items: (row.spraying_items ?? []).map((item) => ({
      material_id: item.material_id,
      quantity: Number(item.quantity),
      unit: item.unit,
      material_name: item.materials?.name ?? undefined,
    })),
  }))
}

export async function createSpraying(payload: SprayingPayload): Promise<string> {
  ensureConfigured()
  return unwrap(
    await supabase.rpc('apply_spraying', {
      p_applied_at: payload.applied_at,
      p_notes: payload.notes,
      p_plot_ids: payload.plot_ids,
      p_items: payload.items,
    }),
  ) as string
}

export async function updateSpraying(id: string, payload: SprayingPayload): Promise<void> {
  ensureConfigured()
  unwrap(
    await supabase.rpc('update_spraying', {
      p_id: id,
      p_applied_at: payload.applied_at,
      p_notes: payload.notes,
      p_plot_ids: payload.plot_ids,
      p_items: payload.items,
    }),
  )
}

export async function deleteSpraying(id: string): Promise<void> {
  ensureConfigured()
  unwrap(await supabase.from('sprayings').delete().eq('id', id))
}

export async function fetchSettings(): Promise<AppSettings> {
  ensureConfigured()
  return unwrap(
    await supabase.from('app_settings').select('notification_lead_hours').eq('id', 1).single(),
  ) as AppSettings
}

export async function saveSettings(leadHours: number): Promise<void> {
  ensureConfigured()
  unwrap(
    await supabase.from('app_settings').update({ notification_lead_hours: leadHours }).eq('id', 1),
  )
}
