import { useEffect } from 'react'
import { usePitchStore } from '../store/usePitchStore'
import { ProjectionChart } from '../components/proyeccion/ProjectionChart'
import { ProjectionMetrics } from '../components/proyeccion/ProjectionMetrics'
import { BreakevenCard } from '../components/proyeccion/BreakevenCard'
import { Slider } from '../components/shared/Slider'
import { StepNav } from '../components/shared/StepNav'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function ProjectionPage({ onNext, onBack }: Props) {
  const { projection, setProjectionParam, recalculateProjection, brand } = usePitchStore()

  // Calcular proyección al entrar a la página
  useEffect(() => {
    if (brand.monthlyRevenue > 0) recalculateProjection()
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-900">Proyección 12 meses</h1>
        <p className="text-sm text-gray-500 mt-0.5">Estimado de ventas Rappi mes a mes</p>
      </div>

      {/* Sliders de proyección */}
      <div className="card space-y-5">
        <h2 className="section-title">Parámetros de ramp-up</h2>

        <Slider
          label="Arranque mes 1 (% del potencial)"
          value={projection.rampUpPct}
          min={10}
          max={80}
          onChange={(v) => setProjectionParam('rampUpPct', v)}
          hint="Velocidad de arranque"
        />

        <Slider
          label="Meses hasta madurez"
          value={projection.rampUpMonths}
          min={1}
          max={6}
          unit=" meses"
          onChange={(v) => setProjectionParam('rampUpMonths', v)}
        />

        <Slider
          label="Crecimiento mensual estable"
          value={projection.monthlyGrowth}
          min={0}
          max={10}
          step={0.5}
          onChange={(v) => setProjectionParam('monthlyGrowth', v)}
          hint="Post-madurez"
        />
      </div>

      {projection.data ? (
        <>
          <ProjectionChart />
          <ProjectionMetrics />
          <BreakevenCard />
        </>
      ) : (
        <div className="card text-center py-8 text-sm text-gray-400">
          Completa los pasos anteriores para ver la proyección
        </div>
      )}

      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextLabel="Continuar → Generar Pitch"
      />
    </div>
  )
}
