import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { usePitchStore } from '../../store/usePitchStore'
import { useDataContext } from '../../data/dataContext'
import { formatLocalCurrency } from '../../utils/formatters'
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter'

const DAY_ORDER = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

export function DayPeakChart() {
  const zoneData     = usePitchStore((s) => s.zoneData)
  const categoryData = usePitchStore((s) => s.categoryData)
  const zoneCountry  = usePitchStore((s) => s.zoneCountry)
  const { getDayData } = useDataContext()
  const { rate }     = useCurrencyConverter()

  if (!zoneData || !categoryData) return null

  const dayEntries = getDayData(zoneData.country, zoneData.opsZoneId, categoryData.category)

  if (!dayEntries || dayEntries.length === 0) {
    return (
      <div className="card">
        <h2 className="section-title">Distribución por día</h2>
        <p className="text-xs text-gray-400">Sin datos por día disponibles</p>
      </div>
    )
  }

  const maxOrdenes = Math.max(...dayEntries.map((d) => d.ordenes))
  const peakEntry  = dayEntries.find((d) => d.ordenes === maxOrdenes)!

  const chartData = DAY_ORDER.map((dia) => {
    const entry = dayEntries.find((d) => d.dia === dia)
    return {
      day:    dia,
      orders: entry ? Math.round(entry.ordenes) : 0,
      gmv:    entry ? entry.gmv : 0,
      isPeak: entry ? entry.ordenes === maxOrdenes : false,
    }
  })

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-1">
        <h2 className="section-title">Distribución por día</h2>
        <span className="text-xs font-semibold text-[#FF441B]">
          Pico: {peakEntry.dia}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Promedio de órdenes por día según zona y categoría
      </p>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} barSize={28}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '8px 12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  fontSize: 12,
                }}>
                  <p style={{ fontWeight: 600, marginBottom: 2 }}>{d.day}</p>
                  <p>Órdenes: {d.orders.toLocaleString('es-CO')}</p>
                  <p>GMV prom: {formatLocalCurrency(d.gmv * rate, zoneCountry)}</p>
                </div>
              )
            }}
          />
          <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.isPeak ? '#FF441B' : '#FFCBB8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
