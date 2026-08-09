import { useTranslation } from 'react-i18next'

export function Spinner() {
  const { t } = useTranslation()
  return <div className="p-8 text-center text-sm text-gray-500">{t('common.loading')}</div>
}

export function EmptyState() {
  const { t } = useTranslation()
  return <div className="p-8 text-center text-sm text-gray-400">{t('common.empty')}</div>
}

export function ErrorBanner({ message }: { message: string }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg bg-red-100 p-3 text-sm text-red-800">
      {t(message, { defaultValue: message })}
    </div>
  )
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-green-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
