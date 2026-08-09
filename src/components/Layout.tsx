import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import i18n, { applyDirection, LANG_KEY } from '../i18n'
import { useFarmData } from '../lib/FarmDataContext'
import { initNotifications } from '../lib/nativeNotifications'
import { supabase } from '../lib/supabase'
import { ErrorBanner } from './ui'

const SIDEBAR_KEY = 'sidebar_open'

const navItems = [
  { to: '/spray', labelKey: 'nav.spray', icon: SprayIcon },
  { to: '/records', labelKey: 'nav.records', icon: RecordsIcon },
  { to: '/params', labelKey: 'nav.parameters', icon: ParamsIcon },
  { to: '/planning', labelKey: 'nav.planning', icon: PlanIcon },
]

export default function Layout() {
  const { t } = useTranslation()
  const { reminders, refresh, error } = useFarmData()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem(SIDEBAR_KEY) !== 'false')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  useEffect(() => {
    void initNotifications(() => { void refresh() })
  }, [refresh])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(sidebarOpen))
  }, [sidebarOpen])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const toggleLanguage = () => {
    const next = i18n.language.startsWith('ar') ? 'en' : 'ar'
    void i18n.changeLanguage(next)
    localStorage.setItem(LANG_KEY, next)
    applyDirection(next)
  }

  const logout = () => { void supabase.auth.signOut() }

  const overdueCount = reminders.overdue.length

  return (
    <div className="mx-auto flex min-h-dvh w-full bg-gradient-to-br from-primary-50/40 via-white to-primary-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 flex flex-col glass transition-all duration-300 ease-in-out lg:static lg:z-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarOpen ? 'w-64' : 'w-20'} border-e border-gray-200/50 dark:border-slate-800 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
      >
        <div className={`flex items-center gap-2 p-4 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}>
          <span className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
            {sidebarOpen ? 'SprayLog' : 'S'}
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2">
          {navItems.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                  sidebarOpen ? 'justify-start mx-2' : 'justify-center mx-1'
                } ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100/50 dark:bg-primary-500/20 dark:text-primary-400 dark:ring-primary-500/30'
                    : 'text-gray-500 hover:bg-gray-50/80 hover:text-gray-900 hover:scale-[1.02] dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
                }`
              }
              title={sidebarOpen ? undefined : t(labelKey)}
            >
              <span className="relative shrink-0">
                <Icon />
                {to === '/spray' && overdueCount > 0 && (
                  <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {overdueCount}
                  </span>
                )}
              </span>
              {sidebarOpen && <span>{t(labelKey)}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={`p-2 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200 ${
              sidebarOpen ? 'w-full justify-start' : 'justify-center'
            }`}
            title={sidebarOpen ? undefined : 'Expand'}
          >
            <CollapseIcon open={sidebarOpen} />
            {sidebarOpen && <span>{t('common.collapse')}</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-gray-200/50 dark:border-slate-800 glass px-6 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Menu"
            >
              <MenuIcon />
            </button>
            <div className="flex items-center gap-2">
              <a
                href="/spraylog.apk"
                download
                className="rounded-lg border border-green-500 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
              >
                {t('common.download')}
              </a>
              <button
                type="button"
                onClick={() => setIsDarkMode((prev) => !prev)}
                className="rounded-xl border border-gray-200/80 bg-white/50 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all hover:bg-white hover:text-gray-900 hover:shadow dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {isDarkMode ? 'Light' : 'Dark'}
              </button>
              <button
                type="button"
                onClick={toggleLanguage}
                className="rounded-xl border border-gray-200/80 bg-white/50 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all hover:bg-white hover:text-gray-900 hover:shadow dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {t('common.language')}
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-gray-200/80 bg-white/50 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all hover:bg-white hover:text-gray-900 hover:shadow dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {t('auth.logout')}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-4 p-4 pb-6">
          {error && <ErrorBanner message={error} />}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SprayIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}

function RecordsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function ParamsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function PlanIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h14.25c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function CollapseIcon({ open }: { open: boolean }) {
  return (
    <svg className={`h-4 w-4 transition-transform ${open ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 12l-7.5 7.5 1.5 1.5L21.75 12l-9-9-1.5 1.5 7.5 7.5z" />
    </svg>
  )
}
