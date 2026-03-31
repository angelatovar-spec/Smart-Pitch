// ─────────────────────────────────────────────────────────────────────────────
// ExecutiveModal.tsx
// Modal para datos del ejecutivo + fecha límite + preview del contenido del PDF.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import type { ExecutiveProfile } from '../../services/pdfGenerator'

const STORAGE_KEY = 'rappi_exec_profile'

interface Props {
  onGenerate: (profile: ExecutiveProfile) => void
  onCancel: () => void
  isGenerating: boolean
  // Para el preview
  restaurantName: string
  opsZone: string
  hasAdditionalBenefits: boolean
}

export function ExecutiveModal({
  onGenerate,
  onCancel,
  isGenerating,
  restaurantName,
  opsZone,
  hasAdditionalBenefits,
}: Props) {
  const [profile, setProfile] = useState<ExecutiveProfile>({
    name: '',
    title: '',
    email: '',
    phone: '',
  })

  // Restaurar perfil guardado
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setProfile(JSON.parse(saved))
    } catch {
      // ignore
    }
  }, [])

  function set(key: keyof ExecutiveProfile, value: string) {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  function handleGenerate() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch { /* ignore */ }
    onGenerate(profile)
  }

  const previewItems = [
    { label: 'Por qué ser aliados (generado con IA)', always: true },
    { label: `Datos reales de ${opsZone}`, always: true },
    { label: 'P&L completo', always: true },
    {
      label: hasAdditionalBenefits
        ? 'Condiciones pactadas (comisión y beneficios)'
        : 'Condiciones pactadas (pendiente de completar)',
      always: true,
    },
    { label: 'Propuesta de valor Rappi', always: true },
    { label: 'Próximos pasos', always: true },
    { label: profile.name ? `Firmado por ${profile.name}` : 'Firma del ejecutivo', always: true },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div>
          <h2 className="text-base font-bold text-gray-900">Generar propuesta PDF</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Completa los datos del ejecutivo para el documento
          </p>
        </div>

        {/* Campos del ejecutivo */}
        <div className="space-y-3">
          {([
            { key: 'name' as const, label: 'Nombre completo', placeholder: 'Ana González' },
            { key: 'title' as const, label: 'Cargo', placeholder: 'Ejecutiva de Ventas' },
            { key: 'email' as const, label: 'Email', placeholder: 'ana@rappi.com', type: 'email' },
            { key: 'phone' as const, label: 'Teléfono', placeholder: '300 123 4567', type: 'tel' },
          ]).map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-700 block mb-1">{label}</label>
              <input
                type={type ?? 'text'}
                value={profile[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="input-field text-sm"
              />
            </div>
          ))}

        </div>

        {/* Preview del contenido */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
          <p className="text-xs font-semibold text-gray-600 mb-2">El PDF incluirá:</p>
          {previewItems.map((item) => {
            return (
              <div key={item.label} className="flex items-start gap-2">
                <span className="text-rappi-orange font-bold text-xs mt-0.5">✓</span>
                <span className="text-xs text-gray-700">{item.label}</span>
              </div>
            )
          })}
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={isGenerating}
            className="btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary flex-1"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando...
              </span>
            ) : (
              'Generar PDF →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
