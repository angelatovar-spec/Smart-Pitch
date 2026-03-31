import { useDataContext } from '../../data/dataContext'
import { formatDate } from '../../utils/formatters'

interface Props {
  step: number
  totalSteps: number
}

export function Header({ step, totalSteps }: Props) {
  const { updatedAt } = useDataContext()

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-rappi-orange rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">R</span>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800 leading-tight">Smart Pitch</p>
            <p className="text-[10px] text-gray-400 leading-tight">Rappi Colombia</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-[10px] text-gray-400 hidden sm:block">
              Datos: {formatDate(updatedAt)}
            </span>
          )}
          <span className="text-xs text-gray-500">
            Paso {step} de {totalSteps}
          </span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="h-0.5 bg-gray-100">
        <div
          className="h-full bg-rappi-orange transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>
    </header>
  )
}
