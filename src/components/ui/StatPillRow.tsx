// ─────────────────────────────────────────────────────────────────────────────
// StatPillRow.tsx
// Fila horizontal de pills compactas (40px aprox). En mobile: grid 2×2.
// ─────────────────────────────────────────────────────────────────────────────

interface Pill {
  icon: string
  label: string
  value: string
  highlight?: boolean
}

interface Props {
  pills: Pill[]
}

export function StatPillRow({ pills }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {pills.map((p) => (
        <div
          key={p.label}
          className={[
            'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm',
            p.highlight
              ? 'bg-orange-50 border-orange-200'
              : 'bg-white border-gray-100',
          ].join(' ')}
        >
          <span className="text-base leading-none">{p.icon}</span>
          <div className="min-w-0">
            <p className={[
              'font-bold leading-tight truncate',
              p.highlight ? 'text-rappi-orange' : 'text-gray-900',
            ].join(' ')}>
              {p.value}
            </p>
            <p className="text-[10px] text-gray-400 leading-tight truncate">{p.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
