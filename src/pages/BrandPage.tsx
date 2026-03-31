import { usePitchStore } from '../store/usePitchStore'
import { BrandForm } from '../components/marca/BrandForm'
import { CostSliders } from '../components/marca/CostSliders'
import { StepNav } from '../components/shared/StepNav'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function BrandPage({ onNext, onBack }: Props) {
  const brand = usePitchStore((s) => s.brand)
  const canContinue = !!brand.name && brand.monthlyRevenue > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-900">Datos del restaurante</h1>
        <p className="text-sm text-gray-500 mt-0.5">Información básica y estructura de costos</p>
      </div>

      <BrandForm />
      <CostSliders />

      <StepNav
        onBack={onBack}
        onNext={canContinue ? onNext : undefined}
        nextLabel="Continuar → Modelo P&L"
        nextDisabled={!canContinue}
      />
    </div>
  )
}
