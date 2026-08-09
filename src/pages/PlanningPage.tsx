import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState, Spinner, Toggle } from '../components/ui'
import { updatePlotPlanned } from '../lib/api'
import { useFarmData } from '../lib/FarmDataContext'
import type { Plot } from '../lib/types'

const statusDot: Record<string, string> = {
  overdue: 'bg-red-500',
  due_soon: 'bg-amber-400',
  ok: 'bg-green-600',
  unplanned: 'bg-gray-300',
}

export default function PlanningPage() {
  const { t } = useTranslation()
  const { loading, plotsWithStatus, refresh } = useFarmData()
  const [error, setError] = useState<string | null>(null)

  const toggle = async (plot: Plot) => {
    try {
      await updatePlotPlanned(plot.id, !plot.planned)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'errors.generic')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{t('planning.title')}</h2>
      <p className="text-sm text-gray-500">{t('planning.hint')}</p>

      {error && (
        <div className="rounded-lg bg-red-100 p-3 text-sm text-red-800">
          {t(error, { defaultValue: error })}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : plotsWithStatus.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2">
          {plotsWithStatus.map((plot) => (
            <li
              key={plot.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="flex items-center gap-2">
                <span className={`inline-block h-3 w-3 rounded-full ${statusDot[plot.status]}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{plot.name}</p>
                  <p className="text-xs text-gray-500">
                    {t(`plot.kinds.${plot.kind}`)} &middot; {t(`status.${plot.status}`)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{t('plot.planned')}</span>
                <Toggle checked={plot.planned} onChange={() => void toggle(plot)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
