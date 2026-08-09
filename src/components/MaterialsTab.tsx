import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import { EmptyState, Spinner } from './ui'
import { createMaterial, deleteMaterial, updateMaterial } from '../lib/api'
import { useFarmData } from '../lib/FarmDataContext'
import type { Material, MaterialType } from '../lib/types'
import { MATERIAL_TYPES } from '../lib/types'

interface MaterialFormState {
  name: string
  type: MaterialType
  unit: string
  notes: string
}

const emptyForm: MaterialFormState = { name: '', type: 'pesticide', unit: 'L', notes: '' }

export default function MaterialsTab() {
  const { t } = useTranslation()
  const { loading, materials, refresh } = useFarmData()
  const [editing, setEditing] = useState<Material | 'new' | null>(null)
  const [form, setForm] = useState<MaterialFormState>(emptyForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openNew = () => {
    setForm(emptyForm)
    setError(null)
    setEditing('new')
  }

  const openEdit = (material: Material) => {
    setForm({
      name: material.name,
      type: material.type,
      unit: material.unit,
      notes: material.notes ?? '',
    })
    setError(null)
    setEditing(material)
  }

  const close = () => setEditing(null)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setBusy(true)
    setError(null)
    try {
      const input = {
        name: form.name.trim(),
        type: form.type,
        unit: form.unit.trim() || 'L',
        notes: form.notes.trim() ? form.notes.trim() : null,
      }
      if (editing === 'new') await createMaterial(input)
      else await updateMaterial(editing.id, input)
      await refresh()
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'errors.generic')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (material: Material) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await deleteMaterial(material.id)
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
      ) : materials.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2">
          {materials.map((material) => (
            <li
              key={material.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{material.name}</p>
                <p className="text-xs text-gray-500">
                  {t(`material.types.${material.type}`)} &middot; {material.unit}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(material)}
                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  {t('common.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(material)}
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
        <Modal
          title={editing === 'new' ? t('common.add') : t('common.edit')}
          onClose={close}
        >
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
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('material.type')}</label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as MaterialType }))}
              >
                {MATERIAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`material.types.${type}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('common.unit')}</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              />
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
