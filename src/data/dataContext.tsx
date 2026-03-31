// ─────────────────────────────────────────────────────────────────────────────
// dataContext.tsx
// React Context que expone el APIDataProvider y el índice de datos por día.
// Los datos se cargan al iniciar desde /api/zone-data y /api/day-data.
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ZoneSummary, CategoryMetrics } from './providers/DataProvider.interface'
import { APIDataProvider } from './providers/APIDataProvider'

// ── Tipos de datos por día ────────────────────────────────────────────────────

export interface DayEntry {
  dia:     string   // 'lun' | 'mar' | 'mié' | 'jue' | 'vie' | 'sáb' | 'dom'
  ordenes: number   // ORDENES_TOTALES_DIA_AVG
  gmv:     number   // GMV_DIA_AVG
}

// key: OPS_ZONE_ID + '|' + FOOD_CATEGORY
type DayIndex = Map<string, DayEntry[]>

// ── Estado del contexto ───────────────────────────────────────────────────────

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

interface DataContextValue {
  loadState: LoadState
  error: string | null
  updatedAt: string | null
  retry(): void
  getZones(): string[]
  getZoneData(opsZone: string): ZoneSummary | null
  getCategoryData(opsZone: string, category: string): CategoryMetrics | null
  getAllCategories(): string[]
  getDayData(country: string, opsZoneId: string, category: string): DayEntry[] | null
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataContextProvider({ children }: { children: React.ReactNode }) {
  const providerRef = useRef<APIDataProvider>(new APIDataProvider())
  const provider = providerRef.current

  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [dayIndex, setDayIndex] = useState<DayIndex>(new Map())

  async function load() {
    setLoadState('loading')
    setError(null)
    try {
      // Cargar zona y día en paralelo
      const [, dayRes] = await Promise.all([
        provider.initialize(),
        fetch('/api/day-data').then((r) => r.json() as Promise<Record<string, DayEntry[]>>),
      ])

      setUpdatedAt(provider.updatedAt)

      // Construir el índice de días desde la respuesta del servidor
      const idx: DayIndex = new Map()
      for (const [key, entries] of Object.entries(dayRes)) {
        if (Array.isArray(entries)) {
          idx.set(key, entries as DayEntry[])
        }
      }
      setDayIndex(idx)

      setLoadState('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos')
      setLoadState('error')
    }
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const value: DataContextValue = {
    loadState,
    error,
    updatedAt,
    retry: load,
    getZones: () => provider.getZones(),
    getZoneData: (z) => provider.getZoneData(z),
    getCategoryData: (z, c) => provider.getCategoryData(z, c),
    getAllCategories: () => provider.getAllCategories(),
    getDayData: (country, opsZoneId, category) =>
      dayIndex.get(`${country}|${opsZoneId}|${category}`) ?? null,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useDataContext(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataContext debe usarse dentro de DataContextProvider')
  return ctx
}
