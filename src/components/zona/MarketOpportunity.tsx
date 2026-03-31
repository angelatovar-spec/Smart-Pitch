import { usePitchStore } from '../../store/usePitchStore'
import { formatLocalCurrencyCompact } from '../../utils/formatters'
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter'

export function MarketOpportunity() {
  const zoneData     = usePitchStore((s) => s.zoneData)
  const categoryData = usePitchStore((s) => s.categoryData)
  const zoneCountry  = usePitchStore((s) => s.zoneCountry)
  const { rate }     = useCurrencyConverter()

  if (!zoneData || !categoryData) return null

  const ordPerDay    = Math.round(categoryData.avgOrdStorePerDay * 10) / 10
  const totalOrders  = categoryData.ordersLast4Week
  const ordK         = totalOrders >= 1000
    ? `${(totalOrders / 1000).toFixed(0)}K`
    : String(totalOrders)

  return (
    <div className="rounded-2xl p-4 text-white" style={{ background: '#FF441B' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-0.5">
        Potencial en {zoneData.opsZone}
      </p>
      <p className="text-sm font-semibold opacity-90 mb-4">
        Alcance de una tienda de {categoryData.category} en esta zona
      </p>

      {/* Benchmarks de tienda — datos distintos a las cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/15 rounded-xl p-2.5 text-center">
          <p className="text-[9px] uppercase tracking-wide opacity-60 leading-none mb-1">
            GMV / tienda
          </p>
          <p className="text-xl font-black leading-none tabular-nums">
            {formatLocalCurrencyCompact(categoryData.avgGmvStore * rate, zoneCountry)}
          </p>
          <p className="text-[9px] opacity-60 mt-0.5">en 4 semanas</p>
        </div>

        <div className="bg-white/15 rounded-xl p-2.5 text-center">
          <p className="text-[9px] uppercase tracking-wide opacity-60 leading-none mb-1">
            Pedidos / día
          </p>
          <p className="text-xl font-black leading-none tabular-nums">
            {ordPerDay.toFixed(1).replace('.', ',')}
          </p>
          <p className="text-[9px] opacity-60 mt-0.5">por tienda</p>
        </div>

        <div className="bg-white/15 rounded-xl p-2.5 text-center">
          <p className="text-[9px] uppercase tracking-wide opacity-60 leading-none mb-1">
            Mercado
          </p>
          <p className="text-xl font-black leading-none tabular-nums">{ordK}</p>
          <p className="text-[9px] opacity-60 mt-0.5">órd. / 4 sem</p>
        </div>
      </div>

      {/* Argumento de cierre */}
      <div className="bg-white/10 rounded-xl px-3 py-2 flex items-start gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80 shrink-0 mt-1" />
        <p className="text-xs opacity-90 leading-snug">
          <span className="font-bold">{categoryData.availableRTs} marcas</span> activas
          en la categoría ·{' '}
          <span className="font-bold">
            {zoneData.primeUsers.toLocaleString('es-CO')} usuarios Prime
          </span>{' '}
          con ticket mayor y mayor frecuencia de compra
        </p>
      </div>
    </div>
  )
}
