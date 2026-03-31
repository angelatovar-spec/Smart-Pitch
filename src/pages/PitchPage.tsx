// ─────────────────────────────────────────────────────────────────────────────
// PitchPage.tsx
// Paso final: condiciones pactadas + botón PDF.
// Sin generación de pitch de texto — el PDF se genera directamente.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { ExecutiveModal } from '../components/pitch/ExecutiveModal'
import { ProposalConfig } from '../components/pitch/ProposalConfig'
import { StepNav } from '../components/shared/StepNav'
import { usePitchStore, DEFAULT_CONDITIONS } from '../store/usePitchStore'
import { generateProposalPDF } from '../services/pdfGenerator'
import type { ExecutiveProfile } from '../services/pdfGenerator'
import { generateWhyRappiArguments, generateObjections } from '../services/anthropicService'
import type { WhyRappiContent } from '../services/anthropicService'
import { formatLocalCurrency, formatNumber } from '../utils/formatters'

interface Props {
  onBack: () => void
  onRestart: () => void
}

// ── Stat pill compacto ────────────────────────────────────────────────────────

function Pill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl text-center min-w-0 ${
      highlight
        ? 'bg-rappi-orange/10 border border-rappi-orange/20'
        : 'bg-gray-50 border border-gray-100'
    }`}>
      <span className="text-[10px] text-gray-400 leading-none mb-0.5 whitespace-nowrap">{label}</span>
      <span className={`text-xs font-bold leading-snug ${highlight ? 'text-rappi-orange' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function PitchPage({ onBack, onRestart }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)

  const { brand, zoneData, categoryData, pl, pitch, zoneCountry, setAdditionalBenefits, setObjections, setProposalConfig } =
    usePitchStore()

  // Restaurar DEFAULT_CONDITIONS si el campo está vacío
  useEffect(() => {
    if (!pitch.additionalBenefits?.trim()) {
      setAdditionalBenefits(DEFAULT_CONDITIONS)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const rappiDailyOrders =
    Math.round(pl.aliado.dailyOrders * (pl.incrementalityPct / 100) * 10) / 10

  // ── Generar PDF ─────────────────────────────────────────────────────────────

  async function handlePDFGenerate(executive: ExecutiveProfile) {
    if (!zoneData || !categoryData || !pl.result) return

    setPdfGenerating(true)
    try {
      // Paso 1: argumentos IA para sección "¿Por qué ser aliados?"
      let whyRappiContent: WhyRappiContent = {
        intro:
          `Hoy, unirse a Rappi representa para ${brand.name || 'tu restaurante'} una oportunidad concreta ` +
          `de llegar a los ${formatNumber(zoneData.primeUsers)} usuarios Prime de ${zoneData.opsZone}, ` +
          `quienes tienen mayor ticket promedio y frecuencia de compra.`,
        bullets: [
          `Acceso a ${formatNumber(zoneData.primeUsers)} usuarios Prime en ${zoneData.opsZone}`,
          `${formatNumber(categoryData.ordersLast4Week)} órdenes en 4 semanas · categoría ${categoryData.category}`,
          `Utilidad adicional estimada: ${formatLocalCurrency(pl.result.additionalProfit, zoneCountry)}/mes`,
        ],
      }
      try {
        whyRappiContent = await generateWhyRappiArguments({
          zone: zoneData,
          category: categoryData,
          restaurantName: brand.name || 'Restaurante',
          plResult: pl.result,
          dailyOrders: pl.aliado.dailyOrders,
          rappiDailyOrders,
          incrementalityPct: pl.incrementalityPct,
          additionalBenefits: pitch.additionalBenefits || undefined,
          zoneCountry,
        })
      } catch { /* continuar con fallback */ }

      // Paso 2: generar PDF
      await generateProposalPDF({
        restaurantName: brand.name || 'Restaurante',
        zoneMetrics: zoneData,
        categoryMetrics: categoryData,
        plResult: pl.result,
        executive,
        generatedAt: new Date(),
        whyRappiContent,
        dailyOrders: pl.aliado.dailyOrders,
        rappiDailyOrders,
        incrementalityPct: pl.incrementalityPct,
        ticketActual: pl.aliado.avgTicket || categoryData.avgTicket,
        operativeDays: pl.aliado.operativeDays,
        additionalBenefits: pitch.additionalBenefits || undefined,
        proposalConfig: pitch.proposalConfig,
      })

      // Paso 3 (background): generar objeciones personalizadas para el drawer
      generateObjections(
        {
          restaurantName: brand.name || 'Restaurante',
          opsZone: zoneData.opsZone,
          category: categoryData.category,
        },
        (text) => {
          try {
            const parsed = JSON.parse(text)
            if (Array.isArray(parsed)) setObjections(parsed)
          } catch { /* ignorar */ }
        },
        () => { /* ignorar errores de objeciones */ },
      )
    } finally {
      setPdfGenerating(false)
      setShowModal(false)
    }
  }

  const canExportPDF = !!zoneData && !!categoryData && !!pl.result
  const proposalConfigComplete =
    pitch.proposalConfig.agreementType !== null &&
    pitch.proposalConfig.serviceType !== null
  const canGeneratePDF = canExportPDF && proposalConfigComplete

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-black text-gray-900">Propuesta lista</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Revisa el resumen, agrega las condiciones pactadas y genera el PDF.
        </p>
      </div>

      {/* ── Resumen del caso (stat pills) ── */}
      {canExportPDF && pl.result && (
        <div className="card p-3 space-y-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Resumen del caso
          </h2>

          {/* Fila 1: identidad */}
          <div className="grid grid-cols-3 gap-2">
            <Pill label="Restaurante" value={brand.name || '—'} />
            <Pill label="Zona" value={zoneData!.opsZone} />
            <Pill label="Categoría" value={categoryData!.category} />
          </div>

          {/* Fila 2: números */}
          <div className="grid grid-cols-3 gap-2">
            <Pill
              label="Ventas actuales/mes"
              value={formatLocalCurrency(pl.result.ownSales, zoneCountry)}
            />
            <Pill
              label={`Rappi +${pl.incrementalityPct}%`}
              value={`+${formatLocalCurrency(pl.result.additionalSales, zoneCountry)}`}
              highlight
            />
            <Pill
              label="Utilidad adicional/mes"
              value={`+${formatLocalCurrency(pl.result.additionalProfit, zoneCountry)}`}
              highlight
            />
          </div>
        </div>
      )}

      {/* ── Condiciones pactadas ── */}
      <div className="card p-3 space-y-2">
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
            Condiciones y beneficios pactados
          </h2>
          <p className="text-[10px] text-gray-400">
            Aparecerá como sección "Propuesta comercial" en el PDF
          </p>
        </div>
        <textarea
          value={pitch.additionalBenefits}
          onChange={(e) => setAdditionalBenefits(e.target.value)}
          placeholder={
            'Escribe aquí las condiciones pactadas con el cliente:\n' +
            'comisión acordada, periodos, descuentos especiales,\n' +
            'beneficios adicionales negociados...\n\n' +
            'Ej: 0% comisión meses 1-2, 15% meses 3-4,\n' +
            '    acceso a campaña de verano incluida,\n' +
            '    soporte prioritario primer mes.'
          }
          rows={5}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rappi-orange/30 focus:border-rappi-orange transition-colors resize-none text-gray-700 placeholder:text-gray-400"
        />
        {pitch.additionalBenefits.trim() && (
          <p className="text-[10px] text-rappi-orange font-medium">
            ✓ Se incluirá como propuesta comercial en el PDF
          </p>
        )}
      </div>

      {/* ── ProposalConfig: país, acuerdo, servicio ── */}
      <ProposalConfig
        value={pitch.proposalConfig}
        onChange={setProposalConfig}
      />

      {/* ── Botón principal PDF ── */}
      <button
        onClick={() => setShowModal(true)}
        disabled={!canGeneratePDF || pdfGenerating}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-rappi-orange hover:bg-rappi-orange/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {pdfGenerating ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generando propuesta...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generar propuesta PDF
          </>
        )}
      </button>

      {canExportPDF && !proposalConfigComplete && (
        <p className="text-xs text-red-500 text-center -mt-2">
          Selecciona el tipo de acuerdo y servicio para continuar
        </p>
      )}
      {!canExportPDF && (
        <p className="text-xs text-gray-400 text-center -mt-2">
          Completa el análisis P&L para habilitar la exportación
        </p>
      )}

      <StepNav
        onBack={onBack}
        onNext={onRestart}
        nextLabel="Nueva visita"
        backLabel="Volver"
      />

      {showModal && (
        <ExecutiveModal
          onGenerate={handlePDFGenerate}
          onCancel={() => setShowModal(false)}
          isGenerating={pdfGenerating}
          restaurantName={brand.name || 'Restaurante'}
          opsZone={zoneData?.opsZone ?? ''}
          hasAdditionalBenefits={!!pitch.additionalBenefits.trim()}
        />
      )}
    </div>
  )
}
