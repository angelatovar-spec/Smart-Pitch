// ─────────────────────────────────────────────────────────────────────────────
// plCalculator.ts
// Lógica del modelo P&L — sin/con Rappi.
//
// Reglas críticas:
// 1. Arriendo, servicios y otros: COSTOS FIJOS. No cambian con Rappi. Diff = 0.
// 2. Nómina incremental Rappi = payrollPct * rappiSales * 0.20
//    (solo 20% adicional; la capacidad operativa ya existe)
// 3. Canal Rappi = avgTicket × dailyOrders × operativeDays
// 4. Campañas de marketing se suman como costo del canal Rappi
// ─────────────────────────────────────────────────────────────────────────────

export interface PLParams {
  monthlyRevenue: number    // ventas canal propio (sin Rappi)
  rappiSales: number        // ventas canal Rappi = ticket × pedidos × días
  rawMaterialPct: number    // % materia prima (0-1)
  payrollPct: number        // % nómina (0-1)
  rentPct: number           // % arriendo (0-1)
  servicesPct: number       // % servicios (0-1)
  othersPct: number         // % otros (0-1)
  commission: number        // comisión Rappi (0-1, ej: 0.18)
  discounts: number         // descuentos/promociones (0-1)
  marketingPct: number      // suma de todas las campañas de marketing (0-1)
}

export interface PLRow {
  label: string
  indented: boolean
  isTotal: boolean
  isSeparator?: boolean
  withoutRappi: number | null
  withRappi: number | null
  diff: number | null
}

export interface PLResult {
  rows: PLRow[]
  badge: 'positive' | 'review'
  ownSales: number            // ventas actuales canal propio
  additionalProfit: number
  additionalSales: number     // rappiSales
  commissionPaid: number
  marketingPaid: number
  channelCosts: number        // commissionPaid + discountAmount + marketingPaid
  roi: number
  netIncomeWithRappi: number
  operatingProfitWithRappi: number
  operatingProfitWithout: number
  marginWithout: number
  marginWith: number
}

export function calculatePL(params: PLParams): PLResult {
  const {
    monthlyRevenue,
    rappiSales,
    rawMaterialPct,
    payrollPct,
    rentPct,
    servicesPct,
    othersPct,
    commission,
    discounts,
    marketingPct,
  } = params

  // ── Ventas ────────────────────────────────────────────────────────────────
  const ownSales = monthlyRevenue
  const totalSalesWith = ownSales + rappiSales

  // ── Ingresos ──────────────────────────────────────────────────────────────
  const commissionPaid = rappiSales * commission
  const discountAmount = rappiSales * discounts
  const marketingPaid = rappiSales * marketingPct
  const netIncomeWithout = monthlyRevenue
  const netIncomeWith = ownSales + rappiSales - commissionPaid - discountAmount - marketingPaid

  // ── Costos ────────────────────────────────────────────────────────────────
  // Materia prima: aplica sobre ventas totales
  const rawMatWithout = monthlyRevenue * rawMaterialPct
  const rawMatWith = totalSalesWith * rawMaterialPct

  // Nómina: 20% incremental sobre las ventas Rappi
  const payrollWithout = monthlyRevenue * payrollPct
  const payrollWith = payrollWithout + rappiSales * payrollPct * 0.2

  // Fijos: no cambian
  const rentFixed = monthlyRevenue * rentPct
  const servicesFixed = monthlyRevenue * servicesPct
  const othersFixed = monthlyRevenue * othersPct

  // ── Utilidad ──────────────────────────────────────────────────────────────
  const totalCostsWithout = rawMatWithout + payrollWithout + rentFixed + servicesFixed + othersFixed
  const totalCostsWith = rawMatWith + payrollWith + rentFixed + servicesFixed + othersFixed

  const operatingProfitWithout = netIncomeWithout - totalCostsWithout
  const operatingProfitWithRappi = netIncomeWith - totalCostsWith
  const additionalProfit = operatingProfitWithRappi - operatingProfitWithout
  const roi = commissionPaid > 0 ? (additionalProfit / commissionPaid) * 100 : 0

  const marginWithout = netIncomeWithout > 0 ? (operatingProfitWithout / netIncomeWithout) * 100 : 0
  const marginWith = netIncomeWith > 0 ? (operatingProfitWithRappi / netIncomeWith) * 100 : 0

  // ── Tabla ─────────────────────────────────────────────────────────────────
  const row = (
    label: string, indented: boolean, isTotal: boolean,
    wo: number | null, w: number | null,
  ): PLRow => ({
    label, indented, isTotal,
    withoutRappi: wo, withRappi: w,
    diff: wo !== null && w !== null ? w - wo : w !== null ? w : null,
  })

  const rows: PLRow[] = [
    row('Ventas brutas', false, false, ownSales, totalSalesWith),
    row('Canal propio', true, false, ownSales, ownSales),
    row('Canal Rappi', true, false, null, rappiSales),
    row('Comisión Rappi (-)', false, false, null, -commissionPaid),
    row('Descuentos / promos (-)', false, false, null, -discountAmount),
    ...(marketingPaid > 0 ? [row('Campañas marketing (-)', false, false, null, -marketingPaid)] : []),
    row('Ingreso neto', false, true, netIncomeWithout, netIncomeWith),
    row('Materia prima (-)', false, false, -rawMatWithout, -rawMatWith),
    row('Nómina (-)', false, false, -payrollWithout, -payrollWith),
    row('Arriendo (-)', false, false, -rentFixed, -rentFixed),
    row('Servicios (-)', false, false, -servicesFixed, -servicesFixed),
    row('Otros (-)', false, false, -othersFixed, -othersFixed),
    {
      label: 'UTILIDAD OPERACIONAL',
      indented: false, isTotal: true,
      withoutRappi: operatingProfitWithout,
      withRappi: operatingProfitWithRappi,
      diff: additionalProfit,
    },
    {
      label: 'Margen operacional',
      indented: false, isTotal: false,
      withoutRappi: marginWithout,
      withRappi: marginWith,
      diff: marginWith - marginWithout,
    },
  ]

  return {
    rows,
    badge: additionalProfit >= 0 ? 'positive' : 'review',
    ownSales: monthlyRevenue,
    additionalProfit,
    additionalSales: rappiSales,
    commissionPaid,
    marketingPaid,
    channelCosts: commissionPaid + discountAmount + marketingPaid,
    roi,
    netIncomeWithRappi: netIncomeWith,
    operatingProfitWithRappi,
    operatingProfitWithout,
    marginWithout,
    marginWith,
  }
}
