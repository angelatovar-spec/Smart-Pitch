import { usePitchStore } from '../store/usePitchStore'
import { ZoneSelector } from '../components/zona/ZoneSelector'
import { MarketOpportunity } from '../components/zona/MarketOpportunity'
import { StepNav } from '../components/shared/StepNav'
import { DayPeakChart } from '../components/zona/DayPeakChart'
import { formatLocalCurrency, formatPct, formatNumber, translateDay } from '../utils/formatters'
import { useCurrencyConverter } from '../hooks/useCurrencyConverter'

const RAPPI_COUNTRIES = [
  'Colombia', 'México', 'Argentina', 'Chile',
  'Perú', 'Ecuador', 'Uruguay', 'Costa Rica',
]


interface Props {
  onNext: () => void
  onBack: () => void
}

// ── Metric card compacta ──────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sublabel,
  highlight,
}: {
  label: string
  value: string
  sublabel?: string
  highlight?: boolean
}) {
  return (
    <div className={[
      'rounded-xl p-3 flex flex-col gap-0.5',
      highlight
        ? 'bg-rappi-orange/8 border border-rappi-orange/20'
        : 'bg-gray-50 border border-gray-100',
    ].join(' ')}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 leading-none">
        {label}
      </p>
      <p className={[
        'text-lg font-bold leading-tight tabular-nums',
        highlight ? 'text-rappi-orange' : 'text-gray-900',
      ].join(' ')}>
        {value}
      </p>
      {sublabel && (
        <p className="text-[10px] text-gray-400 leading-none">{sublabel}</p>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ZonePage({ onNext, onBack }: Props) {
  const {
    zoneData, categoryData, selectedCategory,
    zoneCountry, setZoneCountry,
  } = usePitchStore()
  const canContinue = !!zoneData && !!categoryData
  const { rate } = useCurrencyConverter()

  const allCategories = zoneData?.categories ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
      <div>
        <h1 className="text-xl font-black text-gray-900">Zona & Mercado</h1>
        <p className="text-sm text-gray-500 mt-0.5">Selecciona la zona y categoría del restaurante</p>
      </div>

      {/* ── Selector de país ── */}
      <div className="card p-3 space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ubicación</h2>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">País</label>
          <div className="relative">
            <select
              value={zoneCountry}
              onChange={(e) => setZoneCountry(e.target.value)}
              className="input-field appearance-none pr-9"
            >
              {RAPPI_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Selector zona + categoría */}
      <ZoneSelector />

      {/* ── Métricas ── */}
      {zoneData && (
        <div className="card p-3 space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Métricas de la zona
          </h2>

          {/* Usuarios + Prime + RTs */}
          <div className="grid grid-cols-3 gap-2">
            <MetricCard
              label="Usuarios activos"
              value={formatNumber(zoneData.totalUsers)}
            />
            <MetricCard
              label="Prime"
              value={formatNumber(zoneData.primeUsers)}
              sublabel={`${formatPct(zoneData.primeRate)} del total`}
              highlight
            />
            <MetricCard
              label="RTs en zona"
              value={categoryData ? String(categoryData.availableRTs) : '—'}
            />
          </div>

          {/* Hero GMV — ocupa todo el ancho, dato más prominente */}
          {categoryData && (
            <div className="rounded-xl p-4 bg-rappi-orange/8 border border-rappi-orange/20">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                GMV de la categoría · últimas 4 semanas
              </p>
              <p className="text-3xl font-black text-rappi-orange tabular-nums leading-none">
                {formatLocalCurrency(categoryData.gmvLast4Week * rate, zoneCountry)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {categoryData.category} · {zoneData.opsZone}
              </p>
            </div>
          )}

          {/* Ticket · Día pico · Conectividad */}
          {categoryData && (
            <div className="grid grid-cols-3 gap-2">
              <MetricCard
                label="Ticket prom."
                value={formatLocalCurrency(categoryData.avgTicket * rate, zoneCountry)}
              />
              <MetricCard
                label="Día pico"
                value={translateDay(categoryData.peakDay).charAt(0).toUpperCase() + translateDay(categoryData.peakDay).slice(1)}
                sublabel={`${categoryData.peakDayOrders.toLocaleString('es-CO')} órd.`}
              />
              <MetricCard
                label="Conectividad"
                value={`${categoryData.avgConnectivityHrs.toFixed(1).replace('.', ',')} hrs`}
                sublabel="promedio/semana"
              />
            </div>
          )}
        </div>
      )}

      {zoneData && (
        <>
          {/* Oportunidad de mercado */}
          <MarketOpportunity />

          {/* Tabla de categorías de la zona */}
          <div className="card p-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Categorías en {zoneData.opsZone}
            </h2>
            <div className="overflow-y-auto max-h-[200px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-gray-400 font-medium py-1 pr-2">Categoría</th>
                    <th className="text-right text-gray-400 font-medium py-1 pr-2">Órd/4sem</th>
                    <th className="text-right text-gray-400 font-medium py-1 pr-2">Ticket</th>
                    <th className="text-right text-gray-400 font-medium py-1">Pico</th>
                  </tr>
                </thead>
                <tbody>
                  {[...allCategories].sort((a, b) => b.ordersLast4Week - a.ordersLast4Week).map((cat) => {
                    const maxOrders = Math.max(...allCategories.map((c) => c.ordersLast4Week))
                    const dotSize = Math.max(6, Math.round((cat.ordersLast4Week / maxOrders) * 14))
                    const isSelected = cat.category === selectedCategory
                    return (
                      <tr key={cat.category} className={isSelected ? 'bg-orange-50' : ''}>
                        <td className="py-1.5 pr-2 text-gray-700 font-medium flex items-center gap-1.5">
                          <span
                            className="inline-block rounded-full bg-rappi-orange flex-shrink-0"
                            style={{ width: dotSize, height: dotSize, opacity: 0.4 + (cat.ordersLast4Week / maxOrders) * 0.6 }}
                          />
                          {cat.category}
                          {isSelected && <span className="text-[9px] text-rappi-orange font-semibold">●</span>}
                        </td>
                        <td className="py-1.5 pr-2 text-right text-gray-600 tabular-nums">
                          {formatNumber(cat.ordersLast4Week)}
                        </td>
                        <td className="py-1.5 pr-2 text-right text-gray-600 tabular-nums">
                          {formatLocalCurrency(cat.avgTicket * rate, zoneCountry)}
                        </td>
                        <td className="py-1.5 text-right text-gray-500 capitalize">
                          {cat.peakDay.slice(0, 3)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {categoryData && <DayPeakChart />}

      <StepNav
        onBack={onBack}
        onNext={canContinue ? onNext : undefined}
        nextLabel="Continuar → Datos del restaurante"
        nextDisabled={!canContinue}
      />
    </div>
  )
}
