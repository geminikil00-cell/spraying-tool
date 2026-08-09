import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import MaterialsTab from '../components/MaterialsTab'
import NotificationsTab from '../components/NotificationsTab'
import PlotsTab from '../components/PlotsTab'

type Tab = 'materials' | 'plots' | 'notifications'

export default function ParamsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('materials')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'materials', label: t('params.tab.materials') },
    { id: 'plots', label: t('params.tab.plots') },
    { id: 'notifications', label: t('params.tab.notifications') },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{t('nav.parameters')}</h2>

      <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-100 p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-md px-2 py-1.5 text-xs font-medium sm:text-sm ${
              tab === item.id ? 'bg-white text-green-700 shadow' : 'text-gray-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'materials' && <MaterialsTab />}
      {tab === 'plots' && <PlotsTab />}
      {tab === 'notifications' && <NotificationsTab />}
    </div>
  )
}
