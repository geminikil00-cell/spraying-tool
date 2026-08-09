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
    <div className="mx-auto flex min-h-dvh max-w-screen-md flex-col bg-gray-50">
      <div className="flex justify-end p-3">
        <button
          type="button"
          onClick={toggleLanguage}
          className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
        >
          {t('common.language')}
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <form
          onSubmit={(e) => void submit(e)}
          className="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h1 className="text-center text-2xl font-bold text-green-700">{t('app.title')}</h1>

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === 'login' ? 'bg-white text-green-700 shadow' : 'text-gray-600'
              }`}
            >
              {t('auth.login')}
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === 'signup' ? 'bg-white text-green-700 shadow' : 'text-gray-600'
              }`}
            >
              {t('auth.signup')}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.email')}</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.password')}</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {busy ? t('common.saving') : mode === 'login' ? t('auth.login') : t('auth.signup')}
          </button>
        </form>
      </div>
    </div>
  )
}
