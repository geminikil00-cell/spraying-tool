import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import i18n, { applyDirection, LANG_KEY } from '../i18n'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export default function AuthPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSessionChecked(true)
      return
    }
    void supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session))
      setSessionChecked(true)
    })
  }, [])

  const toggleLanguage = () => {
    const next = i18n.language.startsWith('ar') ? 'en' : 'ar'
    void i18n.changeLanguage(next)
    localStorage.setItem(LANG_KEY, next)
    applyDirection(next)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (mode === 'login') {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) throw loginError
        navigate('/spray')
        return
      }
      const { data, error: signupError } = await supabase.auth.signUp({ email, password })
      if (signupError) throw signupError
      if (data.session) {
        navigate('/spray')
      } else {
        setInfo(t('auth.checkEmail'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error'))
    } finally {
      setBusy(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-screen-md items-center justify-center bg-gray-50 p-4">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
          {t('app.configMissing')}
        </div>
      </div>
    )
  }

  if (!sessionChecked) return null

  if (hasSession) return <Navigate to="/spray" replace />

  return (
    <div className="mx-auto flex min-h-dvh max-w-screen-md flex-col bg-gradient-to-br from-primary-50/40 via-white to-primary-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex justify-end p-3">
        <button
          type="button"
          onClick={toggleLanguage}
          className="rounded-xl border border-gray-200/80 bg-white/50 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all hover:bg-white hover:text-gray-900 hover:shadow dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {t('common.language')}
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <form
          onSubmit={(e) => void submit(e)}
          className="w-full max-w-sm space-y-6 rounded-3xl border border-gray-200/60 glass p-8 shadow-2xl backdrop-blur-xl animate-fade-in"
        >
          <h1 className="text-center text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">{t('app.title')}</h1>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100/80 p-1.5 shadow-inner dark:bg-slate-800/80 dark:shadow-black/20">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-primary-100/50 dark:bg-slate-700 dark:text-primary-400 dark:ring-primary-500/30' : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('auth.login')}
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-primary-100/50 dark:bg-slate-700 dark:text-primary-400 dark:ring-primary-500/30' : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('auth.signup')}
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">{t('auth.email')}</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:bg-slate-800 dark:placeholder-slate-500"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">{t('auth.password')}</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:bg-slate-800 dark:placeholder-slate-500"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="rounded-lg bg-red-100 p-2 text-sm text-red-800">{error}</p>}
          {info && <p className="rounded-lg bg-green-100 p-2 text-sm text-green-800">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition-all hover:scale-[1.02] hover:shadow-primary-500/40 disabled:scale-100 disabled:opacity-50"
          >
            {busy ? t('common.saving') : mode === 'login' ? t('auth.login') : t('auth.signup')}
          </button>
        </form>
      </div>
    </div>
  )
}
