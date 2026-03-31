// ─────────────────────────────────────────────────────────────────────────────
// SnowflakeDataProvider.ts
// Stub vacío — implementación futura del DataProvider conectado a Snowflake.
//
// TODO: Implementar cuando el equipo de datos exponga el endpoint.
// Pasos sugeridos:
//   1. Reemplazar loadData() para llamar al endpoint backend que ejecuta
//      la query en Snowflake (nunca exponer credenciales en el cliente).
//   2. Endpoint sugerido: POST /api/zone-data?zone=<opsZone>
//   3. Cambiar dataContext.tsx para instanciar SnowflakeDataProvider
//      en lugar de CSVDataProvider cuando VITE_DATA_SOURCE=snowflake.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  DataProvider,
  ZoneSummary,
  CategoryMetrics,
} from './DataProvider.interface'

export class SnowflakeDataProvider implements DataProvider {
  // TODO: Inyectar base URL del backend
  // private apiBase = import.meta.env.VITE_API_BASE_URL

  async loadData(_source: File | string): Promise<void> {
    // TODO: Llamar al backend que consulta Snowflake
    // const response = await fetch(`${this.apiBase}/api/zone-data`)
    // this.data = await response.json()
    throw new Error('SnowflakeDataProvider no implementado aún')
  }

  getZones(): string[] {
    // TODO: Retornar zonas desde caché o llamada al backend
    return []
  }

  getZoneData(_opsZone: string): ZoneSummary | null {
    // TODO: Retornar datos de zona desde Snowflake
    return null
  }

  getCategoryData(_opsZone: string, _category: string): CategoryMetrics | null {
    // TODO: Retornar datos de categoría desde Snowflake
    return null
  }

  getAllCategories(): string[] {
    // TODO: Retornar todas las categorías desde Snowflake
    return []
  }

  isLoaded(): boolean {
    // TODO: Verificar si los datos están disponibles
    return false
  }
}
