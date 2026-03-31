import { usePitchStore } from '../../store/usePitchStore'
import { Slider } from '../shared/Slider'

const COST_ITEMS = [
  { key: 'rawMaterial', label: 'Materia prima', default: 35 },
  { key: 'payroll', label: 'Nómina', default: 22 },
  { key: 'rent', label: 'Arriendo', default: 10 },
  { key: 'services', label: 'Servicios', default: 4 },
  { key: 'others', label: 'Otros', default: 5 },
] as const

export function CostSliders() {
  const { brand, setBrandCosts } = usePitchStore()

  const total =
    brand.costs.rawMaterial +
    brand.costs.payroll +
    brand.costs.rent +
    brand.costs.services +
    brand.costs.others

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="section-title mb-0">Estructura de costos</h2>
        <div className={[
          'text-sm font-bold px-3 py-1 rounded-full',
          total > 85 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700',
        ].join(' ')}>
          {total.toFixed(0)}% total
        </div>
      </div>

      {COST_ITEMS.map(({ key, label }) => (
        <Slider
          key={key}
          label={label}
          value={brand.costs[key]}
          min={0}
          max={60}
          onChange={(v) => setBrandCosts({ [key]: v })}
        />
      ))}

      {total > 85 && (
        <p className="text-xs text-red-500 text-center">
          Los costos superan el 85% — revisa la estructura antes de continuar
        </p>
      )}
    </div>
  )
}
