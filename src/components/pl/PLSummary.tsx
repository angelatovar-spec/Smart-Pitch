import { usePitchStore } from '../../store/usePitchStore'
import { formatLocalCurrencyCompact } from '../../utils/formatters'

export function PLSummary() {
  const result      = usePitchStore((s) => s.pl.result)
  const zoneCountry = usePitchStore((s) => s.zoneCountry)
  if (!result) return null

  const fmt = (v: number) => formatLocalCurrencyCompact(v, zoneCountry)

  const isPositive = result.badge === 'positive'

  return (
    <div className={[
      'rounded-2xl p-4 flex flex-col gap-3',
      isPositive ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100',
    ].join(' ')}>
      {/* Badge */}
      <div className={[
        'self-start px-3 py-1 rounded-full text-sm font-semibold',
        isPositive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
      ].join(' ')}>
        {isPositive ? 'Positivo para el negocio' : 'Revisar estructura'}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500">Utilidad adicional / mes</p>
          <p className={[
            'text-2xl font-black',
            isPositive ? 'text-green-600' : 'text-yellow-600',
          ].join(' ')}>
            {fmt(result.additionalProfit)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Ventas adicionales / mes</p>
          <p className="text-2xl font-black text-gray-800">
            {fmt(result.additionalSales)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Comisión pagada</p>
          <p className="text-lg font-bold text-gray-700">
            {fmt(result.commissionPaid)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">ROI sobre comisión</p>
          <p className={[
            'text-lg font-bold',
            result.roi >= 0 ? 'text-green-600' : 'text-red-500',
          ].join(' ')}>
            {result.roi.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  )
}
