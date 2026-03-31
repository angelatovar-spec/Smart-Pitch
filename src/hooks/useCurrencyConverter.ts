import { useEffect } from 'react'
import { usePitchStore } from '../store/usePitchStore'

const CURRENCY_MAP: Record<string, string> = {
  'Colombia':   'COP',
  'México':     'MXN',
  'Argentina':  'ARS',
  'Chile':      'CLP',
  'Perú':       'PEN',
  'Ecuador':    'USD',
  'Uruguay':    'UYU',
  'Costa Rica': 'CRC',
}

async function getExchangeRate(country: string): Promise<number> {
  const res  = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
  const data = await res.json()
  const currency = CURRENCY_MAP[country] ?? 'USD'
  return (data.rates[currency] as number) ?? 1
}

/**
 * Obtiene la tasa de cambio USD → moneda local del país seleccionado.
 * La primera llamada por país hace el fetch; las siguientes usan el caché del store.
 *
 * Uso:
 *   const { rate } = useCurrencyConverter()
 *   formatLocalCurrency(usdValue * rate, zoneCountry)
 */
export function useCurrencyConverter(): { rate: number } {
  const zoneCountry    = usePitchStore((s) => s.zoneCountry)
  const exchangeRates  = usePitchStore((s) => s.exchangeRates)
  const setExchangeRate = usePitchStore((s) => s.setExchangeRate)

  useEffect(() => {
    // Ya está en caché — no volver a pedir
    if (exchangeRates[zoneCountry] !== undefined) return

    getExchangeRate(zoneCountry)
      .then((rate) => setExchangeRate(zoneCountry, rate))
      .catch(() => setExchangeRate(zoneCountry, 1))   // fallback sin conversión
  }, [zoneCountry]) // eslint-disable-line react-hooks/exhaustive-deps

  return { rate: exchangeRates[zoneCountry] ?? 1 }
}
