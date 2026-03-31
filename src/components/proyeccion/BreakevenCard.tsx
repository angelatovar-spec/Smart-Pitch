import { usePitchStore } from '../../store/usePitchStore'
import { calculateProjection } from '../../services/projectionEngine'

export function BreakevenCard() {
  const { projection, pl, brand, categoryData } = usePitchStore()
  if (!projection.data) return null

  const targetMonthlySales = pl.aliado.avgTicket * pl.aliado.dailyOrders * pl.aliado.operativeDays
  const avgTicket = categoryData?.avgTicket ?? brand.avgTicket

  const result = calculateProjection({
    targetMonthlySales,
    rampUpPct: projection.rampUpPct / 100,
    rampUpMonths: projection.rampUpMonths,
    monthlyGrowth: projection.monthlyGrowth / 100,
    avgTicket,
    commission: pl.commission / 100,
    discounts: pl.discounts / 100,
    rawMaterialPct: brand.costs.rawMaterial / 100,
    payrollPct: brand.costs.payroll / 100,
  })

  const milestones = [1, 3, 6, 12]
  const rows = milestones.map((m) => result.months[m - 1])

  return (
    <div className="card">
      <h2 className="section-title">Pedidos por día</h2>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {rows.map((row) => (
          <div key={row.month} className="text-center">
            <p className="text-[10px] text-gray-400 mb-1">Mes {row.month}</p>
            <p className="text-xl font-black text-gray-900">{row.orders}</p>
            <p className="text-[10px] text-gray-400">pedidos/día</p>
          </div>
        ))}
      </div>

      <div className="bg-orange-50 rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-rappi-orange rounded-full flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-500">Break-even estimado</p>
          <p className="text-sm font-bold text-rappi-orange">
            {result.breakevenOrdersPerDay} pedidos/día para punto de equilibrio
          </p>
        </div>
      </div>
    </div>
  )
}
