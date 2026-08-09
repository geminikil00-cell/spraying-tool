import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import i18n from '../i18n'
import {
  fetchMaterials,
  fetchPlots,
  fetchSettings,
  fetchSprayings,
} from './api'
import { updateNativeReminders } from './nativeNotifications'
import { computePlotStatuses, computeReminders } from './status'
import type { ReminderInfo } from './status'
import type { AppSettings, Material, Plot, PlotWithStatus, Spraying } from './types'

const defaultSettings: AppSettings = { notification_lead_hours: 24 }

interface FarmDataValue {
  loading: boolean
  error: string | null
  materials: Material[]
  plots: Plot[]
  sprayings: Spraying[]
  settings: AppSettings
  plotsWithStatus: PlotWithStatus[]
  reminders: ReminderInfo
  refresh: () => Promise<void>
}

const FarmDataContext = createContext<FarmDataValue | null>(null)

export function FarmDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [plots, setPlots] = useState<Plot[]>([])
  const [sprayings, setSprayings] = useState<Spraying[]>([])
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)

  const refresh = useCallback(async () => {
    try {
      const [m, p, s, st] = await Promise.all([
        fetchMaterials(),
        fetchPlots(),
        fetchSprayings(),
        fetchSettings(),
      ])
      setMaterials(m)
      setPlots(p)
      setSprayings(s)
      setSettings(st)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'errors.generic')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const plotsWithStatus = useMemo(
    () => computePlotStatuses(plots, sprayings, settings.notification_lead_hours),
    [plots, sprayings, settings],
  )

  const reminders = useMemo(() => computeReminders(plotsWithStatus), [plotsWithStatus])

  useEffect(() => {
    if (loading) return
    void updateNativeReminders(
      plotsWithStatus,
      settings.notification_lead_hours,
      (key) => String(i18n.t(key)),
    )
  }, [loading, plotsWithStatus, settings.notification_lead_hours])

  const value: FarmDataValue = {
    loading,
    error,
    materials,
    plots,
    sprayings,
    settings,
    plotsWithStatus,
    reminders,
    refresh,
  }

  return <FarmDataContext.Provider value={value}>{children}</FarmDataContext.Provider>
}

export function useFarmData(): FarmDataValue {
  const ctx = useContext(FarmDataContext)
  if (!ctx) throw new Error('useFarmData must be used within FarmDataProvider')
  return ctx
}
