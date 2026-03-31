interface Props {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  backLabel?: string
  nextDisabled?: boolean
  loading?: boolean
}

export function StepNav({
  onBack,
  onNext,
  nextLabel = 'Continuar',
  backLabel = 'Atrás',
  nextDisabled = false,
  loading = false,
}: Props) {
  return (
    <div className="flex gap-3 mt-6">
      {onBack && (
        <button onClick={onBack} className="btn-secondary flex-1 md:flex-none">
          {backLabel}
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled || loading}
          className="btn-primary flex-1"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Procesando...
            </span>
          ) : (
            nextLabel
          )}
        </button>
      )}
    </div>
  )
}
