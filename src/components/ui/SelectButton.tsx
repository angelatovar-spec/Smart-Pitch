// ─────────────────────────────────────────────────────────────────────────────
// SelectButton.tsx
// Botón de selección visual reutilizable — activo/inactivo estilo Rappi.
// ─────────────────────────────────────────────────────────────────────────────

interface SelectButtonProps {
  label: string
  sublabel?: string
  icon?: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
}

export function SelectButton({
  label,
  sublabel,
  icon,
  selected,
  onClick,
  disabled = false,
}: SelectButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'w-full text-left rounded-xl border-[1.5px] px-4 py-3.5 transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        selected
          ? 'border-[#FF441B] bg-[#FFF5F3] focus:ring-[#FF441B]/30'
          : 'border-[#D1D5DB] bg-white hover:border-[#9CA3AF] hover:bg-[#F9FAFB] focus:ring-gray-200',
      ].join(' ')}
    >
      <span className="flex items-center gap-2">
        {icon && (
          <span className="text-base leading-none select-none">{icon}</span>
        )}
        <span
          className={[
            'text-sm leading-snug',
            selected ? 'text-[#FF441B] font-semibold' : 'text-[#374151] font-medium',
          ].join(' ')}
        >
          {label}
        </span>
      </span>

      {sublabel && (
        <span
          className={[
            'block text-xs mt-0.5 leading-snug pl-[calc(1rem+0.5rem)]',
            selected ? 'text-[#FF441B]/70' : 'text-[#9CA3AF]',
          ].join(' ')}
          style={{ paddingLeft: icon ? '1.75rem' : '0' }}
        >
          {sublabel}
        </span>
      )}
    </button>
  )
}
