import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFarmData } from '../lib/FarmDataContext'
import { toLocalInputValue } from '../lib/dates'
import type { SprayingPayload } from '../lib/api'
import { validateSprayingForm } from '../lib/validation'
import type { Spraying } from '../lib/types'
import FarmMap from './FarmMap'
import { ErrorBanner } from './ui'

interface IngredientRow {
  materialId: string
  quantity: string
  unit: string
}

interface SprayingFormProps {
  initial?: Spraying
  preselectDue?: boolean
  onSubmit: (payload: SprayingPayload) => Promise<void>
  onCancel?: () => void
}

export default function SprayingForm({ initial, preselectDue, onSubmit, onCancel }: SprayingFormProps) {
  const { t } = useTranslation()
  const { loading, materials, plotsWithStatus } = useFarmData()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initial?.plot_ids ?? []),
  )
  const [rows, setRows] = useState<IngredientRow[]>(() =>
    initial
      ? initial.items.map((item) => ({
          materialId: item.material_id,
          quantity: String(item.quantity),
          unit: item.unit,
        }))
      : [{ materialId: '', quantity: '', unit: '' }],
  )
  const [appliedAt, setAppliedAt] = useState(() =>
    initial ? toLocalInputValue(new Date(initial.applied_at)) : toLocalInputValue(new Date()),
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const preselected = useRef(Boolean(initial))

  useEffect(() => {
    if (!preselectDue || preselected.current || loading) return
    preselected.current = true
    const due = plotsWithStatus
      .filter((plot) => plot.status === 'overdue' || plot.status === 'due_soon')
      .map((plot) => plot.id)
    setSelectedIds((current) => new Set([...current, ...due]))
  }, [preselectDue, loading, plotsWithStatus])

  const togglePlot = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllDue = () => {
    const due = plotsWithStatus
      .filter((plot) => plot.status === 'overdue' || plot.status === 'due_soon')
      .map((plot) => plot.id)
    setSelectedIds(new Set(due))
  }

  const setRow = (index: number, patch: Partial<IngredientRow>) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const onMaterialChange = (index: number, materialId: string) => {
    const material = materials.find((m) => m.id === materialId)
    setRow(index, { materialId, unit: material ? material.unit : rows[index].unit })
  }

  const submit = async () => {
    setError(null)
    const items = rows.map((row) => ({
      material_id: row.materialId,
      quantity: Number(row.quantity),
      unit: row.unit,
    }))
    const validationError = validateSprayingForm({ plotIds: [...selectedIds], items })
    if (validationError) {
      setError(`spray.errors.${validationError}`)
      return
    }
    setBusy(true)
    try {
      await onSubmit({
        applied_at: new Date(appliedAt).toISOString(),
        notes: notes.trim() ? notes.trim() : null,
        plot_ids: [...selectedIds],
        items,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'errors.generic')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">{t('spray.selectPlots')}</h3>
          <button
            type="button"
            onClick={selectAllDue}
            className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            {t('spray.selectAllDue')}
          </button>
        </div>
        <FarmMap plots={plotsWithStatus} selectedIds={selectedIds} onToggle={togglePlot} interactive />
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">{t('spray.mixture')}</h3>
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm"
              value={row.materialId}
              onChange={(e) => onMaterialChange(index, e.target.value)}
            >
              <option value="">{t('spray.material')}</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} ({t(`material.types.${material.type}`)})
                </option>
              ))}
            </select>
            <input
              className="w-24 rounded-lg border border-gray-300 px-2 py-2 text-sm"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder={t('spray.quantity')}
              value={row.quantity}
              onChange={(e) => setRow(index, { quantity: e.target.value })}
            />
            <input
              className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm"
              placeholder={t('common.unit')}
              value={row.unit}
              onChange={(e) => setRow(index, { unit: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50"
              aria-label={t('common.delete')}
            >
              &times;
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows((current) => [...current, { materialId: '', quantity: '', unit: '' }])}
          className="rounded-lg border border-dashed border-gray-400 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          + {t('spray.addIngredient')}
        </button>
      </section>

      <section className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('spray.appliedAt')}</label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            type="datetime-local"
            value={appliedAt}
            onChange={(e) => setAppliedAt(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('common.notes')}</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {busy ? t('common.saving') : t('spray.submit')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {t('common.cancel')}
          </button>
        )}
      </div>
    </div>
  )
}
