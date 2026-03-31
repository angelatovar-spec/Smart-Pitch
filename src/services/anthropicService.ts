// ─────────────────────────────────────────────────────────────────────────────
// anthropicService.ts
// Llamadas a la API de Anthropic usadas en la app.
//
// ADVERTENCIA DE SEGURIDAD:
// La API key se expone en el cliente. Para producción, mover estas llamadas
// a un backend: POST /api/generate-*
// ─────────────────────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk'
import type { ZoneSummary, CategoryMetrics } from '../data/providers/DataProvider.interface'
import type { PLResult } from './plCalculator'
import { formatLocalCurrency } from '../utils/formatters'

// ── Tipos exportados ──────────────────────────────────────────────────────────

export interface WhyRappiContent {
  intro: string
  bullets: string[]
}

export interface WhyRappiInput {
  zone: ZoneSummary
  category: CategoryMetrics
  restaurantName: string
  plResult: PLResult
  dailyOrders: number
  rappiDailyOrders: number
  incrementalityPct: number
  additionalBenefits?: string
  zoneCountry?: string  // nombre completo del país para formatear moneda
}

export interface ObjectionsInput {
  restaurantName: string
  opsZone: string
  category: string
}

// ── Cliente ───────────────────────────────────────────────────────────────────

function getClient() {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'tu_key_aqui') {
    throw new Error('Falta la VITE_ANTHROPIC_API_KEY en el archivo .env')
  }
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

// ── generateObjections ────────────────────────────────────────────────────────

/**
 * Genera 4 objeciones personalizadas para el restaurante.
 * Se usa en el drawer de objeciones, se dispara tras generar el PDF.
 */
export async function generateObjections(
  input: ObjectionsInput,
  onDone: (text: string) => void,
  onError: (err: Error) => void,
): Promise<void> {
  try {
    const client = getClient()
    const { restaurantName, opsZone, category } = input
    const prompt =
      `Para el restaurante "${restaurantName}" en la zona ${opsZone} (categoría: ${category}), ` +
      `genera exactamente 4 objeciones frecuentes de un dueño de restaurante ante Rappi y sus respuestas ` +
      `consultivas y específicas para este contexto.\n` +
      `Formato JSON: [{"objection": "...", "response": "..."}]\n` +
      `Solo el JSON, sin más texto.`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    })
    const content = response.content[0]
    if (content.type === 'text') onDone(content.text)
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)))
  }
}

// ── generateWhyRappiArguments ─────────────────────────────────────────────────

/**
 * Genera el contenido de "¿Por qué ser aliados?" para la Sección 1 del PDF.
 * Retorna { intro: string, bullets: string[] } con datos reales de zona/P&L.
 */
export async function generateWhyRappiArguments(input: WhyRappiInput): Promise<WhyRappiContent> {
  const client = getClient()
  const {
    zone, category, restaurantName, plResult,
    dailyOrders, rappiDailyOrders, incrementalityPct,
    additionalBenefits, zoneCountry = 'Colombia',
  } = input

  const prompt =
    `Eres un consultor senior de Rappi Colombia. Para el documento de propuesta de "${restaurantName}", ` +
    `genera el contenido de la sección "¿Por qué ser aliados?".\n\n` +
    `DATOS REALES DE LA ZONA ${zone.opsZone} - ${zone.country}:\n` +
    `- Usuarios activos: ${zone.totalUsers.toLocaleString('es-CO')}\n` +
    `- Usuarios Prime: ${zone.primeUsers.toLocaleString('es-CO')} (${(zone.primeRate * 100).toFixed(0)}%)\n` +
    `- Categoria: ${category.category}\n` +
    `- Ordenes ultimas 4 semanas: ${category.ordersLast4Week.toLocaleString('es-CO')}\n` +
    `- Ordenes promedio/dia en la zona: ${Math.round(category.ordersPerDay)}\n` +
    `- GMV total categoria ultimas 4 semanas: ${formatLocalCurrency(category.gmvLast4Week, zoneCountry)}\n` +
    `- Ticket promedio zona: ${formatLocalCurrency(category.avgTicket, zoneCountry)}\n` +
    `- Dia pico: ${category.peakDay} con ${category.peakDayOrders.toLocaleString('es-CO')} ordenes\n` +
    `- GMV promedio por tienda (4 semanas): ${formatLocalCurrency(category.avgGmvStore, zoneCountry)}\n` +
    `- Ordenes promedio por tienda (4 semanas): ${Math.round(category.avgOrdStore)}\n` +
    `- Ordenes promedio por tienda/dia: ${(category.avgOrdStorePerDay).toFixed(1)}\n` +
    `- RTs disponibles en zona: ${category.availableRTs}\n` +
    `- Horas conectividad promedio: ${category.avgConnectivityHrs.toFixed(1)} hrs/dia\n` +
    `\nDATOS DEL RESTAURANTE:\n` +
    `- Pedidos actuales: ${dailyOrders}/dia\n` +
    `- Con Rappi (${incrementalityPct}% incrementalidad): +${rappiDailyOrders} pedidos/dia\n` +
    `- Ventas actuales: ${formatLocalCurrency(plResult.ownSales, zoneCountry)}/mes\n` +
    `- Utilidad adicional neta: ${formatLocalCurrency(plResult.additionalProfit, zoneCountry)}/mes\n` +
    (additionalBenefits?.trim() ? `- Condiciones pactadas: ${additionalBenefits.trim()}\n` : '') +
    `\nFORMATO DE RESPUESTA — solo JSON, sin texto adicional:\n` +
    `{\n` +
    `  "intro": "1 párrafo de 2-3 líneas con datos reales de la zona, tono consultivo",\n` +
    `  "bullets": [\n` +
    `    "dato concreto 1 con número real (máx 100 caracteres)",\n` +
    `    "dato concreto 2 con métrica real (máx 100 caracteres)",\n` +
    `    "dato concreto 3 con beneficio cuantificado (máx 100 caracteres)"\n` +
    `  ]\n` +
    `}\n\n` +
    `REGLAS:\n` +
    `- intro: párrafo corrido, no bullet, 2-3 líneas, datos reales de la zona\n` +
    `- bullets: exactamente 3, cada uno con números del contexto\n` +
    `- Tono colombiano, directo, de igual a igual — no vendedor`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') return { intro: '', bullets: [] }

  try {
    const parsed = JSON.parse(content.text)
    if (parsed && typeof parsed.intro === 'string' && Array.isArray(parsed.bullets)) {
      return {
        intro: parsed.intro as string,
        bullets: (parsed.bullets as string[]).slice(0, 3),
      }
    }
  } catch {
    const match = content.text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const p2 = JSON.parse(match[0])
        if (p2?.intro && Array.isArray(p2.bullets)) {
          return { intro: p2.intro as string, bullets: (p2.bullets as string[]).slice(0, 3) }
        }
      } catch { /* nada */ }
    }
  }

  return { intro: '', bullets: [] }
}
