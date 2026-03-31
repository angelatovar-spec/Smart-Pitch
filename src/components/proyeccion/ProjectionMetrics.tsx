import { usePitchStore } from '../../store/usePitchStore'
import { calculateProjection } from '../../services/projectionEngine'
import { formatLocalCurrencyCompact } from '../../utils/formatters'

export function ProjectionMetrics() {
  const { projection, pl, brand, categoryData, zoneCountry } = usePitchStore()
  if (!projection.data) return null

  const targetMonthlySales = pl.aliado.avgTicket * pl.aliado.dailyOrders * pl.aliado.operativeDays
  const result = calculateProjection({
    targetMonthlySales,
    rampUpPct: projection.rampUpPct / 100,
    rampUpMonths: projection.rampUpMonths,
    monthlyGrowth: projection.monthlyGrowth / 100,
    avgTicket: categoryData?.avgTicket ?? brand.avgTicket,
    commission: pl.commission / 100,
    discounts: pl.discounts / 100,
    rawMaterialPct: brand.costs.rawMaterial / 100,
    payrollPct: brand.costs.payroll / 100,
  })

  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: 'Ventas año 1', value: formatLocalCurrencyCompact(result.totalYear1Sales, zoneCountry) },
        { label: 'Utilidad año 1', value: formatLocalCurrencyCompact(result.totalYear1Profit, zoneCountry) },
        { label: 'Ventas mes 12', value: formatLocalCurrencyCompact(result.month12Sales, zoneCountry) },
        { label: 'Pedidos/día mes 1', value: `${result.months[0].orders}` },
      ].map(({ label, value }) => (
        <div key={label} className="kpi-card">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-black text-rappi-orange">{value}</p>
        </div>
      ))}
    </div>
  )
}
