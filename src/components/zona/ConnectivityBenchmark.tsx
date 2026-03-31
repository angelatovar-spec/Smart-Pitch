import { usePitchStore } from '../../store/usePitchStore'

export function ConnectivityBenchmark() {
  const categoryData = usePitchStore((s) => s.categoryData)
  if (!categoryData) return null

  const hrs = categoryData.avgConnectivityHrs
  const pct = Math.min((hrs / 16) * 100, 100) // max 16 hrs referencia

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Benchmark de conectividad
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        Las marcas exitosas de {categoryData.category} se conectan en promedio:
      </p>

      <div className="flex items-end gap-3">
        <p className="text-4xl font-black text-rappi-orange">{hrs}</p>
        <p className="text-lg font-semibold text-gray-600 mb-1">hrs / día</p>
      </div>

      <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-rappi-orange rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1 text-right">{pct.toFixed(0)}% del día operativo</p>
    </div>
  )
}
