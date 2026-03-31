// ─────────────────────────────────────────────────────────────────────────────
// CSVDataProvider.ts
// Implementación de DataProvider que lee desde un archivo CSV local.
// ─────────────────────────────────────────────────────────────────────────────

import type { DataProvider, ZoneSummary, CategoryMetrics } from './DataProvider.interface'
import { parseAndValidateCSV, type RawCSVRow } from '../csvLoader'

const STORAGE_KEY = 'rappi_pitch_zone_data'
const STORAGE_META_KEY = 'rappi_pitch_zone_meta'

export interface StoredMeta {
  loadedAt: string   // ISO date string
  fileName: string
  rowCount: number
  zoneCount: number
}

export class CSVDataProvider implements DataProvider {
  private rows: RawCSVRow[] = []
  private loaded = false

  // ── Carga de datos ─────────────────────────────────────────────────────────

  async loadData(source: File | string): Promise<void> {
    if (typeof source === 'string') {
      // TODO (Snowflake): cuando se migre, este path será una URL o query
      throw new Error('CSVDataProvider solo acepta File. Para Snowflake, usar SnowflakeDataProvider.')
    }

    const result = await parseAndValidateCSV(source)

    if (result.errors.length > 0 && result.data.length === 0) {
      throw new Error(
        'El CSV tiene errores críticos:\n' +
          result.errors.map((e) => `Fila ${e.row} | ${e.column}: ${e.issue}`).join('\n'),
      )
    }

    this.rows = result.data
    this.loaded = true

    // Persistir en localStorage para que el ejecutivo no cargue el CSV cada vez
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.rows))
      const meta: StoredMeta = {
        loadedAt: new Date().toISOString(),
        fileName: source.name,
        rowCount: this.rows.length,
        zoneCount: result.zones.length,
      }
      localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta))
    } catch {
      // localStorage puede estar lleno; no es crítico
      console.warn('No se pudo persistir el CSV en localStorage')
    }
  }

  /** Intenta restaurar datos desde localStorage (llamar al iniciar la app) */
  loadFromStorage(): StoredMeta | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const meta = localStorage.getItem(STORAGE_META_KEY)
      if (!raw || !meta) return null

      this.rows = JSON.parse(raw) as RawCSVRow[]
      this.loaded = true
      return JSON.parse(meta) as StoredMeta
    } catch {
      return null
    }
  }

  /** Limpia localStorage y reinicia el provider */
  clearStorage(): void {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_META_KEY)
    this.rows = []
    this.loaded = false
  }

  // ── Implementación de la interfaz ──────────────────────────────────────────

  isLoaded(): boolean {
    return this.loaded
  }

  getZones(): string[] {
    return [...new Set(this.rows.map((r) => r.OPS_ZONE))].sort()
  }

  getAllCategories(): string[] {
    return [...new Set(this.rows.map((r) => r.FOOD_CATEGORY))].sort()
  }

  getZoneData(opsZone: string): ZoneSummary | null {
    const zoneRows = this.rows.filter((r) => r.OPS_ZONE === opsZone)
    if (zoneRows.length === 0) return null

    // COUNTRY, CIUDAD, TOTAL_USERS, PRIME_USERS, OPS_ZONE_ID son iguales
    // para todas las filas de la misma zona — tomamos la primera
    const base = zoneRows[0]

    const categories = zoneRows.map((r) => this.buildCategoryMetrics(r))

    return {
      opsZone,
      opsZoneId: base.OPS_ZONE_ID,
      country: base.COUNTRY,
      ciudad: base.CIUDAD,
      totalUsers: base.TOTAL_USERS,
      primeUsers: base.PRIME_USERS,
      primeRate: base.TOTAL_USERS > 0 ? base.PRIME_USERS / base.TOTAL_USERS : 0,
      categories,
    }
  }

  getCategoryData(opsZone: string, category: string): CategoryMetrics | null {
    const row = this.rows.find(
      (r) => r.OPS_ZONE === opsZone && r.FOOD_CATEGORY === category,
    )
    if (!row) return null
    return this.buildCategoryMetrics(row)
  }

  // ── Helpers privados ───────────────────────────────────────────────────────

  private buildCategoryMetrics(row: RawCSVRow): CategoryMetrics {
    const ordersLast4Week = row.ORDERS_LAST_4WEEK
    const gmvLast4Week    = row.GMV_LAST_4WEEK
    const avgGmvStore     = row.AVG_GMV_STORE
    const avgOrdStore     = row.AVG_ORD_STORE

    return {
      category:           row.FOOD_CATEGORY,
      ordersLast4Week,
      ordersPerWeek:      ordersLast4Week / 4,
      ordersPerDay:       ordersLast4Week / 28,
      gmvLast4Week,
      gmvPerWeek:         gmvLast4Week / 4,
      avgTicket:          row.AVG_TICKET,
      peakDay:            row.PEAK_DAY,
      peakDayOrders:      row.PEAK_DAY_ORDERS,
      avgConnectivityHrs: row.AVG_CONNECTIVITY_HRS,
      avgGmvStore,
      avgGmvStorePerDay:  avgGmvStore / 28,
      avgOrdStore,
      avgOrdStorePerDay:  avgOrdStore / 28,
      availableRTs:       row.AVAILABLE_RTS,
      cancellationRate:   row.CANCELLATION_RATE,
    }
  }
}
