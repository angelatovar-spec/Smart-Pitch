// ─────────────────────────────────────────────────────────────────────────────
// formatters.ts — helpers de formato para la app Smart Pitch Rappi
// ─────────────────────────────────────────────────────────────────────────────

// ── Moneda local por país ─────────────────────────────────────────────────────

function currencySymbol(country: string): string {
  if (country === 'Perú') return 'S/'
  if (country === 'Costa Rica') return '₡'
  return '$'
}

// Mexico uses comma as thousands separator; all others use dot (es-CO style)
function currencyLocale(country: string): string {
  return country === 'México' ? 'es-MX' : 'es-CO'
}

/**
 * Formatea un valor monetario según el país: $164.142 / S/164.142 / ₡164.142
 * Reemplaza formatCOP() en toda la app.
 */
export function formatLocalCurrency(value: number, country: string): string {
  return currencySymbol(country) + Math.round(value).toLocaleString(currencyLocale(country))
}

/**
 * Formato compacto para gráficos y resúmenes: $1.2M / $45K / S/300K
 * Usa el símbolo correcto según el país.
 */
export function formatLocalCurrencyCompact(value: number, country: string): string {
  const sym = currencySymbol(country)
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${sym}${(value / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000)     return `${sym}${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)         return `${sym}${(value / 1_000).toFixed(0)}K`
  return `${sym}${Math.round(value)}`
}

/** Traduce abreviaciones inglesas del CSV al nombre completo en español */
export function translateDay(day: string): string {
  const MAP: Record<string, string> = {
    mon: 'lunes',    lunes: 'lunes',
    tue: 'martes',   martes: 'martes',
    wed: 'miércoles', miercoles: 'miércoles', 'miércoles': 'miércoles', wednesday: 'miércoles',
    thu: 'jueves',   jueves: 'jueves',
    fri: 'viernes',  viernes: 'viernes',
    sat: 'sábado',   sabado: 'sábado', 'sábado': 'sábado',
    sun: 'domingo',  domingo: 'domingo',
  }
  return MAP[day.toLowerCase().trim()] ?? day
}

/** @deprecated Usar formatLocalCurrency(value, country) */
export function formatCOP(value: number): string {
  return '$' + Math.round(value).toLocaleString('es-CO')
}

/** Formato porcentaje colombiano: 0.072 → "7,2%" */
export function formatPct(value: number): string {
  return (value * 100).toFixed(1).replace('.', ',') + '%'
}

/** Formato porcentaje desde entero: 18 → "18,0%" */
export function formatPctInt(value: number): string {
  return value.toFixed(1).replace('.', ',') + '%'
}

/** Fecha legible en español colombiano */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Número compacto: 45200 → "45.200" */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('es-CO')
}
