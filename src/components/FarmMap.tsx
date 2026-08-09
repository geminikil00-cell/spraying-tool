import { useTranslation } from 'react-i18next'
import type { PlotStatus, PlotWithStatus } from '../lib/types'

const statusClasses: Record<PlotStatus, string> = {
  overdue: 'bg-red-500 text-white',
  due_soon: 'bg-amber-400 text-black',
  ok: 'bg-green-600 text-white',
  unplanned: 'bg-gray-300 text-gray-600',
}

const legendDot: Record<PlotStatus, string> = {
  overdue: 'bg-red-500',
  due_soon: 'bg-amber-400',
  ok: 'bg-green-600',
  unplanned: 'bg-gray-300',
}

const legendOrder: PlotStatus[] = ['overdue', 'due_soon', 'ok', 'unplanned']

interface FarmMapProps {
  plots: PlotWithStatus[]
  selectedIds?: ReadonlySet<string>
  onToggle?: (id: string) => void
  interactive?: boolean
  rowHeight?: number
  showLegend?: boolean
}

export default function FarmMap({
  plots,
  selectedIds,
  onToggle,
  interactive = false,
  rowHeight = 48,
  showLegend = true,
}: FarmMapProps) {
  const { t } = useTranslation()

  return (
    <div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gridAutoRows: `${rowHeight}px` }}
      >
        {plots.map((plot) => {
          const selectable = interactive && plot.planned && Boolean(onToggle)
          const selected = selectedIds?.has(plot.id) ?? false
          return (
            <button
              key={plot.id}
              type="button"
              disabled={!selectable}
              onClick={() => onToggle?.(plot.id)}
              style={{
                gridColumn: `${plot.grid_x + 1} / span ${plot.grid_w}`,
                gridRow: `${plot.grid_y + 1} / span ${plot.grid_h}`,
              }}
              className={`flex items-center justify-center overflow-hidden rounded-lg p-1 text-center text-xs font-medium transition-shadow ${statusClasses[plot.status]} ${
                selected ? 'ring-4 ring-blue-600 ring-offset-1' : ''
              } ${selectable ? 'cursor-pointer hover:opacity-90' : 'cursor-default'} ${
                plot.status === 'unplanned' ? 'opacity-70' : ''
              }`}
            >
              <span className="truncate">{plot.name}</span>
            </button>
          )
        })}
      </div>
      {showLegend && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
          <span className="font-medium">{t('map.legend')}:</span>
          {legendOrder.map((status) => (
            <span key={status} className="inline-flex items-center gap-1">
              <span className={`inline-block h-3 w-3 rounded-full ${legendDot[status]}`} />
              {t(`status.${status}`)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
