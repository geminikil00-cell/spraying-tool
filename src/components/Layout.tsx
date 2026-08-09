import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'
import i18n, { applyDirection, LANG_KEY } from '../i18n'
import { useFarmData } from '../lib/FarmDataContext'
import { initNotifications } from '../lib/nativeNotifications'
import { supabase } from '../lib/supabase'
import { ErrorBanner } from './ui'

const tabs = [
  { to: '/spray', labelKey: 'nav.spray' },
  { to: '/records', labelKey: 'nav.records' },
  { to: '/params', labelKey: 'nav.parameters' },
  { to: '/planning', labelKey: 'nav.planning' },
]

export default function Layout() {
  const { t } = useTranslation()
  const { reminders, refresh, error } = useFarmData()

  useEffect(() => {
    void initNotifications(() => {
      void refresh()
    })
  }, [refresh])

  const toggleLanguage = () => {
    const next = i18n.language.startsWith('ar') ? 'en' : 'ar'
    void i18n.changeLanguage(next)
    localStorage.setItem(LANG_KEY, next)
    applyDirection(next)
  }

  const logout = () => {
    void supabase.auth.signOut()
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-screen-md flex-col bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-green-700">{t('app.title')}</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              {t('common.language')}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-4 p-4 pb-24">
        {error && <ErrorBanner message={error} />}
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 mx-auto flex w-full max-w-screen-md border-t border-gray-200 bg-white">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                isActive ? 'text-green-700' : 'text-gray-500'
              }`
            }
          >
            {tab.to === '/spray' && reminders.overdue.length > 0 && (
              <span className="absolute end-1/4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {reminders.overdue.length}
              </span>
            )}
            {t(tab.labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
