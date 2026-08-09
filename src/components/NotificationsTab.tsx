import { useTranslation } from 'react-i18next'
import { saveSettings } from '../lib/api'
import { useFarmData } from '../lib/FarmDataContext'
import { sendTestNotification } from '../lib/nativeNotifications'
import { LEAD_HOUR_OPTIONS } from '../lib/types'

export default function NotificationsTab() {
  const { t } = useTranslation()
  const { settings, refresh } = useFarmData()

  const changeLeadHours = async (value: number) => {
    await saveSettings(value)
    await refresh()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">{t('notif.leadHours')}</label>
        <select
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          value={settings.notification_lead_hours}
          onChange={(e) => void changeLeadHours(Number(e.target.value))}
        >
          {LEAD_HOUR_OPTIONS.map((hours) => (
            <option key={hours} value={hours}>
              {t(`notif.lead.${hours}`)}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => void sendTestNotification(t('notif.testBody'))}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        {t('notif.test')}
      </button>
    </div>
  )
}
