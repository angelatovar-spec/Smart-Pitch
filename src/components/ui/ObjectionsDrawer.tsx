import { useEffect, useState } from 'react'
import { usePitchStore } from '../../store/usePitchStore'
import { getObjectionsForCategory, type StaticObjection } from '../../data/staticObjections'

interface Props {
  isOpen: boolean
  onClose: () => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback silencioso
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[10px] text-gray-400 hover:text-rappi-orange transition-colors flex items-center gap-1 mt-1.5"
    >
      {copied ? (
        <><span className="text-green-500">✓</span> Copiado</>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Copiar respuesta
        </>
      )}
    </button>
  )
}

function ObjectionCard({ obj, aiGenerated }: { obj: StaticObjection; aiGenerated?: boolean }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-xs font-semibold text-gray-800 mb-1.5 leading-snug">
        "{obj.objection}"
      </p>
      <p className="text-xs text-gray-600 leading-relaxed">{obj.response}</p>
      <CopyButton text={obj.response} />
      {aiGenerated && (
        <span className="inline-block mt-1 text-[9px] bg-purple-50 text-purple-500 px-1.5 py-0.5 rounded-full font-medium">
          IA
        </span>
      )}
    </div>
  )
}

export function ObjectionsDrawer({ isOpen, onClose }: Props) {
  const { pitch, zoneData, categoryData, brand } = usePitchStore()
  const hasAIObjections = pitch.objections.length > 0

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const category = categoryData?.category ?? ''
  const staticObjections = getObjectionsForCategory(category, zoneData ?? undefined)

  // Convertir objeciones de IA al mismo tipo
  const aiObjections: StaticObjection[] = pitch.objections.map((o, i) => ({
    id: `ai_${i}`,
    objection: o.objection,
    response: o.response,
  }))

  const objectionsToShow = hasAIObjections ? aiObjections : staticObjections

  if (!isOpen) return null

  return (
    <>
      {/* Overlay — cierra el drawer al hacer click */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={[
          'fixed top-0 right-0 bottom-0 z-50',
          'w-full md:w-96',
          'bg-white shadow-2xl',
          'flex flex-col',
          'transition-transform duration-250',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Manejo de objeciones"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Manejo de objeciones</h2>
            {category && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                {category}{zoneData ? ` · ${zoneData.opsZone}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 -mr-1 -mt-1"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Badge personalizado / genérico */}
        <div className="px-4 py-2 shrink-0">
          {hasAIObjections ? (
            <div className="bg-purple-50 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-purple-500 text-xs">✓</span>
              <p className="text-[10px] text-purple-700 font-medium">
                Objeciones personalizadas para {brand.name || 'este restaurante'}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg px-3 py-1.5">
              <p className="text-[10px] text-gray-500">
                Objeciones generales{category ? ` · ${category}` : ''} — genera el pitch para objeciones personalizadas
              </p>
            </div>
          )}
        </div>

        {/* Info-box de tasa de cancelación */}
        {zoneData && categoryData && (
          <div className="mx-4 mb-3 shrink-0 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-100">
            <span className="text-sm leading-none mt-0.5">ℹ️</span>
            <div className="text-[11px] text-blue-700 leading-snug">
              <p className="font-semibold mb-0.5">
                Tasa de cancelación en {zoneData.opsZone}
              </p>
              <p>{(categoryData.cancellationRate * 100).toFixed(1)}%</p>
              <p className="text-blue-500 mt-0.5">
                Referencia marcas exitosas: ~{(categoryData.cancellationRate * 100 * 0.6).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Lista de objeciones con scroll */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {objectionsToShow.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">
              Selecciona una zona y categoría para ver objeciones
            </p>
          ) : (
            objectionsToShow.map((obj) => (
              <ObjectionCard
                key={obj.id}
                obj={obj}
                aiGenerated={hasAIObjections}
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}
