// ─────────────────────────────────────────────────────────────────────────────
// DataProvider.interface.ts
// Contrato central de la capa de datos.
// El resto de la app NUNCA importa una implementación directamente;
// siempre usa useDataContext() que expone una instancia de DataProvider.
// ─────────────────────────────────────────────────────────────────────────────

export interface CategoryMetrics {
  category: string
  // Órdenes
  ordersLast4Week: number     // ORDERS_LAST_4WEEK
  ordersPerWeek: number       // calculado: /4
  ordersPerDay: number        // calculado: /28
  // GMV
  gmvLast4Week: number        // GMV_LAST_4WEEK
  gmvPerWeek: number          // calculado: /4
  // Ticket
  avgTicket: number           // AVG_TICKET
  // Pico
  peakDay: string             // PEAK_DAY
  peakDayOrders: number       // PEAK_DAY_ORDERS
  // Conectividad
  avgConnectivityHrs: number  // AVG_CONNECTIVITY_HRS
  // Benchmarks por tienda
  avgGmvStore: number         // AVG_GMV_STORE
  avgGmvStorePerDay: number   // calculado: /28
  avgOrdStore: number         // AVG_ORD_STORE
  avgOrdStorePerDay: number   // calculado: /28
  // Competencia
  availableRTs: number        // AVAILABLE_RTS
  // Cancelación — solo para drawer de objeciones, NO en vista principal
  cancellationRate: number    // CANCELLATION_RATE
}

export interface ZoneSummary {
  opsZone: string             // OPS_ZONE
  opsZoneId: string           // OPS_ZONE_ID — solo para indexación interna
  country: string             // COUNTRY
  ciudad: string              // CIUDAD
  totalUsers: number          // TOTAL_USERS
  primeUsers: number          // PRIME_USERS
  primeRate: number           // calculado: primeUsers / totalUsers (0–1)
  categories: CategoryMetrics[]
}

export interface DataProvider {
  /** Carga datos desde un File (CSV upload) o un string (URL/path futuro) */
  loadData(source: File | string): Promise<void>

  /** Lista de todas las ops_zones disponibles */
  getZones(): string[]

  /** Resumen completo de una zona, o null si no existe */
  getZoneData(opsZone: string): ZoneSummary | null

  /** Métricas de una categoría específica dentro de una zona */
  getCategoryData(opsZone: string, category: string): CategoryMetrics | null

  /** Todas las categorías únicas a través de todas las zonas */
  getAllCategories(): string[]

  /** Indica si los datos ya fueron cargados */
  isLoaded(): boolean
}
