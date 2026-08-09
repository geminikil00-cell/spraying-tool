import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReminderBanner from '../components/ReminderBanner'
import SprayingForm from '../components/SprayingForm'
import { createSpraying } from '../lib/api'
import { useFarmData } from '../lib/FarmDataContext'

export default function SprayPage() {
  const { t } = useTranslation()
  const { refresh } = useFarmData()
  const [formKey, setFormKey] = useState(0)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (payload: Parameters<typeof createSpraying>[0]) => {
    await createSpraying(payload)
    await refresh()
    setFormKey((key) => key + 1)
    setSuccess(true)
    window.setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{t('spray.title')}</h2>
      <ReminderBanner />
      {success && (
        <div className="rounded-lg bg-green-100 p-3 text-sm font-medium text-green-800">
          {t('spray.success')}
        </div>
      )}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <SprayingForm key={formKey} preselectDue onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
