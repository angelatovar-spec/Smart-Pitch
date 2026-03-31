// ─────────────────────────────────────────────────────────────────────────────
// projectionEngine.ts
// Calcula la proyección de ventas Rappi para los primeros 12 meses.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectionParams {
  targetMonthlySales: number  // ventas Rappi objetivo (mes madurez)
  rampUpPct: number           // % del potencial en mes 1 (0-1, ej: 0.40)
  rampUpMonths: number        // meses hasta alcanzar madurez
  monthlyGrowth: number       // crecimiento mensual post-madurez (0-1, ej: 0.03)
  avgTicket: number           // ticket promedio para calcular pedidos
  commission: number          // comisión Rappi (0-1)
  discounts: number           // descuentos (0-1)
  rawMaterialPct: number
  payrollPct: number
}

export interface MonthlyProjection {
  month: number
  sales: number
  orders: number            // pedidos/día
  netIncome: number
  operatingProfit: number
}

export interface ProjectionResult {
  months: MonthlyProjection[]
  totalYear1Sales: number
  totalYear1Profit: number
  month12Sales: number
  breakevenOrdersPerDay: number  // pedidos/día para punto de equilibrio
}

export function calculateProjection(params: ProjectionParams): ProjectionResult {
  const {
    targetMonthlySales,
    rampUpPct,
    rampUpMonths,
    monthlyGrowth,
    avgTicket,
    commission,
    discounts,
    rawMaterialPct,
    payrollPct,
  } = params

  const months: MonthlyProjection[] = []

  for (let m = 1; m <= 12; m++) {
    let sales: number

    if (m === 1) {
      // Mes 1: ramp-up inicial
      sales = targetMonthlySales * rampUpPct
    } else if (m <= rampUpMonths) {
      // Ramp-up lineal hasta la madurez
      const progress = (m - 1) / (rampUpMonths - 1)
      sales = targetMonthlySales * (rampUpPct + (1 - rampUpPct) * progress)
    } else {
      // Post-madurez: crecimiento estable
      const monthsPostMaturity = m - rampUpMonths
      sales = targetMonthlySales * Math.pow(1 + monthlyGrowth, monthsPostMaturity)
    }

    const netIncome = sales * (1 - commission) * (1 - discounts)
    // Simplificación: solo costo variable incremental de Rappi
    const variableCosts = sales * rawMaterialPct + sales * payrollPct * 0.2
    const operatingProfit = netIncome - variableCosts

    const ordersPerDay = avgTicket > 0 ? Math.round(sales / avgTicket / 30) : 0

    months.push({
      month: m,
      sales: Math.round(sales),
      orders: ordersPerDay,
      netIncome: Math.round(netIncome),
      operatingProfit: Math.round(operatingProfit),
    })
  }

  const totalYear1Sales = months.reduce((s, m) => s + m.sales, 0)
  const totalYear1Profit = months.reduce((s, m) => s + m.operatingProfit, 0)
  const month12Sales = months[11].sales

  // Punto de equilibrio: pedidos/día donde utilidad = 0
  // netIncome = variableCosts → sales*(1-c)*(1-d) = sales*(rawMat + payroll*0.2)
  // → siempre positivo si márgenes > 0; usamos el punto donde cubre comisión
  const marginRate = (1 - commission) * (1 - discounts) - rawMaterialPct - payrollPct * 0.2
  const breakevenDailySales = marginRate > 0 ? 0 : 9999
  const breakevenOrdersPerDay =
    marginRate > 0 && avgTicket > 0
      ? Math.ceil(breakevenDailySales / avgTicket)
      : Math.ceil((targetMonthlySales * 0.1) / avgTicket / 30)

  return {
    months,
    totalYear1Sales: Math.round(totalYear1Sales),
    totalYear1Profit: Math.round(totalYear1Profit),
    month12Sales: Math.round(month12Sales),
    breakevenOrdersPerDay: Math.max(breakevenOrdersPerDay, 1),
  }
}
