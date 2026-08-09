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
        <h2 className="text-lg font-semibold text-gray-900">{t('records.title')}</h2>
        <select
          className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
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
        <ul className="space-y-3">
          {filtered.map((spraying) => (
            <li key={spraying.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDateTime(spraying.applied_at, i18n.language)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {spraying.plot_ids.map((id) => (
                      <span
                        key={id}
                        className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                      >
                        {plotName(id)}
                      </span>
                    ))}
                  </div>
                  <ul className="text-sm text-gray-600">
                    {spraying.items.map((item) => (
                      <li key={item.material_id}>
                        {item.material_name ?? item.material_id} &times; {item.quantity} {item.unit}
                      </li>
                    ))}
                  </ul>
                  {spraying.notes && <p className="text-sm text-gray-500">{spraying.notes}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(spraying)}
                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(spraying.id)}
                    className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
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
