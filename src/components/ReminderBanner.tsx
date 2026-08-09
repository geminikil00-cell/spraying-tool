import { useTranslation } from 'react-i18next'
import { useFarmData } from '../lib/FarmDataContext'

export default function ReminderBanner() {
  const { t } = useTranslation()
  const { reminders } = useFarmData()

  if (reminders.overdue.length === 0 && reminders.dueSoon.length === 0) return null

  return (
    <div className="space-y-2">
      {reminders.overdue.length > 0 && (
        <div className="rounded-lg bg-red-100 p-3 text-sm text-red-800">
          <span className="font-semibold">{t('notif.banner.overdue')}: </span>
          {reminders.overdue.map((plot) => plot.name).join(', ')}
        </div>
      )}
      {reminders.dueSoon.length > 0 && (
        <div className="rounded-lg bg-amber-100 p-3 text-sm text-amber-800">
          <span className="font-semibold">{t('notif.banner.dueSoon')}: </span>
          {reminders.dueSoon.map((plot) => plot.name).join(', ')}
        </div>
      )}
    </div>
  )
}
