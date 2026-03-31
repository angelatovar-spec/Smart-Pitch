import { usePitchStore } from '../store/usePitchStore'
import { StepNav } from '../components/shared/StepNav'
import { formatLocalCurrency, formatPctInt } from '../utils/formatters'
import type { PLRow } from '../services/plCalculator'

const SCHEDULE_OPTIONS = [
  '08:00 - 16:00', '10:00 - 20:00', '11:00 - 22:00',
  '12:00 - 22:00', '12:00 - 00:00', '14:00 - 22:00', 'Otro',
]

// ── Helpers UI ────────────────────────────────────────────────────────────────

function SuggestBadge({ label }: { label: string }) {
  return (
    <span className="text-[10px] bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full ml-1.5">
      Sug: {label}
    </span>
  )
}

function NumInput({
  value, onChange, prefix, suffix, placeholder, min, max,
}: {
  value: number; onChange: (v: number) => void
  prefix?: string; suffix?: string; placeholder?: string
  min?: number; max?: number
}) {
  return (
    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-rappi-orange/30 focus-within:border-rappi-orange transition-colors bg-white">
      {prefix && (
        <span className="px-3 text-sm text-gray-500 border-r border-gray-100 bg-gray-50 shrink-0">
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder}
        min={min}
        max={max}
        className="flex-1 px-3 py-2.5 text-sm focus:outline-none tabular-nums bg-white min-w-0"
      />
      {suffix && (
        <span className="px-3 text-sm text-gray-500 border-l border-gray-100 bg-gray-50 shrink-0">
          {suffix}
        </span>
      )}
    </div>
  )
}

function SliderInput({
  label, value, min, max, onChange, unit = '%', hint,
}: {
  label: string; value: number; min: number; max: number
  onChange: (v: number) => void; unit?: string; hint?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-600 font-medium">{label}</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
            className="w-14 text-right text-sm font-bold border border-gray-200 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-rappi-orange/30 tabular-nums"
          />
          <span className="text-xs text-gray-500">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ minHeight: '28px' }}
      />
      {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
    </div>
  )
}

// ── Helpers de formato ────────────────────────────────────────────────────────

function fmtCOP(v: number | null, country = 'Colombia'): string {
  if (v === null) return '—'
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : v > 0 ? '+' : ''
  return `${sign}${formatLocalCurrency(abs, country)}`
}

function fmtDiff(v: number | null, country: string, isMargin?: boolean): string {
  if (v === null) return '—'
  if (isMargin) {
    const sign = v > 0 ? '+' : ''
    return `${sign}${v.toFixed(1).replace('.', ',')}pp`
  }
  if (v === 0) return '='
  return fmtCOP(v, country)
}

function diffColor(v: number | null): string {
  if (v === null) return 'text-gray-400'
  if (v > 0) return 'text-green-600'
  if (v < 0) return 'text-red-500'
  return 'text-gray-400'
}

function PLTableRow({ row, country }: { row: PLRow; country: string }) {
  const isMargin = row.label === 'Margen operacional'
  const isUtilidad = row.label === 'UTILIDAD OPERACIONAL'
  const isPositive = (row.diff ?? 0) > 0

  const fmtCell = (v: number | null) => {
    if (v === null) return '—'
    if (isMargin) return `${v.toFixed(1).replace('.', ',')}%`
    return fmtCOP(v, country)
  }

  return (
    <tr className={[
      'border-b border-gray-50',
      isUtilidad
        ? (isPositive ? 'bg-green-50' : 'bg-red-50')
        : row.isTotal ? 'bg-gray-50' : 'hover:bg-gray-50/40',
    ].join(' ')}>
      <td className={[
        'py-1.5 text-xs',
        row.indented ? 'pl-5 text-gray-400' : 'pl-2 text-gray-800',
        row.isTotal ? 'font-bold text-gray-900' : '',
      ].join(' ')}>
        {row.label}
      </td>
      <td className="py-1.5 text-right text-xs text-gray-600 pr-2 tabular-nums">
        {fmtCell(row.withoutRappi)}
      </td>
      <td className="py-1.5 text-right text-xs text-gray-700 pr-2 tabular-nums font-medium">
        {fmtCell(row.withRappi)}
      </td>
      <td className={[
        'py-1.5 text-right text-xs pr-2 tabular-nums font-semibold',
        diffColor(row.diff),
      ].join(' ')}>
        {fmtDiff(row.diff, country, isMargin)}
      </td>
    </tr>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function PLPage({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const {
    brand, pl, categoryData, zoneCountry,
    setBrand, setBrandCosts, setPLParam, setPLAliado,
    addMarketingCampaign, updateMarketingCampaign, removeMarketingCampaign,
  } = usePitchStore()

  const { aliado, commission, discounts, incrementalityPct, marketingCampaigns, result } = pl
  const costs = brand.costs

  // Cálculos derivados para mostrar en UI
  const ownSalesMes = aliado.avgTicket * aliado.dailyOrders * aliado.operativeDays
  const rappiDiario = Math.round(aliado.dailyOrders * (incrementalityPct / 100) * 10) / 10
  const rappiMes = aliado.avgTicket * rappiDiario * aliado.operativeDays

  const totalCostPct = costs.rawMaterial + costs.payroll + costs.rent + costs.services + costs.others
  const marketingTotal = marketingCampaigns.reduce((s, c) => s + c.percentage, 0)
  const isIncrementalityAdjusted = incrementalityPct !== 30

  const suggestedTicket = categoryData?.avgTicket ?? 0
  const suggestedOrders = categoryData ? Math.round(categoryData.ordersPerDay) : 0

  const canContinue = !!brand.name && aliado.avgTicket > 0 && aliado.dailyOrders > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
      <div>
        <h1 className="text-xl font-black text-gray-900">Análisis del negocio</h1>
        <p className="text-sm text-gray-500 mt-0.5">Datos del restaurante y modelo P&L</p>
      </div>

      {/* ── A) DATOS DEL RESTAURANTE ── */}
      <div className="card p-3 space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Datos del restaurante
        </h2>

        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">
            Nombre del restaurante <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={brand.name}
            onChange={(e) => setBrand({ name: e.target.value })}
            placeholder="Ej: Hamburguesas El Corral"
            className="input-field text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Sedes en la zona</label>
            <NumInput
              value={brand.branches}
              onChange={(v) => setBrand({ branches: Math.max(1, v) })}
              min={1}
              placeholder="1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Horario de operación</label>
            <select
              value={brand.schedule}
              onChange={(e) => setBrand({ schedule: e.target.value })}
              className="input-field text-sm"
            >
              {SCHEDULE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── B) BASE DEL CÁLCULO ── */}
      <div className="card p-3 space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Volumen actual del restaurante
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">
              Ticket promedio
              {suggestedTicket > 0 && <SuggestBadge label={formatLocalCurrency(suggestedTicket, zoneCountry)} />}
            </label>
            <NumInput
              value={aliado.avgTicket}
              onChange={(v) => setPLAliado('avgTicket', v)}
              prefix="$"
              placeholder="38000"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">
              Pedidos actuales / día
              {suggestedOrders > 0 && <SuggestBadge label={`~${suggestedOrders}`} />}
            </label>
            <NumInput
              value={aliado.dailyOrders}
              onChange={(v) => setPLAliado('dailyOrders', v)}
              placeholder="45"
              min={0}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Días operativos / mes</label>
            <NumInput
              value={aliado.operativeDays}
              onChange={(v) => setPLAliado('operativeDays', v)}
              placeholder="26"
              min={1}
              max={31}
            />
          </div>
        </div>

        {ownSalesMes > 0 && (
          <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500">Ventas actuales estimadas</p>
              <p className="text-base font-black text-gray-900">{formatLocalCurrency(ownSalesMes, zoneCountry)} / mes</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">Margen actual estimado</p>
              <p className={[
                'text-sm font-bold',
                (100 - totalCostPct) >= 15 ? 'text-green-600' : 'text-yellow-600',
              ].join(' ')}>
                {Math.max(0, 100 - totalCostPct).toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── C) ESTRUCTURA DE COSTOS ── */}
      <div className="card p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Estructura de costos
          </h2>
          <span className={[
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            totalCostPct > 85 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600',
          ].join(' ')}>
            {totalCostPct.toFixed(0)}% total
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {([
            { key: 'rawMaterial' as const, label: 'Materia prima', suggested: 35 },
            { key: 'payroll' as const, label: 'Nómina', suggested: 22 },
            { key: 'rent' as const, label: 'Arriendo', suggested: 10 },
            { key: 'services' as const, label: 'Servicios', suggested: 4 },
            { key: 'others' as const, label: 'Otros fijos', suggested: 5 },
          ] as { key: keyof typeof costs; label: string; suggested: number }[]).map(({ key, label, suggested }) => (
            <div key={key}>
              <label className="text-[10px] text-gray-500 block mb-0.5">
                {label}
                <span className="text-[9px] text-blue-400 ml-1">Sug: {suggested}%</span>
              </label>
              <NumInput
                value={costs[key]}
                onChange={(v) => setBrandCosts({ [key]: v })}
                suffix="%"
                min={0}
                max={100}
              />
            </div>
          ))}
        </div>

        {totalCostPct > 85 && (
          <p className="text-[10px] text-red-500">
            Estructura de costos alta ({totalCostPct.toFixed(0)}%). Puede afectar la viabilidad.
          </p>
        )}
      </div>

      {/* ── D) PARÁMETROS RAPPI ── */}
      <div className="card p-3 space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Parámetros Rappi
        </h2>

        {/* Incrementalidad */}
        <div className="bg-orange-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700">% Incrementalidad Rappi</p>
            <span className={[
              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
              isIncrementalityAdjusted
                ? 'bg-amber-100 text-amber-700'
                : 'bg-orange-100 text-rappi-orange',
            ].join(' ')}>
              {isIncrementalityAdjusted ? `Ajustado a: ${incrementalityPct}%` : 'Supuesto base Rappi: 30%'}
            </span>
          </div>
          <SliderInput
            label=""
            value={incrementalityPct}
            min={10}
            max={80}
            onChange={(v) => setPLParam('incrementalityPct', v)}
            hint={rappiDiario > 0
              ? `Rappi generaría ~${rappiDiario} pedidos/día adicionales · ${formatLocalCurrency(rappiMes, zoneCountry)}/mes`
              : undefined}
          />
        </div>

        <SliderInput
          label="Comisión Rappi"
          value={commission}
          min={12}
          max={30}
          onChange={(v) => setPLParam('commission', v)}
        />

        <SliderInput
          label="Descuentos / promociones"
          value={discounts}
          min={0}
          max={20}
          onChange={(v) => setPLParam('discounts', v)}
        />

        {/* Campañas de marketing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 font-medium">
              Inversión marketing
              {marketingTotal > 0 && (
                <span className="ml-2 text-rappi-orange font-semibold">{marketingTotal}%</span>
              )}
            </span>
            <button
              onClick={addMarketingCampaign}
              className="text-xs text-rappi-orange font-semibold hover:underline"
            >
              + Agregar campaña
            </button>
          </div>

          {marketingCampaigns.length > 0 && (
            <div className="space-y-1.5">
              {marketingCampaigns.map((camp) => (
                <div key={camp.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={camp.name}
                    onChange={(e) => updateMarketingCampaign(camp.id, { name: e.target.value })}
                    placeholder="Nombre campaña"
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-rappi-orange/30"
                  />
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden w-20">
                    <input
                      type="number"
                      value={camp.percentage || ''}
                      onChange={(e) => updateMarketingCampaign(camp.id, { percentage: Number(e.target.value) })}
                      placeholder="0"
                      min={0}
                      max={50}
                      className="w-10 px-2 py-1.5 text-xs text-right focus:outline-none tabular-nums"
                    />
                    <span className="text-xs text-gray-400 pr-1.5">%</span>
                  </div>
                  <button
                    onClick={() => removeMarketingCampaign(camp.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── E) TABLA P&L ── */}
      {result ? (
        <>
          <div className="card p-3 overflow-hidden">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              P&L comparativo — Sin Rappi vs Con Rappi
            </h2>
            <div className="overflow-x-auto -mx-3 px-3">
              <table className="w-full min-w-[340px]">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left text-[10px] text-gray-400 uppercase tracking-wide py-1.5 pl-2">Concepto</th>
                    <th className="text-right text-[10px] text-gray-400 uppercase tracking-wide py-1.5 pr-2">Sin Rappi</th>
                    <th className="text-right text-[10px] text-gray-400 uppercase tracking-wide py-1.5 pr-2">Con Rappi</th>
                    <th className="text-right text-[10px] text-gray-400 uppercase tracking-wide py-1.5 pr-2">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <PLTableRow key={i} row={row} country={zoneCountry} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-3 gap-2">
            <div className={[
              'rounded-xl p-3 text-center',
              result.badge === 'positive' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200',
            ].join(' ')}>
              <p className="text-[10px] text-gray-500 mb-0.5">Utilidad adicional/mes</p>
              <p className={[
                'text-sm font-black',
                result.badge === 'positive' ? 'text-green-700' : 'text-red-600',
              ].join(' ')}>
                {fmtCOP(result.additionalProfit, zoneCountry)}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-500 mb-0.5">ROI del canal</p>
              <p className="text-sm font-black text-blue-700">
                {result.roi > 0 ? `${Math.round(result.roi)}%` : '—'}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-500 mb-0.5">Pedidos Rappi/día</p>
              <p className="text-sm font-black text-gray-800">
                ~{rappiDiario}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="card p-4 text-center text-sm text-gray-400">
          Ingresa nombre, ticket y pedidos/día para ver el P&L
        </div>
      )}

      <StepNav
        onBack={onBack}
        onNext={canContinue ? onNext : undefined}
        nextLabel="Continuar → Proyección 12 meses"
        nextDisabled={!canContinue}
      />
    </div>
  )
}
