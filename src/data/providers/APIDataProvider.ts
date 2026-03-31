// ─────────────────────────────────────────────────────────────────────────────
// APIDataProvider.ts
// Implementación de DataProvider que carga datos desde /api/zone-data.
// El CSV vive en el servidor — la UI nunca lo toca directamente.
// ─────────────────────────────────────────────────────────────────────────────

import type { DataProvider, ZoneSummary, CategoryMetrics } from './DataProvider.interface'

// Corresponde a la estructura del CSV parseado que devuelve el endpoint
interface ZoneRow {
  COUNTRY: string
  CIUDAD: string
  OPS_ZONE: string
  OPS_ZONE_ID: string
  TOTAL_USERS: number
  PRIME_USERS: number
  FOOD_CATEGORY: string
  ORDERS_LAST_4WEEK: number
  GMV_LAST_4WEEK: number
  AVG_TICKET: number
  PEAK_DAY: string
  PEAK_DAY_ORDERS: number
  AVG_CONNECTIVITY_HRS: number
  AVG_GMV_STORE: number
  AVG_ORD_STORE: number
  AVAILABLE_RTS: number
  CANCELLATION_RATE: number
}

export interface APIZoneResponse {
  data: ZoneRow[]
  updatedAt: string   // ISO string desde el servidor
}

export class APIDataProvider implements DataProvider {
  private rows: ZoneRow[] = []
  private _loaded = false
  public updatedAt: string | null = null

  // ── Carga de datos ─────────────────────────────────────────────────────────

  /** Para cumplir la interfaz DataProvider (no se usa en este provider) */
  async loadData(_source: File | string): Promise<void> {
    throw new Error('APIDataProvider no acepta carga directa. Usar initialize().')
  }

  /** Fetch desde /api/zone-data y construye el índice en memoria */
  async initialize(): Promise<void> {
    const res = await fetch('/api/zone-data')
    if (!res.ok) {
      throw new Error(`No se pudo cargar la data de zonas (${res.status})`)
    }
    const json: APIZoneResponse = await res.json()

    this.rows = (json.data ?? []).filter((r) =>
      r.OPS_ZONE && r.FOOD_CATEGORY && r.TOTAL_USERS > 0
    )
    this.updatedAt = json.updatedAt ?? null
    this._loaded = true
  }

  // ── Implementación de la interfaz ──────────────────────────────────────────

  isLoaded(): boolean {
    return this._loaded
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

  // ── Helper ─────────────────────────────────────────────────────────────────

  private buildCategoryMetrics(row: ZoneRow): CategoryMetrics {
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
