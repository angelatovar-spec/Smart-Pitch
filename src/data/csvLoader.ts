// ─────────────────────────────────────────────────────────────────────────────
// csvLoader.ts
// Parseo y validación del CSV de entrada.
// ─────────────────────────────────────────────────────────────────────────────

import Papa from 'papaparse'

// Columnas requeridas exactas del CSV (mayúsculas)
const REQUIRED_COLUMNS = [
  'COUNTRY',
  'OPS_ZONE',
  'OPS_ZONE_ID',
  'TOTAL_USERS',
  'PRIME_USERS',
  'FOOD_CATEGORY',
  'ORDERS_LAST_4WEEK',
  'GMV_LAST_4WEEK',
  'AVG_TICKET',
  'PEAK_DAY',
  'PEAK_DAY_ORDERS',
  'AVG_CONNECTIVITY_HRS',
  'AVG_GMV_STORE',
  'AVG_ORD_STORE',
  'AVAILABLE_RTS',
  'CANCELLATION_RATE',
] as const

// Columnas opcionales — si no existen se usa string vacío
const OPTIONAL_COLUMNS = ['CIUDAD'] as const

export type RequiredColumn = (typeof REQUIRED_COLUMNS)[number]

export interface RawCSVRow {
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

export interface CSVError {
  row: number
  column: string
  issue: string
}

export interface ParseResult {
  data: RawCSVRow[]
  errors: CSVError[]
  zones: string[]
}

/** Intenta parsear un valor como número; retorna NaN si falla */
function toNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return NaN
  return Number(String(val).replace(/,/g, '').trim())
}

/** Valida una fila ya parseada; retorna los errores encontrados */
function validateRow(
  row: Record<string, unknown>,
  rowIndex: number,
): { cleaned: RawCSVRow | null; errors: CSVError[] } {
  const errors: CSVError[] = []

  const addError = (column: string, issue: string) =>
    errors.push({ row: rowIndex + 2, column, issue }) // +2: header + 1-index

  // ── strings obligatorios ─────────────────────────────────────────────────
  const COUNTRY = String(row['COUNTRY'] ?? '').trim()
  if (!COUNTRY) addError('COUNTRY', 'Valor vacío')

  const OPS_ZONE = String(row['OPS_ZONE'] ?? '').trim()
  if (!OPS_ZONE) addError('OPS_ZONE', 'Valor vacío')

  const OPS_ZONE_ID = String(row['OPS_ZONE_ID'] ?? '').trim()
  if (!OPS_ZONE_ID) addError('OPS_ZONE_ID', 'Valor vacío')

  const FOOD_CATEGORY = String(row['FOOD_CATEGORY'] ?? '').trim()
  if (!FOOD_CATEGORY) addError('FOOD_CATEGORY', 'Valor vacío')

  const PEAK_DAY = String(row['PEAK_DAY'] ?? '').trim()
  if (!PEAK_DAY) addError('PEAK_DAY', 'Valor vacío')

  // CIUDAD es opcional — string vacío si no existe
  const CIUDAD = String(row['CIUDAD'] ?? '').trim()

  // ── números ──────────────────────────────────────────────────────────────
  const TOTAL_USERS = toNumber(row['TOTAL_USERS'])
  if (isNaN(TOTAL_USERS) || TOTAL_USERS < 0)
    addError('TOTAL_USERS', 'Debe ser un número positivo')

  const PRIME_USERS = toNumber(row['PRIME_USERS'])
  if (isNaN(PRIME_USERS) || PRIME_USERS < 0)
    addError('PRIME_USERS', 'Debe ser un número positivo')

  const ORDERS_LAST_4WEEK = toNumber(row['ORDERS_LAST_4WEEK'])
  if (isNaN(ORDERS_LAST_4WEEK) || ORDERS_LAST_4WEEK < 0)
    addError('ORDERS_LAST_4WEEK', 'Debe ser un número positivo')

  const GMV_LAST_4WEEK = toNumber(row['GMV_LAST_4WEEK'])
  if (isNaN(GMV_LAST_4WEEK) || GMV_LAST_4WEEK < 0)
    addError('GMV_LAST_4WEEK', 'Debe ser un número positivo')

  const AVG_TICKET = toNumber(row['AVG_TICKET'])
  if (isNaN(AVG_TICKET) || AVG_TICKET < 0)
    addError('AVG_TICKET', 'Debe ser un número positivo')

  const PEAK_DAY_ORDERS = toNumber(row['PEAK_DAY_ORDERS'])
  if (isNaN(PEAK_DAY_ORDERS) || PEAK_DAY_ORDERS < 0)
    addError('PEAK_DAY_ORDERS', 'Debe ser un número positivo')

  const AVG_CONNECTIVITY_HRS = toNumber(row['AVG_CONNECTIVITY_HRS'])
  if (isNaN(AVG_CONNECTIVITY_HRS) || AVG_CONNECTIVITY_HRS < 0)
    addError('AVG_CONNECTIVITY_HRS', 'Debe ser un número positivo')

  const AVG_GMV_STORE = toNumber(row['AVG_GMV_STORE'])
  if (isNaN(AVG_GMV_STORE) || AVG_GMV_STORE < 0)
    addError('AVG_GMV_STORE', 'Debe ser un número positivo')

  const AVG_ORD_STORE = toNumber(row['AVG_ORD_STORE'])
  if (isNaN(AVG_ORD_STORE) || AVG_ORD_STORE < 0)
    addError('AVG_ORD_STORE', 'Debe ser un número positivo')

  const AVAILABLE_RTS = toNumber(row['AVAILABLE_RTS'])
  if (isNaN(AVAILABLE_RTS) || AVAILABLE_RTS < 0)
    addError('AVAILABLE_RTS', 'Debe ser un número positivo')

  const CANCELLATION_RATE = toNumber(row['CANCELLATION_RATE'])
  if (isNaN(CANCELLATION_RATE) || CANCELLATION_RATE < 0 || CANCELLATION_RATE > 1)
    addError('CANCELLATION_RATE', 'Debe estar entre 0 y 1 (ej: 0.08)')

  if (errors.length > 0) return { cleaned: null, errors }

  return {
    cleaned: {
      COUNTRY,
      CIUDAD,
      OPS_ZONE,
      OPS_ZONE_ID,
      TOTAL_USERS,
      PRIME_USERS,
      FOOD_CATEGORY,
      ORDERS_LAST_4WEEK,
      GMV_LAST_4WEEK,
      AVG_TICKET,
      PEAK_DAY,
      PEAK_DAY_ORDERS,
      AVG_CONNECTIVITY_HRS,
      AVG_GMV_STORE,
      AVG_ORD_STORE,
      AVAILABLE_RTS,
      CANCELLATION_RATE,
    },
    errors: [],
  }
}

/**
 * Parsea y valida un archivo CSV.
 * Exportación principal del módulo.
 */
export function parseAndValidateCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const rawData = results.data as Record<string, unknown>[]
        const allErrors: CSVError[] = []

        // ── Verificar columnas requeridas ────────────────────────────────
        if (rawData.length === 0) {
          resolve({
            data: [],
            errors: [{ row: 0, column: '', issue: 'El archivo CSV está vacío' }],
            zones: [],
          })
          return
        }

        const presentColumns = Object.keys(rawData[0])
        const missingColumns = REQUIRED_COLUMNS.filter(
          (col) => !presentColumns.includes(col),
        )

        if (missingColumns.length > 0) {
          resolve({
            data: [],
            errors: missingColumns.map((col) => ({
              row: 0,
              column: col,
              issue: `Columna requerida no encontrada`,
            })),
            zones: [],
          })
          return
        }

        // ── Validar fila a fila ──────────────────────────────────────────
        const validRows: RawCSVRow[] = []

        rawData.forEach((row, index) => {
          const { cleaned, errors } = validateRow(row, index)
          if (cleaned) validRows.push(cleaned)
          allErrors.push(...errors)
        })

        const zones = [...new Set(validRows.map((r) => r.OPS_ZONE))].sort()

        resolve({ data: validRows, errors: allErrors, zones })
      },
      error(err) {
        resolve({
          data: [],
          errors: [{ row: 0, column: '', issue: err.message }],
          zones: [],
        })
      },
    })
  })
}
