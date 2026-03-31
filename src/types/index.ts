// ─────────────────────────────────────────────────────────────────────────────
// types/index.ts
// Tipos compartidos de la aplicación.
// ─────────────────────────────────────────────────────────────────────────────

// Importaciones de tipos externos usados en el store
import type { ZoneSummary, CategoryMetrics } from '../data/providers/DataProvider.interface'
import type { PLResult } from '../services/plCalculator'
import type { ExecutiveProfile } from '../services/pdfGenerator'

// Re-exportar para conveniencia
export type { ZoneSummary, CategoryMetrics, PLResult, ExecutiveProfile }

// ── ProposalConfig ────────────────────────────────────────────────────────────

export interface ProposalConfig {
  country: string
  agreementType: 'exclusive' | 'non-exclusive' | null
  serviceType: 'full-service' | 'marketplace' | null
}
