import { usePitchStore } from '../../store/usePitchStore'
import type { PLRow } from '../../services/plCalculator'
import { formatLocalCurrencyCompact } from '../../utils/formatters'

function diffColor(v: number | null): string {
  if (v === null) return 'text-gray-400'
  if (v > 0) return 'text-green-600'
  if (v < 0) return 'text-red-500'
  return 'text-gray-400'
}

function Row({ row, country }: { row: PLRow; country: string }) {
  function fmtSigned(v: number | null): string {
    if (v === null) return '—'
    const abs  = Math.abs(v)
    const sign = v < 0 ? '-' : v > 0 ? '+' : ''
    return sign + formatLocalCurrencyCompact(abs, country)
  }
  return (
    <tr className={[
      'border-b border-gray-50',
      row.isTotal ? 'bg-gray-50 font-bold' : 'hover:bg-gray-50/50',
    ].join(' ')}>
      <td className={[
        'py-2.5 text-sm',
        row.indented ? 'pl-6 text-gray-500' : 'pl-3 text-gray-800',
        row.isTotal ? 'font-bold text-gray-900' : '',
      ].join(' ')}>
        {row.label}
      </td>
      <td className="py-2.5 text-right text-sm text-gray-700 pr-2 tabular-nums">
        {fmtSigned(row.withoutRappi)}
      </td>
      <td className="py-2.5 text-right text-sm text-gray-700 pr-2 tabular-nums">
        {fmtSigned(row.withRappi)}
      </td>
      <td className={[
        'py-2.5 text-right text-sm pr-3 tabular-nums font-medium',
        diffColor(row.diff),
      ].join(' ')}>
        {row.diff === 0 ? '=' : fmtSigned(row.diff)}
      </td>
    </tr>
  )
}

export function PLTable() {
  const result      = usePitchStore((s) => s.pl.result)
  const zoneCountry = usePitchStore((s) => s.zoneCountry)
  if (!result) return null

  return (
    <div className="card overflow-hidden">
      <h2 className="section-title">P&L comparativo</h2>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full min-w-[360px]">
          <thead>
            <tr className="border-b-2 border-gray-100">
              <th className="text-left text-xs text-gray-400 uppercase tracking-wide py-2 pl-3">Concepto</th>
              <th className="text-right text-xs text-gray-400 uppercase tracking-wide py-2 pr-2">Sin Rappi</th>
              <th className="text-right text-xs text-gray-400 uppercase tracking-wide py-2 pr-2">Con Rappi</th>
              <th className="text-right text-xs text-gray-400 uppercase tracking-wide py-2 pr-3">Δ</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <Row key={i} row={row} country={zoneCountry} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
