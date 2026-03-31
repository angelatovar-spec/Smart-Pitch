import { usePitchStore } from '../../store/usePitchStore'
import { formatLocalCurrency, translateDay } from '../../utils/formatters'
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter'

export function CategoryMetricsPanel() {
  const categoryData    = usePitchStore((s) => s.categoryData)
  const selectedCategory = usePitchStore((s) => s.selectedCategory)
  const zoneCountry     = usePitchStore((s) => s.zoneCountry)
  const { rate }        = useCurrencyConverter()

  if (!categoryData || !selectedCategory) return null

  const items = [
    { label: 'Órdenes últimas 4 semanas', value: categoryData.ordersLast4Week.toLocaleString('es-CO') },
    { label: 'Promedio diario', value: `${Math.round(categoryData.ordersPerDay)} órdenes/día` },
    { label: 'Ticket promedio', value: formatLocalCurrency(categoryData.avgTicket * rate, zoneCountry) },
    { label: 'Día pico', value: `${translateDay(categoryData.peakDay)} · ${categoryData.peakDayOrders} órdenes` },
    { label: 'Conectividad benchmark', value: `${categoryData.avgConnectivityHrs.toFixed(1).replace('.', ',')} hrs/día` },
    { label: 'GMV 4 semanas (categoría)', value: formatLocalCurrency(categoryData.gmvLast4Week * rate, zoneCountry), highlight: true },
  ]

  return (
    <div className="card">
      <h2 className="section-title">{selectedCategory} en la zona</h2>
      <ul className="space-y-3">
        {items.map(({ label, value, highlight }) => (
          <li key={label} className={[
            'flex justify-between items-center text-sm',
            highlight ? 'bg-orange-50 -mx-2 px-2 py-2 rounded-xl' : '',
          ].join(' ')}>
            <span className="text-gray-600">{label}</span>
            <span className={[
              'font-semibold',
              highlight ? 'text-rappi-orange text-base' : 'text-gray-900',
            ].join(' ')}>
              {value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
