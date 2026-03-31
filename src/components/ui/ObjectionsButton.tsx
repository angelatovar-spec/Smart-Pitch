interface Props {
  onClick: () => void
}

export function ObjectionsButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Abrir manejo de objeciones"
      className={[
        'fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50',
        'w-13 h-13 w-[52px] h-[52px] rounded-full shadow-lg',
        'bg-[#FF441B] text-white',
        'flex items-center justify-center',
        'active:scale-95 transition-transform duration-150',
        'hover:bg-orange-600',
      ].join(' ')}
    >
      {/* Ícono escudo / respuesta */}
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    </button>
  )
}
