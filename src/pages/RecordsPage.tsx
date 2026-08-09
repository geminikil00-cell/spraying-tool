import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../components/Modal'
import SprayingForm from '../components/SprayingForm'
import { EmptyState, Spinner } from '../components/ui'
import { deleteSpraying, updateSpraying } from '../lib/api'
import { useFarmData } from '../lib/FarmDataContext'
import { formatDateTime } from '../lib/dates'
import type { Spraying } from '../lib/types'
import i18n from '../i18n'

export default function RecordsPage() {
  const { t } = useTranslation()
  const { loading, sprayings, plots, refresh } = useFarmData()
  const [filterPlotId, setFilterPlotId] = useState('all')
  const [editing, setEditing] = useState<Spraying | null>(null)
  const [error, setError] = useState<string | null>(null)

  const plotName = (id: string) => plots.find((plot) => plot.id === id)?.name ?? id

  const filtered = useMemo(
    () =>
      filterPlotId === 'all'
        ? sprayings
        : sprayings.filter((spraying) => spraying.plot_ids.includes(filterPlotId)),
    [sprayings, filterPlotId],
  )

  const handleEdit = async (payload: Parameters<typeof updateSpraying>[1]) => {
    if (!editing) return
    try {
      await updateSpraying(editing.id, payload)
      await refresh()
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'errors.generic')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await deleteSpraying(id)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'errors.generic')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100 animate-slide-up">{t('records.title')}</h2>
        <select
          className="rounded-xl border border-gray-200/80 bg-white/50 px-3 py-1.5 text-sm shadow-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:focus:border-primary-500 animate-slide-up"
          value={filterPlotId}
          onChange={(e) => setFilterPlotId(e.target.value)}
        >
          <option value="all">{t('records.filter.all')}</option>
          {plots.map((plot) => (
            <option key={plot.id} value={plot.id}>
              {plot.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-100 p-3 text-sm text-red-800">
          {t(error, { defaultValue: error })}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-4">
          {filtered.map((spraying, index) => (
            <li key={spraying.id} className="rounded-2xl border border-gray-200/60 glass-card p-5 shadow-lg animate-fade-in" style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2.5">
                  <p className="text-base font-bold text-gray-900 dark:text-slate-100">
                    {formatDateTime(spraying.applied_at, i18n.language)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {spraying.plot_ids.map((id) => (
                      <span
                        key={id}
                        className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 ring-1 ring-primary-500/20"
                      >
                        {plotName(id)}
                      </span>
                    ))}
                  </div>
                  <ul className="text-sm font-medium text-gray-600 dark:text-slate-400 space-y-1">
                    {spraying.items.map((item) => (
                      <li key={item.material_id}>
                        {item.material_name ?? item.material_id} &times; {item.quantity} {item.unit}
                      </li>
                    ))}
                  </ul>
                  {spraying.notes && <p className="text-sm italic text-gray-500 dark:text-slate-500 mt-2">{spraying.notes}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(spraying)}
                    className="rounded-xl border border-gray-200/80 bg-white/50 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all hover:bg-white hover:text-gray-900 hover:shadow dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(spraying.id)}
                    className="rounded-xl border border-red-200/80 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition-all hover:bg-red-50 hover:text-red-700 hover:shadow dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 dark:hover:text-red-300"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Modal title={t('common.edit')} onClose={() => setEditing(null)}>
          <SprayingForm initial={editing} onSubmit={handleEdit} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  )
}
