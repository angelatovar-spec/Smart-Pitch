import { usePitchStore } from '../../store/usePitchStore'

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="kpi-card">
      <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export function ZoneMetrics() {
  const zoneData = usePitchStore((s) => s.zoneData)
  if (!zoneData) return null

  const primeRatePct = (zoneData.primeRate * 100).toFixed(1)

  return (
    <div className="card">
      <h2 className="section-title">Métricas de la zona</h2>
      <div className="grid grid-cols-2 gap-3">
        <KPI
          label="Usuarios totales"
          value={zoneData.totalUsers.toLocaleString('es-CO')}
          sub="en la zona operativa"
        />
        <KPI
          label="Usuarios Prime"
          value={zoneData.primeUsers.toLocaleString('es-CO')}
          sub={`${primeRatePct}% del total`}
        />
      </div>
    </div>
  )
}
