// ─────────────────────────────────────────────────────────────────────────────
// SparkBarChart.tsx
// Barras horizontales compactas (tipo spark). Altura total: max 160px.
// Usa Recharts layout="vertical" con barSize={14}.
// ─────────────────────────────────────────────────────────────────────────────

import {
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'

interface DataPoint {
  label: string
  value: number
  isPeak?: boolean
}

interface Props {
  data: DataPoint[]
  valueLabel?: string
  color?: string
  peakColor?: string
}

export function SparkBarChart({
  data,
  valueLabel = 'Órdenes',
  color = '#FFD4CC',
  peakColor = '#FF441B',
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={Math.min(data.length * 28 + 10, 200)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 48, bottom: 0, left: 0 }}
        barSize={14}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={36}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number) => [v.toLocaleString('es-CO'), valueLabel]}
          contentStyle={{
            borderRadius: 10,
            border: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} label={<ValueLabel />}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.isPeak ? peakColor : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function ValueLabel(props: any) {
  const { x, y, width, height, value } = props
  if (!value) return null
  return (
    <text
      x={x + width + 4}
      y={y + height / 2}
      dominantBaseline="middle"
      fontSize={10}
      fill="#9ca3af"
    >
      {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
    </text>
  )
}
