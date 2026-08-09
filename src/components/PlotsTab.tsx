import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import FarmMap from './FarmMap'
import Modal from './Modal'
import { EmptyState, Spinner } from './ui'
import { createPlot, deletePlot, updatePlot } from '../lib/api'
import { useFarmData } from '../lib/FarmDataContext'
import { clampGrid, suggestGridPosition } from '../lib/grid'
import type { Plot, PlotKind, PlotWithStatus } from '../lib/types'

interface PlotFormState {
  name: string
  kind: PlotKind
  spray_interval_days: string
  notes: string
  grid_x: string
  grid_y: string
  grid_w: string
  grid_h: string
}

function emptyForm(existing: Plot[]): PlotFormState {
  const position = suggestGridPosition(existing)
  return {
    name: '',
    kind: 'open_field',
    spray_interval_days: '7',
    notes: '',
    grid_x: String(position.x),
    grid_y: String(position.y),
    grid_w: '2',
    grid_h: '2',
  }
}

const DRAFT_ID = 'draft'

export default function PlotsTab() {
  const { t } = useTranslation()
  const { loading, plots, plotsWithStatus, refresh } = useFarmData()
  const [editing, setEditing] = useState<Plot | 'new' | null>(null)
  const [form, setForm] = useState<PlotFormState>(() => emptyForm(plots))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openNew = () => {
    setForm(emptyForm(plots))
    setError(null)
    setEditing('new')
  }

  const openEdit = (plot: Plot) => {
    setForm({
      name: plot.name,
      kind: plot.kind,
      spray_interval_days: String(plot.spray_interval_days),
      notes: plot.notes ?? '',
      grid_x: String(plot.grid_x),
      grid_y: String(plot.grid_y),
      grid_w: String(plot.grid_w),
      grid_h: String(plot.grid_h),
    })
    setError(null)
    setEditing(plot)
  }

  const close = () => setEditing(null)

  const draftGrid = clampGrid(
    Number(form.grid_x),
    Number(form.grid_y),
    Number(form.grid_w),
    Number(form.grid_h),
  )

  const previewPlots: PlotWithStatus[] = plotsWithStatus
    .filter((plot) => editing === 'new' || plot.id !== (editing as Plot | null)?.id)
    .map((plot) => ({ ...plot }))
  previewPlots.push({
    id: DRAFT_ID,
    name: form.name || '...',
    kind: form.kind,
    spray_interval_days: Number(form.spray_interval_days) || 7,
    planned: true,
    grid_x: draftGrid.x,
    grid_y: draftGrid.y,
    grid_w: draftGrid.w,
    grid_h: draftGrid.h,
    notes: null,
    created_at: '',
    status: 'ok',
    last_sprayed_at: null,
    next_due_at: null,
  })

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setBusy(true)
    setError(null)
    try {
      const interval = Math.max(1, Math.floor(Number(form.spray_interval_days) || 7))
      const input = {
        name: form.name.trim(),
        kind: form.kind,
        spray_interval_days: interval,
        planned: editing === 'new' ? true : editing.planned,
        notes: form.notes.trim() ? form.notes.trim() : null,
        grid_x: draftGrid.x,
        grid_y: draftGrid.y,
        grid_w: draftGrid.w,
        grid_h: draftGrid.h,
      }
      if (editing === 'new') await createPlot(input)
      else await updatePlot(editing.id, input)
      await refresh()
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'errors.generic')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (plot: Plot) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await deletePlot(plot.id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'errors.generic')
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={openNew}
        className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
      >
        + {t('common.add')}
      </button>

      {error && (
        <div className="rounded-lg bg-red-100 p-3 text-sm text-red-800">
          {t(error, { defaultValue: error })}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : plots.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2">
          {plots.map((plot) => (
            <li
              key={plot.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{plot.name}</p>
                <p className="text-xs text-gray-500">
                  {t(`plot.kinds.${plot.kind}`)} &middot; {t('plot.interval')}:{' '}
                  {plot.spray_interval_days} {t('plot.intervalUnit')}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(plot)}
                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  {t('common.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(plot)}
                  className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  {t('common.delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Modal title={editing === 'new' ? t('common.add') : t('common.edit')} onClose={close}>
          <form onSubmit={(e) => void save(e)} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('common.name')}</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('plot.kind')}</label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={form.kind}
                  onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as PlotKind }))}
                >
                  <option value="greenhouse">{t('plot.kinds.greenhouse')}</option>
                  <option value="open_field">{t('plot.kinds.open_field')}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('plot.interval')} ({t('plot.intervalUnit')})
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  type="number"
                  min="1"
                  required
                  value={form.spray_interval_days}
                  onChange={(e) => setForm((f) => ({ ...f, spray_interval_days: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">{t('map.editHint')}</p>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    ['grid_x', t('plot.gridX')],
                    ['grid_y', t('plot.gridY')],
                    ['grid_w', t('plot.gridW')],
                    ['grid_h', t('plot.gridH')],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs text-gray-500">{label}</label>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                      type="number"
                      min="0"
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 rounded-lg border border-gray-200 p-2">
                <FarmMap
                  plots={previewPlots}
                  selectedIds={new Set([DRAFT_ID])}
                  interactive={false}
                  rowHeight={24}
                  showLegend={false}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('common.notes')}</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {busy ? t('common.saving') : t('common.save')}
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
