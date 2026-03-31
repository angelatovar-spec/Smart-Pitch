import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { usePitchStore } from '../../store/usePitchStore'
import { formatLocalCurrencyCompact, formatLocalCurrency } from '../../utils/formatters'

export function ProjectionChart() {
  const data        = usePitchStore((s) => s.projection.data)
  const zoneCountry = usePitchStore((s) => s.zoneCountry)
  if (!data) return null

  return (
    <div className="card">
      <h2 className="section-title">Proyección ventas Rappi · 12 meses</h2>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={20} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="month"
            tickFormatter={(v) => `M${v}`}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatLocalCurrencyCompact(v, zoneCountry)}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            formatter={(v: number) => [formatLocalCurrency(v, zoneCountry), 'Ventas Rappi']}
            labelFormatter={(l) => `Mes ${l}`}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === data.length - 1 ? '#FF441F' : '#FFD4CC'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
