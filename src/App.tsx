import { useState } from 'react'
import { DataContextProvider, useDataContext } from './data/dataContext'
import { Header } from './components/shared/Header'
import { ZonePage } from './pages/ZonePage'
import { PLPage } from './pages/PLPage'
import { ProjectionPage } from './pages/ProjectionPage'
import { PitchPage } from './pages/PitchPage'
import { ObjectionsButton } from './components/ui/ObjectionsButton'
import { ObjectionsDrawer } from './components/ui/ObjectionsDrawer'
import { usePitchStore } from './store/usePitchStore'

type Step = 1 | 2 | 3 | 4

const TOTAL_STEPS = 4

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-rappi-orange border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 font-medium">Cargando datos de zonas...</p>
    </div>
  )
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-1">No se pudieron cargar los datos</p>
        <p className="text-xs text-gray-500 max-w-xs">{message}</p>
      </div>
      <button onClick={onRetry} className="btn-primary">Reintentar</button>
    </div>
  )
}

function AppContent() {
  const [step, setStep] = useState<Step>(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { loadState, error, retry } = useDataContext()

  if (loadState === 'loading' || loadState === 'idle') return <LoadingScreen />
  if (loadState === 'error') return <ErrorScreen message={error ?? ''} onRetry={retry} />

  function handleRestart() {
    usePitchStore.getState().resetPitch()
    setStep(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header step={step} totalSteps={TOTAL_STEPS} />

      <main className="pb-24">
        {step === 1 && (
          <ZonePage onNext={() => setStep(2)} onBack={() => setStep(1)} />
        )}
        {step === 2 && (
          <PLPage onNext={() => setStep(3)} onBack={() => setStep(1)} />
        )}
        {step === 3 && (
          <ProjectionPage onNext={() => setStep(4)} onBack={() => setStep(2)} />
        )}
        {step === 4 && (
          <PitchPage onBack={() => setStep(3)} onRestart={handleRestart} />
        )}
      </main>

      {/* Botón flotante de objeciones — visible en todos los pasos */}
      <ObjectionsButton onClick={() => setDrawerOpen(true)} />

      {/* Drawer de objeciones */}
      <ObjectionsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

export default function App() {
  return (
    <DataContextProvider>
      <AppContent />
    </DataContextProvider>
  )
}
