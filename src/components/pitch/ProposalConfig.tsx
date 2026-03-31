// ─────────────────────────────────────────────────────────────────────────────
// ProposalConfig.tsx
// Wizard de 3 campos antes de generar el PDF:
//   1. País (dropdown)
//   2. Tipo de acuerdo (exclusivo / no exclusivo)
//   3. Tipo de servicio (full-service / marketplace)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'
import { SelectButton } from '../ui/SelectButton'
import type { ProposalConfig as ProposalConfigType } from '../../types'
import { usePitchStore } from '../../store/usePitchStore'

// ── Países donde opera Rappi ──────────────────────────────────────────────────

const RAPPI_COUNTRIES = [
  'Colombia',
  'México',
  'Brasil',
  'Argentina',
  'Chile',
  'Perú',
  'Ecuador',
  'Uruguay',
  'Costa Rica',
  'Panamá',
  'República Dominicana',
  'Honduras',
  'Paraguay',
  'Bolivia',
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  value: ProposalConfigType
  onChange: (config: ProposalConfigType) => void
}

// ── Subcomponente: label de campo ─────────────────────────────────────────────

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
      {children}
    </p>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ProposalConfig({ value, onChange }: Props) {
  const { zoneCountry } = usePitchStore()

  // Inicializar país desde la zona seleccionada (solo al montar)
  useEffect(() => {
    if (zoneCountry && value.country !== zoneCountry) {
      onChange({ ...value, country: zoneCountry })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function set(partial: Partial<ProposalConfigType>) {
    onChange({ ...value, ...partial })
  }

  return (
    <div className="card p-3 space-y-4">
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
          Configuración de la propuesta
        </h2>
        <p className="text-[10px] text-gray-400">
          Selecciona país, tipo de acuerdo y tipo de servicio para habilitar el PDF.
        </p>
      </div>

      {/* ── Campo 1: País ── */}
      <div>
        <FieldLabel>País</FieldLabel>
        <div className="relative">
          <select
            value={value.country}
            onChange={(e) => set({ country: e.target.value })}
            className="w-full appearance-none border-[1.5px] border-[#D1D5DB] rounded-xl px-4 py-3 pr-10 text-sm text-[#374151] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#FF441B]/30 focus:border-[#FF441B] transition-all duration-150 cursor-pointer"
          >
            {RAPPI_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {/* Chevron */}
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </div>

      {/* ── Campo 2: Tipo de acuerdo ── */}
      <div>
        <FieldLabel>Tipo de acuerdo</FieldLabel>
        <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-2 max-[399px]:grid-cols-1">
          <SelectButton
            label="Exclusivo"
            icon="🔒"
            selected={value.agreementType === 'exclusive'}
            onClick={() =>
              set({ agreementType: value.agreementType === 'exclusive' ? null : 'exclusive' })
            }
          />
          <SelectButton
            label="No exclusivo"
            icon="🔓"
            selected={value.agreementType === 'non-exclusive'}
            onClick={() =>
              set({ agreementType: value.agreementType === 'non-exclusive' ? null : 'non-exclusive' })
            }
          />
        </div>
      </div>

      {/* ── Campo 3: Tipo de servicio ── */}
      <div>
        <FieldLabel>Tipo de servicio</FieldLabel>
        <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-2 max-[399px]:grid-cols-1">
          <SelectButton
            label="Full Service"
            sublabel="Rappi pone repartidores"
            selected={value.serviceType === 'full-service'}
            onClick={() =>
              set({ serviceType: value.serviceType === 'full-service' ? null : 'full-service' })
            }
          />
          <SelectButton
            label="Marketplace"
            sublabel="El restau pone riders"
            selected={value.serviceType === 'marketplace'}
            onClick={() =>
              set({ serviceType: value.serviceType === 'marketplace' ? null : 'marketplace' })
            }
          />
        </div>

        {/* Badge informativo según serviceType */}
        {value.serviceType && (
          <div className="mt-2 flex items-start gap-1.5 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
            <span className="text-sm leading-none mt-0.5">ℹ️</span>
            <p className="text-[11px] text-blue-700 leading-snug">
              {value.serviceType === 'full-service'
                ? 'La comisión incluye el servicio de repartidores de Rappi'
                : 'La comisión no incluye repartidores — el restaurante gestiona su propia flota'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
