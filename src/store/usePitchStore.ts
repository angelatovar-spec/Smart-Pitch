// ─────────────────────────────────────────────────────────────────────────────
// usePitchStore.ts
// Estado global con Zustand — flujo completo del pitch.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import type { ZoneSummary, CategoryMetrics } from '../data/providers/DataProvider.interface'
import { calculatePL, type PLResult } from '../services/plCalculator'
import { calculateProjection, type MonthlyProjection } from '../services/projectionEngine'
import type { ProposalConfig } from '../types'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface CostStructure {
  rawMaterial: number   // % (0-100)
  payroll: number
  rent: number
  services: number
  others: number
}

export interface BrandData {
  name: string
  monthlyRevenue: number  // calculado desde aliado (ticket × pedidos × días)
  avgTicket: number
  branches: number
  schedule: string
  costs: CostStructure
}

export interface MarketingCampaign {
  id: string
  name: string
  percentage: number   // % (0-100)
}

export interface Objection {
  objection: string
  response: string
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface PitchStore {
  selectedZone: string | null
  selectedCategory: string | null
  zoneData: ZoneSummary | null
  categoryData: CategoryMetrics | null

  // País donde opera el restaurante
  zoneCountry: string

  brand: BrandData

  pl: {
    commission: number         // % (12-30), default 18
    discounts: number          // % (0-20), default 5
    incrementalityPct: number  // % (10-80), default 30 — qué % adicional genera Rappi
    aliado: {
      avgTicket: number        // ticket actual del restaurante
      dailyOrders: number      // pedidos actuales / día (base para calcular Rappi)
      operativeDays: number    // días operativos / mes, default 26
    }
    marketingCampaigns: MarketingCampaign[]
    result: PLResult | null
  }

  projection: {
    rampUpPct: number
    rampUpMonths: number
    monthlyGrowth: number
    data: MonthlyProjection[] | null
  }

  pitch: {
    objections: Objection[]
    additionalBenefits: string  // condiciones y beneficios pactados con el cliente
    proposalConfig: ProposalConfig
  }

  // Acciones
  setZoneData(zone: ZoneSummary, category: CategoryMetrics): void
  setSelectedZone(zone: string | null): void
  setSelectedCategory(category: string | null): void
  setBrand(brand: Partial<BrandData>): void
  setBrandCosts(costs: Partial<CostStructure>): void
  setPLParam(key: 'commission' | 'discounts' | 'incrementalityPct', value: number): void
  setPLAliado(key: 'avgTicket' | 'dailyOrders' | 'operativeDays', value: number): void
  addMarketingCampaign(): void
  updateMarketingCampaign(id: string, updates: Partial<MarketingCampaign>): void
  removeMarketingCampaign(id: string): void
  setProjectionParam(key: 'rampUpPct' | 'rampUpMonths' | 'monthlyGrowth', value: number): void
  setObjections(objections: Objection[]): void
  setAdditionalBenefits(v: string): void
  setProposalConfig(config: ProposalConfig): void
  setZoneCountry(country: string): void
  recalculatePL(): void
  recalculateProjection(): void
  resetPitch(): void

  // Tasas de cambio — cacheadas por nombre de país
  exchangeRates: Record<string, number>
  setExchangeRate(country: string, rate: number): void
}

// ── Texto predeterminado de condiciones (escalonada estándar Rappi) ────────────

export const DEFAULT_CONDITIONS =
  `Comisión\n\n` +
  `Hoy la comisión de Rappi se encuentra en un 26% sumando el IVA que se calcula sobre la comisión + 2% interbancario.\n\n` +
  `Sin embargo, te mostramos esta propuesta Exclusiva con Rappi: 0% de comisión primer y segundo *mes una vez firmado el contrato ` +
  `(La marca asume un 20% de descuento por este tiempo el menú o 50% de descuento en 3 productos top del menú)\n\n` +
  `- Mes 3 y 4: 15% + IVA* + 2% interbancario\n` +
  `- Mes 5 y 6: 17% + IVA* + 2% interbancario\n` +
  `- Mes 7 al 12: 18% + IVA* + 2% interbancario\n\n` +
  `*El IVA se aplica sobre el 19% de la comision\n` +
  `*La comision viene mas un 2% en ADS, se calcula desde el mes 3 con las ventas del mes anterior, ` +
  `objetivo generar una reinversion en publicidad y visibilidad de la marca dentro de la aplicacion.`

const DEFAULT_BRAND: BrandData = {
  name: '',
  monthlyRevenue: 0,
  avgTicket: 0,
  branches: 1,
  schedule: '12:00 - 22:00',
  costs: {
    rawMaterial: 35,
    payroll: 22,
    rent: 10,
    services: 4,
    others: 5,
  },
}

export const usePitchStore = create<PitchStore>((set, get) => ({
  selectedZone: null,
  selectedCategory: null,
  zoneData: null,
  categoryData: null,

  zoneCountry: 'Colombia',

  exchangeRates: {},

  brand: DEFAULT_BRAND,

  pl: {
    commission: 18,
    discounts: 5,
    incrementalityPct: 30,
    aliado: {
      avgTicket: 0,
      dailyOrders: 0,
      operativeDays: 26,
    },
    marketingCampaigns: [],
    result: null,
  },

  projection: {
    rampUpPct: 40,
    rampUpMonths: 3,
    monthlyGrowth: 3,
    data: null,
  },

  pitch: {
    objections: [],
    additionalBenefits: DEFAULT_CONDITIONS,
    proposalConfig: {
      country: 'Colombia',
      agreementType: null,
      serviceType: null,
    },
  },

  // ── Acciones ────────────────────────────────────────────────────────────────

  setZoneData(zone, category) {
    set((s) => ({
      zoneData: zone,
      categoryData: category,
      brand: { ...s.brand, avgTicket: category.avgTicket },
      pl: {
        ...s.pl,
        aliado: {
          avgTicket: category.avgTicket,
          dailyOrders: Math.round(category.ordersPerDay),
          operativeDays: 26,
        },
      },
      // Restablecer condiciones al cambiar de zona (nuevo cliente)
      pitch: { ...s.pitch, additionalBenefits: DEFAULT_CONDITIONS },
    }))
    get().recalculatePL()
  },

  setSelectedZone(zone) {
    set((s) => ({
      selectedZone: zone,
      selectedCategory: null,
      zoneData: null,
      categoryData: null,
      pitch: { ...s.pitch, additionalBenefits: DEFAULT_CONDITIONS },
    }))
  },

  setSelectedCategory(category) {
    set({ selectedCategory: category })
  },

  setBrand(brand) {
    set((s) => ({ brand: { ...s.brand, ...brand } }))
    get().recalculatePL()
    get().recalculateProjection()
  },

  setBrandCosts(costs) {
    set((s) => ({
      brand: { ...s.brand, costs: { ...s.brand.costs, ...costs } },
    }))
    get().recalculatePL()
  },

  setPLParam(key, value) {
    set((s) => ({ pl: { ...s.pl, [key]: value } }))
    get().recalculatePL()
    get().recalculateProjection()
  },

  setPLAliado(key, value) {
    set((s) => ({
      pl: { ...s.pl, aliado: { ...s.pl.aliado, [key]: value } },
    }))
    get().recalculatePL()
    get().recalculateProjection()
  },

  addMarketingCampaign() {
    const id = `camp_${Date.now()}`
    set((s) => ({
      pl: {
        ...s.pl,
        marketingCampaigns: [...s.pl.marketingCampaigns, { id, name: '', percentage: 0 }],
      },
    }))
  },

  updateMarketingCampaign(id, updates) {
    set((s) => ({
      pl: {
        ...s.pl,
        marketingCampaigns: s.pl.marketingCampaigns.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      },
    }))
    get().recalculatePL()
  },

  removeMarketingCampaign(id) {
    set((s) => ({
      pl: {
        ...s.pl,
        marketingCampaigns: s.pl.marketingCampaigns.filter((c) => c.id !== id),
      },
    }))
    get().recalculatePL()
  },

  setProjectionParam(key, value) {
    set((s) => ({ projection: { ...s.projection, [key]: value } }))
    get().recalculateProjection()
  },

  setObjections(objections) {
    set((s) => ({ pitch: { ...s.pitch, objections } }))
  },

  setAdditionalBenefits(v) {
    set((s) => ({ pitch: { ...s.pitch, additionalBenefits: v } }))
  },

  setProposalConfig(config) {
    set((s) => ({ pitch: { ...s.pitch, proposalConfig: config } }))
  },

  setZoneCountry(country) {
    set({ zoneCountry: country })
  },

  recalculatePL() {
    const { brand, pl } = get()
    const { aliado, marketingCampaigns, incrementalityPct } = pl

    // Ventas actuales del restaurante (canal propio)
    const ownSales = aliado.avgTicket * aliado.dailyOrders * aliado.operativeDays

    // Canal Rappi: pedidos incrementales según el % de incrementalidad
    const rappiDailyOrders = aliado.dailyOrders * (incrementalityPct / 100)
    const rappiSales = aliado.avgTicket * rappiDailyOrders * aliado.operativeDays

    if (ownSales === 0) {
      set((s) => ({ pl: { ...s.pl, result: null } }))
      return
    }

    const marketingPct = marketingCampaigns.reduce((sum, c) => sum + c.percentage / 100, 0)

    const result = calculatePL({
      monthlyRevenue: ownSales,
      rappiSales,
      rawMaterialPct: brand.costs.rawMaterial / 100,
      payrollPct: brand.costs.payroll / 100,
      rentPct: brand.costs.rent / 100,
      servicesPct: brand.costs.services / 100,
      othersPct: brand.costs.others / 100,
      commission: pl.commission / 100,
      discounts: pl.discounts / 100,
      marketingPct,
    })

    // Sincronizar monthlyRevenue en brand para que esté disponible en prompts
    set((s) => ({
      brand: { ...s.brand, monthlyRevenue: ownSales },
      pl: { ...s.pl, result },
    }))
  },

  recalculateProjection() {
    const { brand, pl, projection, categoryData } = get()
    const { aliado, incrementalityPct } = pl

    const rappiDailyOrders = aliado.dailyOrders * (incrementalityPct / 100)
    const rappiSales = aliado.avgTicket * rappiDailyOrders * aliado.operativeDays
    if (rappiSales === 0) return

    const avgTicket = categoryData?.avgTicket ?? aliado.avgTicket ?? brand.avgTicket

    const result = calculateProjection({
      targetMonthlySales: rappiSales,
      rampUpPct: projection.rampUpPct / 100,
      rampUpMonths: projection.rampUpMonths,
      monthlyGrowth: projection.monthlyGrowth / 100,
      avgTicket,
      commission: pl.commission / 100,
      discounts: pl.discounts / 100,
      rawMaterialPct: brand.costs.rawMaterial / 100,
      payrollPct: brand.costs.payroll / 100,
    })

    set((s) => ({ projection: { ...s.projection, data: result.months } }))
  },

  resetPitch() {
    set((s) => ({
      pitch: {
        ...s.pitch,
        objections: [],
        additionalBenefits: DEFAULT_CONDITIONS,
        proposalConfig: { country: 'Colombia', agreementType: null, serviceType: null },
      },
    }))
  },

  setExchangeRate(country, rate) {
    set((s) => ({ exchangeRates: { ...s.exchangeRates, [country]: rate } }))
  },
}))
