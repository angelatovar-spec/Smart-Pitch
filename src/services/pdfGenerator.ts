// ─────────────────────────────────────────────────────────────────────────────
// pdfGenerator.ts
// Propuesta de alianza estratégica Rappi — PDF portrait A4 (210×297mm).
// 100% jsPDF nativo — sin html2canvas.
// ─────────────────────────────────────────────────────────────────────────────

import jsPDF from 'jspdf'
import type { ZoneSummary, CategoryMetrics } from '../data/providers/DataProvider.interface'
import type { PLResult } from './plCalculator'
import type { WhyRappiContent } from './anthropicService'
import type { ProposalConfig } from '../types'
import { formatLocalCurrency, formatNumber } from '../utils/formatters'
import { loadImageAsBase64 } from '../utils/imageLoader'
import logoUrl from '../assets/Logo.png'
import bigoteUrl from '../assets/bigote.png'

// ── Exported interfaces ───────────────────────────────────────────────────────

export interface ExecutiveProfile {
  name: string
  title: string
  email: string
  phone: string
}

export interface PDFProposalData {
  restaurantName: string
  zoneMetrics: ZoneSummary
  categoryMetrics: CategoryMetrics
  plResult: PLResult
  executive: ExecutiveProfile
  generatedAt: Date

  // IA — sección 1
  whyRappiContent: WhyRappiContent

  // Datos del negocio
  dailyOrders: number
  rappiDailyOrders: number
  incrementalityPct: number
  ticketActual: number      // ticket promedio real del restaurante
  operativeDays: number     // días operativos/mes (default 26)

  // Condiciones pactadas (comisión, periodos, beneficios negociados — texto libre del ejecutivo)
  additionalBenefits?: string

  // Configuración del wizard (país, tipo de acuerdo, tipo de servicio)
  proposalConfig?: ProposalConfig

  // Logo en base64 — cargado al inicio de generateProposalPDF
  logoBase64?: string | null
  // Bigote en base64 — imagen para la sección de firma
  bigoteBase64?: string | null
  // Dimensiones calculadas internamente (no se pasan desde fuera)
  _logoDims?: { wCover: number; hCover: number; wHeader: number; hHeader: number }
  _bigoteDims?: { w: number; h: number }
}

// ── Page layout ───────────────────────────────────────────────────────────────

const PAGE_W = 210
const PAGE_H = 297
const ML = 25.4    // margin left  (1 inch)
const MR = 25.4    // margin right (1 inch)
const MT = 25.4    // margin top   (1 inch)
const MB = 25.4    // margin bottom (1 inch)
const CW = 159.2   // content width = PAGE_W - ML - MR

// Zona reservada para el encabezado (logo + línea separadora)
const HEADER_HEIGHT   = 18      // mm — espacio fijo encima del contenido
const CONTENT_START_Y = MT + HEADER_HEIGHT  // = 43.4mm desde el borde

// ── Tipografía ────────────────────────────────────────────────────────────────

const FONT = {
  cover:   12,   // asunto de portada
  section: 11,   // títulos de sección
  sub:      9,   // subtítulos y cuerpo
  body:     9,
  small:    7.5, // notas
  table:    8,   // tablas
}

// Interlineado 1.0 — baseline-to-baseline en mm (pt × 0.3528)
const LH = {
  cover:   +(FONT.cover  * 0.3528).toFixed(1),  // 4.2mm
  section: +(FONT.section* 0.3528).toFixed(1),  // 3.9mm
  body:    +(FONT.body   * 0.3528).toFixed(1),  // 3.2mm
  small:   +(FONT.small  * 0.3528).toFixed(1),  // 2.6mm
  table:   +(FONT.table  * 0.3528).toFixed(1),  // 2.8mm
}

// Espaciado entre bloques (no es interlineado, es separación entre elementos)
const SP = {
  afterTitle:    3,   // mm después de título de sección
  afterPara:     3,   // mm después de párrafo
  afterBullet:   2,   // mm después de bullet
  section:       7,   // mm entre secciones
  afterTable:    5,   // mm después de tabla
  rowH:          6,   // mm alto de fila en tabla
}

// ── Colors ────────────────────────────────────────────────────────────────────

type RGB = [number, number, number]

const C = {
  rappiRed:   [255, 68, 27]  as RGB,
  black:      [26, 26, 26]   as RGB,
  darkGray:   [80, 80, 80]   as RGB,
  lightGray:  [240, 240, 240] as RGB,
  green:      [29, 158, 117] as RGB,
  greenLight: [212, 237, 218] as RGB,
  white:      [255, 255, 255] as RGB,
  sepGray:    [200, 200, 200] as RGB,
}

// ── Page context ──────────────────────────────────────────────────────────────

interface PageCtx {
  n: number  // página actual (1-indexed)
}

// ── Low-level helpers ─────────────────────────────────────────────────────────

function setColor(
  doc: jsPDF,
  rgb: RGB,
  target: 'text' | 'fill' | 'draw' = 'text',
): void {
  if (target === 'fill') doc.setFillColor(rgb[0], rgb[1], rgb[2])
  else if (target === 'draw') doc.setDrawColor(rgb[0], rgb[1], rgb[2])
  else doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

function setFont(
  doc: jsPDF,
  style: 'normal' | 'bold',
  size: number,
  color?: RGB,
): void {
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  if (color) setColor(doc, color)
}

function drawLine(
  doc: jsPDF,
  x1: number, y1: number,
  x2: number, y2: number,
  color: RGB,
  width = 0.3,
): void {
  doc.setLineWidth(width)
  setColor(doc, color, 'draw')
  doc.line(x1, y1, x2, y2)
}

function fillRect(
  doc: jsPDF,
  x: number, y: number,
  w: number, h: number,
  color: RGB,
): void {
  setColor(doc, color, 'fill')
  doc.rect(x, y, w, h, 'F')
}

// ── Text sanitization ─────────────────────────────────────────────────────────

/**
 * jsPDF + helvetica solo soporta ASCII (Latin-1).
 * Esta función elimina/reemplaza todo carácter fuera de ese rango
 * para evitar que aparezcan secuencias %Ï o basura en el PDF.
 */
function sanitizeForPDF(text: string): string {
  return text
    .replace(/%[A-Z0-9]{2}/g, '')
    .replace(/[áàä]/g, 'a').replace(/[ÁÀÄ]/g, 'A')
    .replace(/[éèë]/g, 'e').replace(/[ÉÈË]/g, 'E')
    .replace(/[íìï]/g, 'i').replace(/[ÍÌÏ]/g, 'I')
    .replace(/[óòö]/g, 'o').replace(/[ÓÒÖ]/g, 'O')
    .replace(/[úùü]/g, 'u').replace(/[ÚÙÜ]/g, 'U')
    .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
    .replace(/●/g, '-').replace(/★/g, '*')
    .replace(/✓/g, '+').replace(/▸/g, '-')
    .replace(/–/g, '-').replace(/—/g, '-')
    .replace(/[""]/g, '"').replace(/['']/g, "'")
    .replace(/[^\x00-\x7F]/g, '')
    .trim()
}

/** Wrapper seguro para doc.text(): sanitiza antes de imprimir. */
function safeText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  opts?: { align?: 'left' | 'center' | 'right' },
): void {
  doc.text(sanitizeForPDF(text), x, y, opts ?? {})
}

// ── Core helpers ──────────────────────────────────────────────────────────────

/**
 * Imprime texto con word-wrap automático (jsPDF no lo hace solo).
 *
 * @param doc        instancia jsPDF
 * @param text       texto a imprimir (puede tener \n)
 * @param x          posición X — left edge
 * @param y          posición Y — baseline de la primera línea
 * @param maxWidth   ancho máximo en mm
 * @param lineHeight espacio baseline-to-baseline en mm
 * @param opts.bold  usar helvetica bold
 * @param opts.size  tamaño de fuente (pt) — se aplica antes de imprimir
 * @param opts.color color RGB del texto
 * @returns          Y de la siguiente línea disponible (última baseline + lineHeight)
 */
export function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  opts: { bold?: boolean; size?: number; color?: RGB } = {},
): number {
  if (opts.size !== undefined) doc.setFontSize(opts.size)
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
  if (opts.color) setColor(doc, opts.color)

  const safe = sanitizeForPDF(text)
  const lines = doc.splitTextToSize(safe, maxWidth) as string[]
  lines.forEach((line, i) => {
    doc.text(line, x, y + i * lineHeight)
  })
  return y + lines.length * lineHeight
}

/**
 * Dibuja un bullet "● texto" con word-wrap.
 * El punto negro ocupa los primeros 5mm; el texto sigue sangrado.
 * @returns Y debajo del bullet (lista de la siguiente línea).
 */
function addBullet(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
): number {
  setFont(doc, 'normal', 9, C.black)
  doc.text('-', x, y)
  const safe = sanitizeForPDF(text)
  const lines = doc.splitTextToSize(safe, maxWidth - 5) as string[]
  lines.forEach((line, i) => {
    doc.text(line, x + 5, y + i * LH.body)
  })
  return y + lines.length * LH.body
}

/**
 * Título de sección: helvetica bold 11pt, rojo Rappi, centrado.
 * @returns Y debajo del título + SP.afterPara.
 */
function drawSectionTitle(doc: jsPDF, text: string, y: number): number {
  setFont(doc, 'bold', 11, C.rappiRed)
  safeText(doc, text, ML + CW / 2, y, { align: 'center' })
  return y + LH.section + SP.afterTitle
}

/**
 * Subtítulo inline: helvetica bold 9pt, negro.
 * @returns Y debajo + SP.afterPara.
 */
function drawSubtitle(doc: jsPDF, text: string, y: number, x = ML): number {
  return addWrappedText(doc, text, x, y, CW, LH.body, {
    bold: true, size: 9, color: C.black,
  }) + SP.afterPara
}

/**
 * Párrafo de cuerpo: helvetica normal 9pt, negro.
 * @returns Y debajo + SP.afterPara.
 */
function drawParagraph(
  doc: jsPDF,
  text: string,
  y: number,
  x = ML,
  maxWidth = CW,
): number {
  return addWrappedText(doc, text, x, y, maxWidth, LH.body, {
    bold: false, size: 9, color: C.black,
  }) + SP.afterPara
}

/**
 * Nota al pie pequeña: helvetica normal 7.5pt, gris.
 * @returns Y debajo + 2mm.
 */
function drawNote(doc: jsPDF, text: string, y: number): number {
  return addWrappedText(doc, text, ML, y, CW, LH.small, {
    bold: false, size: 7.5, color: C.darkGray,
  }) + 2
}

// ── Table helpers ─────────────────────────────────────────────────────────────

interface TRow3 {
  label: string
  col1: string | null   // "Sin Rappi" (null → mostrar "—")
  col2: string | null   // "Con Rappi"
  isHeader?: boolean
  isTotal?: boolean
  isHighlighted?: boolean  // fondo verde claro
  separatorBefore?: boolean
  labelIndented?: boolean
}

/**
 * Tabla de 3 columnas: etiqueta + 2 valores numéricos (alineados a la derecha).
 * colWidths: [ancho etiqueta, ancho col1, ancho col2] — deben sumar ≤ CW.
 * @returns Y debajo de la última fila.
 */
function drawTable3Col(
  doc: jsPDF,
  x: number,
  startY: number,
  colWidths: [number, number, number],
  rows: TRow3[],
  rowH = 6,
): number {
  let y = startY
  const [w0, w1, w2] = colWidths
  const totalW = w0 + w1 + w2

  for (const row of rows) {
    if (row.separatorBefore) {
      drawLine(doc, x, y - 1, x + totalW, y - 1, C.darkGray, 0.3)
    }

    if (row.isHeader) {
      fillRect(doc, x, y - rowH + 1.5, totalW, rowH, C.lightGray)
    } else if (row.isHighlighted) {
      fillRect(doc, x, y - rowH + 1.5, totalW, rowH, C.greenLight)
    }

    const labelX = row.labelIndented ? x + 4 : x
    const style: 'bold' | 'normal' = row.isHeader || row.isTotal || row.isHighlighted
      ? 'bold' : 'normal'

    setFont(doc, style, 8.5, C.black)
    safeText(doc, row.label, labelX, y)

    if (row.col1 !== null && row.col1 !== undefined) {
      setFont(doc, style, 8.5, row.isHeader ? C.darkGray : C.black)
      safeText(doc, row.col1, x + w0 + w1, y, { align: 'right' })
    } else {
      setFont(doc, 'normal', 8.5, C.darkGray)
      doc.text('-', x + w0 + w1, y, { align: 'right' })
    }

    if (row.col2 !== null && row.col2 !== undefined) {
      const col2Color = row.isHighlighted ? C.green : C.black
      setFont(doc, style, 8.5, row.isHeader ? C.darkGray : col2Color)
      safeText(doc, row.col2, x + w0 + w1 + w2, y, { align: 'right' })
    } else {
      setFont(doc, 'normal', 8.5, C.darkGray)
      doc.text('-', x + w0 + w1 + w2, y, { align: 'right' })
    }

    y += rowH
  }

  return y
}

interface TRow2 {
  label: string
  value: string
  isHeader?: boolean
  bold?: boolean
}

/**
 * Tabla de 2 columnas: etiqueta (izquierda) + valor (derecha alineado).
 * colWidths: [ancho etiqueta, ancho valor] — deben sumar ≤ CW.
 * @returns Y debajo de la última fila.
 */
function drawTable2Col(
  doc: jsPDF,
  x: number,
  startY: number,
  colWidths: [number, number],
  rows: TRow2[],
  rowH = 6,
): number {
  let y = startY
  const [w0, w1] = colWidths

  for (const row of rows) {
    if (row.isHeader) {
      fillRect(doc, x, y - rowH + 1.5, w0 + w1, rowH, C.lightGray)
    }
    const style: 'bold' | 'normal' = row.isHeader || row.bold ? 'bold' : 'normal'
    setFont(doc, style, 8.5, C.black)
    safeText(doc, row.label, x, y)
    safeText(doc, row.value, x + w0 + w1, y, { align: 'right' })
    y += rowH
  }

  return y
}

// ── Page management ───────────────────────────────────────────────────────────

/**
 * Encabezado unificado para TODAS las páginas (incluyendo página 1).
 *   • Logo Rappi — esquina superior derecha, centrado verticalmente en HEADER_HEIGHT
 *   • Páginas 2+: nombre del restaurante a la izquierda y número de página
 *   • Línea separadora al final del área de encabezado
 */
function drawPageHeader(doc: jsPDF, data: PDFProposalData, pageNum: number): void {
  const logoW = data._logoDims?.wHeader ?? 22
  const logoH = data._logoDims?.hHeader ?? 7
  const logoX = PAGE_W - MR - logoW
  const logoY = MT + (HEADER_HEIGHT - logoH) / 2   // centrado vertical en la banda

  if (data.logoBase64) {
    doc.addImage(data.logoBase64, 'PNG', logoX, logoY, logoW, logoH)
  } else {
    setFont(doc, 'bold', 10, C.rappiRed)
    safeText(doc, 'rappi', PAGE_W - MR, MT + HEADER_HEIGHT / 2 + 1, { align: 'right' })
  }

  if (pageNum > 1) {
    const textY = MT + HEADER_HEIGHT / 2 + 1
    setFont(doc, 'normal', 7.5, C.darkGray)
    safeText(doc, sanitizeForPDF(data.restaurantName), ML, textY)
    safeText(doc, String(pageNum), logoX - 4, textY, { align: 'right' })
  }

  // Línea separadora al pie del encabezado
  drawLine(doc, ML, MT + HEADER_HEIGHT - 1, ML + CW, MT + HEADER_HEIGHT - 1, C.sepGray, 0.3)
}

/**
 * Agrega una nueva página, dibuja el encabezado y devuelve CONTENT_START_Y.
 */
function addNewPage(doc: jsPDF, data: PDFProposalData, ctx: PageCtx): number {
  doc.addPage()
  ctx.n++
  drawPageHeader(doc, data, ctx.n)
  return CONTENT_START_Y
}

/**
 * Verifica si el contenido cabe en la página actual.
 * Si no cabe: llama a addNewPage y devuelve CONTENT_START_Y.
 * Si cabe: devuelve la misma Y sin cambios.
 */
function checkPageBreak(
  doc: jsPDF,
  y: number,
  needed: number,
  data: PDFProposalData,
  ctx: PageCtx,
): number {
  if (y + needed > PAGE_H - MB) {
    return addNewPage(doc, data, ctx)
  }
  return y
}

// ── SECCIÓN 0 — Cover / Header página 1 ──────────────────────────────────────

/**
 * Dibuja el contenido de portada (por debajo del encabezado unificado):
 *   • "Asunto: Propuesta de alianza estratégica Rappi – {nombre}" — bold 12pt
 *   • Línea separadora roja 0.5mm
 *   • País + badges de acuerdo y servicio
 *
 * El encabezado (logo + separador) ya fue dibujado por drawPageHeader().
 * @returns Y donde empieza el primer contenido del documento.
 */
function drawSection1_Cover(doc: jsPDF, data: PDFProposalData): number {
  // ── Asunto — ocupa todo el ancho del contenido ────────────────────────────
  const asunto = sanitizeForPDF(
    `Asunto: Propuesta de alianza estrategica Rappi - ${data.restaurantName}`
  )
  setFont(doc, 'bold', 12, C.black)
  const allLines = doc.splitTextToSize(asunto, CW) as string[]

  const asuntoY = CONTENT_START_Y + 4
  allLines.forEach((line, i) => {
    doc.text(line, ML, asuntoY + i * LH.cover)
  })

  const asuntoEndY = asuntoY + allLines.length * LH.cover

  // ── Línea separadora roja ─────────────────────────────────────────────────
  const sepY = asuntoEndY + 3
  drawLine(doc, ML, sepY, ML + CW, sepY, C.rappiRed, 0.5)

  // ── País + badges de acuerdo y servicio ──────────────────────────────────
  let metaY = sepY + 5
  const cfg = data.proposalConfig

  if (cfg) {
    // País
    setFont(doc, 'normal', 8.5, C.darkGray)
    safeText(doc, `Pais: ${cfg.country}`, ML, metaY)
    metaY += LH.table + 2

    // Badge helper: fondo gris claro con texto pequeño bold
    function drawBadge(text: string, x: number, y: number, highlight: boolean): number {
      const safe = sanitizeForPDF(text)
      const pad = 2.5
      const badgeW = doc.getTextWidth(safe) + pad * 2
      const badgeH = 4.5
      fillRect(doc, x, y - 3.2, badgeW, badgeH, highlight ? C.rappiRed : C.lightGray)
      setFont(doc, 'bold', 7.5, highlight ? C.white : C.darkGray)
      doc.text(safe, x + pad, y)
      return x + badgeW + 2  // siguiente X
    }

    let bx = ML
    if (cfg.agreementType) {
      const label = cfg.agreementType === 'exclusive' ? 'Acuerdo Exclusivo' : 'No Exclusivo'
      bx = drawBadge(label, bx, metaY, cfg.agreementType === 'exclusive')
    }
    if (cfg.serviceType) {
      const label = cfg.serviceType === 'full-service' ? 'Full Service' : 'Marketplace'
      drawBadge(label, bx, metaY, false)
    }
    if (cfg.agreementType || cfg.serviceType) {
      metaY += LH.table + 3
    }
  }

  // Contenido empieza debajo de los badges (o 7mm debajo de la línea si no hay config)
  return cfg ? metaY : sepY + 7
}

// ── SECCIÓN 1 — ¿Por qué ser aliados? ────────────────────────────────────────

/**
 * Párrafo intro (generado por IA) + 3 bullets con datos concretos de la zona.
 * Datos provienen de whyRappiContent: { intro, bullets[] }.
 * @returns Y debajo de la sección + SP.section.
 */
function drawSection2_WhyAllies(
  doc: jsPDF,
  data: PDFProposalData,
  startY: number,
  ctx: PageCtx,
): number {
  const { whyRappiContent } = data
  const needed = 55  // estimación para verificar salto de página
  let y = checkPageBreak(doc, startY, needed, data, ctx)

  y = drawSectionTitle(doc, '\u00BFPor qu\u00e9 ser aliados?', y)

  // Párrafo intro
  const intro = whyRappiContent.intro ||
    `Unirse a Rappi representa una oportunidad de crecimiento inmediata para ${data.restaurantName}, ` +
    `aprovechando la base de usuarios activos y Prime de ${data.zoneMetrics.opsZone}.`
  y = drawParagraph(doc, intro, y)

  y += 2  // pequeño espacio antes de bullets

  // Bullets
  const bullets = whyRappiContent.bullets.length > 0
    ? whyRappiContent.bullets.slice(0, 3)
    : [
        `Acceso a ${formatNumber(data.zoneMetrics.primeUsers)} usuarios Prime en ${data.zoneMetrics.opsZone}`,
        `${formatNumber(data.categoryMetrics.ordersLast4Week)} \u00f3rdenes en 4 semanas · categor\u00eda ${data.categoryMetrics.category}`,
        `Utilidad adicional estimada: ${formatLocalCurrency(data.plResult.additionalProfit, data.proposalConfig?.country ?? 'Colombia')}/mes`,
      ]

  for (const bullet of bullets) {
    y = checkPageBreak(doc, y, LH.body * 3, data, ctx)
    y = addBullet(doc, bullet, ML, y, CW)
    y += SP.afterBullet
  }

  return y
}

// ── SECCIÓN 2 — Datos del mercado ────────────────────────────────────────────

/**
 * Tabla con métricas de zona y del restaurante (2 columnas).
 * Incluye texto de participación potencial y GMV de marcas exitosas.
 * @returns Y debajo de la sección.
 */
function drawSection3_MarketData(
  doc: jsPDF,
  data: PDFProposalData,
  startY: number,
  ctx: PageCtx,
): number {
  const { zoneMetrics: z, categoryMetrics: c, plResult: pl, dailyOrders, ticketActual } = data
  const country = data.proposalConfig?.country ?? 'Colombia'
  const needed = 90
  let y = checkPageBreak(doc, startY, needed, data, ctx)

  y = drawSectionTitle(doc, `Tu restaurante y el mercado en ${z.opsZone}`, y)
  y = drawSubtitle(doc, 'Datos reales de tu zona:', y)

  const primeRatePct = (z.primeRate * 100).toFixed(0)
  const ventasActuales = pl.ownSales
  const participacionPct = c.ordersPerDay > 0
    ? ((data.rappiDailyOrders / c.ordersPerDay) * 100).toFixed(1)
    : '0'

  const tableRows: TRow2[] = [
    { label: 'Indicador', value: 'Dato', isHeader: true },
    { label: 'Usuarios activos en la zona', value: formatNumber(z.totalUsers) },
    { label: 'Usuarios Prime', value: `${formatNumber(z.primeUsers)} (${primeRatePct}%)` },
    { label: '\u00d3rdenes \u00faltimas 4 semanas (categor\u00eda)', value: formatNumber(c.ordersLast4Week) },
    { label: '\u00d3rdenes promedio / d\u00eda', value: `${Math.round(c.ordersPerDay)} ord/d\u00eda` },
    { label: 'GMV categor\u00eda \u00faltimas 4 semanas', value: formatLocalCurrency(c.gmvLast4Week, country) },
    { label: 'Ticket promedio zona', value: formatLocalCurrency(c.avgTicket, country) },
    { label: 'D\u00eda pico', value: `${c.peakDay} \u2014 ${formatNumber(c.peakDayOrders)} ord` },
    { label: 'GMV promedio por tienda (4 semanas)', value: formatLocalCurrency(c.avgGmvStore, country) },
    { label: '\u00d3rdenes promedio por tienda (4 semanas)', value: `${Math.round(c.avgOrdStore)} \u00f3rdenes` },
    { label: 'Conectividad promedio tiendas', value: `${c.avgConnectivityHrs.toFixed(1).replace('.', ',')} hrs/d\u00eda` },
    { label: 'RTs disponibles en zona', value: String(c.availableRTs) },
    { label: 'Tu ticket promedio', value: formatLocalCurrency(ticketActual, country) },
    { label: 'Tus pedidos/d\u00eda actuales', value: String(dailyOrders) },
    { label: 'Tus ventas/mes estimadas', value: formatLocalCurrency(ventasActuales, country) },
  ]

  y = drawTable2Col(doc, ML, y, [110, 49], tableRows, 6)
  y += SP.afterPara

  // Destacado: participación potencial
  y = addWrappedText(
    doc,
    `Tu participaci\u00f3n potencial en la categor\u00eda: ${participacionPct}%`,
    ML, y, CW, LH.body, { bold: true, size: 9 },
  ) + 2

  y = addWrappedText(
    doc,
    `Una tienda promedio de ${c.category} en tu zona genera ${formatLocalCurrency(c.avgGmvStore, country)} en 4 semanas`,
    ML, y, CW, LH.body, { bold: true, size: 9 },
  ) + 2

  return y
}

// ── SECCIÓN 4 — P&L Rentabilidad proyectada ───────────────────────────────────

/**
 * Tabla P&L comparativa: Sin Rappi vs. Con Rappi (escenario moderado).
 * Fila UTILIDAD OPERACIONAL con fondo verde claro.
 * Box destacado con utilidad adicional y ROI.
 * @returns Y debajo de la sección.
 */
function drawSection5_PL(
  doc: jsPDF,
  data: PDFProposalData,
  startY: number,
  ctx: PageCtx,
): number {
  const { plResult: pl } = data
  const needed = 100
  let y = checkPageBreak(doc, startY, needed, data, ctx)

  y = drawSectionTitle(doc, 'P&L \u2014 Rentabilidad proyectada', y)
  y = drawSubtitle(doc, 'Escenario moderado (30% incrementalidad)', y)

  // Extraer valores de PLResult
  const ownSales       = pl.ownSales
  const rappiSales     = pl.additionalSales
  const totalSales     = ownSales + rappiSales
  const commission     = pl.commissionPaid
  const discounts      = pl.channelCosts - pl.commissionPaid - pl.marketingPaid
  const netIncome      = pl.netIncomeWithRappi
  const profitWithout  = pl.operatingProfitWithout
  const profitWith     = pl.operatingProfitWithRappi
  const additionalProfit = pl.additionalProfit

  // Obtener costos desde las rows del PLResult
  const findRow = (label: string) => pl.rows.find((r) => r.label === label)
  const rawMat   = findRow('Materia prima (-)')
  const payroll  = findRow('N\u00f3mina (-)')
  const rent     = findRow('Arriendo (-)')
  const services = findRow('Servicios (-)')
  const others   = findRow('Otros (-)')

  const pdfCountry = data.proposalConfig?.country ?? 'Colombia'
  const fmt = (v: number | null | undefined) =>
    v !== null && v !== undefined ? formatLocalCurrency(v, pdfCountry) : '\u2014'

  const COLS: [number, number, number] = [87, 36, 36]

  const rows: TRow3[] = [
    { label: 'Concepto', col1: 'Sin Rappi', col2: 'Con Rappi', isHeader: true },
    { label: 'Ventas brutas', col1: fmt(ownSales), col2: fmt(totalSales), isTotal: true },
    { label: 'Canal propio', col1: fmt(ownSales), col2: fmt(ownSales), labelIndented: true },
    { label: 'Canal Rappi', col1: null, col2: fmt(rappiSales), labelIndented: true },
    { label: 'Comisi\u00f3n Rappi (-)', col1: null, col2: fmt(-commission) },
    { label: 'Descuentos (-)', col1: null, col2: discounts > 0 ? fmt(-discounts) : null },
    { label: 'Ingreso neto', col1: fmt(ownSales), col2: fmt(netIncome), isTotal: true },
    { label: 'Materia prima (-)', col1: fmt(rawMat?.withoutRappi ?? null), col2: fmt(rawMat?.withRappi ?? null) },
    { label: 'N\u00f3mina (-)', col1: fmt(payroll?.withoutRappi ?? null), col2: fmt(payroll?.withRappi ?? null) },
    { label: 'Arriendo (-)', col1: fmt(rent?.withoutRappi ?? null), col2: fmt(rent?.withRappi ?? null) },
    { label: 'Servicios (-)', col1: fmt(services?.withoutRappi ?? null), col2: fmt(services?.withRappi ?? null) },
    { label: 'Otros (-)', col1: fmt(others?.withoutRappi ?? null), col2: fmt(others?.withRappi ?? null) },
    {
      label: 'UTILIDAD OPERACIONAL',
      col1: fmt(profitWithout),
      col2: fmt(profitWith),
      isTotal: true,
      isHighlighted: true,
      separatorBefore: true,
    },
    {
      label: 'Utilidad adicional/mes',
      col1: null,
      col2: `+${formatLocalCurrency(additionalProfit, pdfCountry)}`,
    },
  ]

  y = drawTable3Col(doc, ML, y, COLS, rows, 6)
  y += SP.afterPara

  // ── Box destacado ─────────────────────────────────────────────────────────
  const boxH = 14
  y = checkPageBreak(doc, y, boxH + 4, data, ctx)

  // Borde izquierdo verde (3mm)
  fillRect(doc, ML, y, 3, boxH, C.green)
  // Fondo blanco del box
  setColor(doc, C.green, 'draw')
  doc.setLineWidth(0.4)
  doc.rect(ML, y, CW, boxH, 'S')

  setFont(doc, 'bold', 10, C.black)
  safeText(doc, `Utilidad adicional mensual: +${formatLocalCurrency(additionalProfit, pdfCountry)}`, ML + 6, y + 6)
  const roiLabel = pl.badge === 'positive' ? '+ Positivo' : '! Revisar'
  setFont(doc, 'bold', 9, pl.badge === 'positive' ? C.green : C.rappiRed)
  safeText(doc, `ROI del canal Rappi: ${Math.round(pl.roi)}%  ${roiLabel}`, ML + 6, y + 11)

  return y + boxH + SP.afterPara
}

// ── SECCIÓN 5 — Propuesta comercial ──────────────────────────────────────────

/**
 * Renderiza las condiciones pactadas por el ejecutivo (comisión, periodos,
 * beneficios negociados) como texto libre desde additionalBenefits.
 * Si está vacío, muestra un placeholder en gris italic.
 * @returns Y debajo de la sección.
 */
function drawSection6_CommercialProposal(
  doc: jsPDF,
  data: PDFProposalData,
  startY: number,
  ctx: PageCtx,
): number {
  const needed = 40
  let y = checkPageBreak(doc, startY, needed, data, ctx)

  y = drawSubtitle(doc, 'Propuesta:', y)
  y = drawSubtitle(doc, 'Comisi\u00f3n y condiciones pactadas', y)

  const content = data.additionalBenefits?.trim()

  if (content) {
    // Renderizar el texto libre respetando saltos de línea del ejecutivo
    const inputLines = content.split('\n')
    for (const inputLine of inputLines) {
      if (inputLine.trim() === '') {
        y += SP.afterPara / 2  // línea en blanco → pequeño espacio
        continue
      }
      y = addWrappedText(doc, inputLine.trim(), ML, y, CW, LH.body, {
        bold: false, size: 9, color: C.black,
      })
      y += 1.5
    }
    y += SP.afterPara / 2
  } else {
    // Placeholder cuando el ejecutivo no escribió nada
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    setColor(doc, C.darkGray)
    const placeholder =
      '[Las condiciones pactadas con el cliente aparecer\u00e1n aqu\u00ed. ' +
      'Agr\u00e9galas antes de generar el PDF en el campo de condiciones pactadas.]'
    const lines = doc.splitTextToSize(placeholder, CW) as string[]
    lines.forEach((line, i) => {
      doc.text(line, ML, y + i * LH.table)
    })
    y += lines.length * LH.table + SP.afterPara
  }

  return y
}

// ── SECCIÓN 6 — Propuesta de valor Rappi ─────────────────────────────────────

/**
 * 3 beneficios fijos que Rappi asume para todos los nuevos aliados.
 * Se muestran siempre — no dependen de CommissionStructure.
 * @returns Y debajo de la sección.
 */
function drawSection7_ValueProp(
  doc: jsPDF,
  data: PDFProposalData,
  startY: number,
  ctx: PageCtx,
): number {
  const needed = 80
  let y = checkPageBreak(doc, startY, needed, data, ctx)

  y = drawSubtitle(
    doc,
    'Propuesta de Valor para Aliados Rappi, asumido por Rappi.',
    y,
  )

  // Párrafo de tipo de servicio (si viene de proposalConfig)
  if (data.proposalConfig?.serviceType) {
    const serviceText = data.proposalConfig.serviceType === 'full-service'
      ? 'Como aliado Full Service, Rappi se encarga de toda la log\u00edstica de entrega \u2014 t\u00fa solo te enfocas en preparar los pedidos.'
      : 'Como aliado Marketplace, mantienes el control de tu propia flota de repartidores con la visibilidad y demanda que Rappi te genera.'
    y = drawParagraph(doc, serviceText, y)
  }

  // Beneficio 1: Rappi Ads
  y = checkPageBreak(doc, y, 30, data, ctx)
  y = addWrappedText(
    doc, '1. Rappi Ads \u2013 Haz que tu marca se vea m\u00e1s',
    ML, y, CW, LH.body, { bold: true, size: 9 },
  ) + 1
  y = drawParagraph(
    doc,
    'Durante el primer mes, tu restaurante podr\u00e1 acceder a una campa\u00f1a de visibilidad dentro de la App de Rappi.',
    y,
  )
  y = addBullet(doc, 'Duraci\u00f3n de campa\u00f1a: 1 semana (first log in)', ML, y, CW) + SP.afterBullet
  y = addBullet(doc, 'Presupuesto: $40 USD', ML, y, CW) + SP.afterBullet
  y = drawParagraph(
    doc,
    'Esta herramienta permite que tu restaurante aparezca con mayor frecuencia frente a usuarios potenciales, ' +
    'incrementando la visibilidad y atracci\u00f3n de nuevos pedidos.',
    y,
  )
  y += 2

  // Beneficio 2: Cobertura extendida
  y = checkPageBreak(doc, y, 25, data, ctx)
  y = addWrappedText(
    doc, '2. Extensi\u00f3n del \u00e1rea de cobertura \u2013 Llega a m\u00e1s usuarios',
    ML, y, CW, LH.body, { bold: true, size: 9 },
  ) + 1
  y = drawParagraph(
    doc,
    'Durante los primeros 3 meses, se ampliar\u00e1 el radio de cobertura de tu restaurante dentro de la App, ' +
    'lo que permitir\u00e1 que m\u00e1s usuarios puedan ver y comprar tus productos. ' +
    'La extensi\u00f3n es de 1,3 km, para un total 6,3 km de cobertura.',
    y,
  )
  y += 2

  // Beneficio 3: Banner descuento
  y = checkPageBreak(doc, y, 25, data, ctx)
  y = addWrappedText(
    doc, '3. Nuevo Banner de Descuentos \u2013 Incrementa tu tr\u00e1fico',
    ML, y, CW, LH.body, { bold: true, size: 9 },
  ) + 1
  y = drawParagraph(
    doc,
    'Durante los 2 primeros meses, tu restaurante ser\u00e1 visible en un banner exclusivo dentro de la App de Rappi, ' +
    'destinado a promociones y descuentos.',
    y,
  )
  y = addBullet(doc, 'Condici\u00f3n: el restaurante debe tener un descuento activo para aparecer.', ML, y, CW) + SP.afterBullet
  y += 2

  return y
}

// ── SECCIÓN 7 — Próximos pasos ───────────────────────────────────────────────

/**
 * Lista fija de requisitos para activar la cuenta + fecha de vigencia.
 * @returns Y debajo de la sección.
 */
function drawSection9_NextSteps(
  doc: jsPDF,
  data: PDFProposalData,
  startY: number,
  ctx: PageCtx,
): number {
  const needed = 55
  let y = checkPageBreak(doc, startY, needed, data, ctx)

  y = drawSubtitle(doc, 'Proximos pasos:', y)
  y = drawParagraph(doc, 'Para activar tu cuenta en Rappi necesitas:', y)

  const steps = [
    'RUT y Camara de Comercio',
    'Cuenta bancaria del negocio',
    'Fotos del menu y del local',
    'Documento de identidad del representante legal',
    'Firma del contrato digital',
  ]

  for (const step of steps) {
    y = addBullet(doc, step, ML, y, CW)
    y += SP.afterBullet
  }

  y += 2

  y = drawParagraph(doc, 'Esta propuesta tiene vigencia de 10 dias.', y)

  return y
}

// ── SECCIÓN 9 — Firma del ejecutivo ──────────────────────────────────────────

/**
 * Firma del ejecutivo: nombre bold + cargo + teléfono + email.
 * @returns Y debajo de la sección.
 */
function drawSection10_Signature(
  doc: jsPDF,
  data: PDFProposalData,
  _startY: number,
  ctx: PageCtx,
): number {
  const { executive: e } = data
  const needed = 38
  let y = checkPageBreak(doc, _startY, needed, data, ctx)

  y += 4  // espacio extra antes de la firma

  // Bigote a la izquierda + datos del ejecutivo a la derecha
  const bW = data._bigoteDims?.w ?? 40
  const bH = data._bigoteDims?.h ?? 14
  const textX = data.bigoteBase64 ? ML + bW + 5 : ML
  const lineGap = 4.5

  if (data.bigoteBase64) {
    doc.addImage(data.bigoteBase64, 'PNG', ML, y, bW, bH)
  }

  // Texto alineado verticalmente al top del bigote
  const textStartY = y + 3
  setFont(doc, 'bold', 9, C.black)
  safeText(doc, e.name || 'Ejecutivo/a Rappi', textX, textStartY)

  setFont(doc, 'normal', 8.5, C.darkGray)
  safeText(doc, e.title || 'Ejecutivo de Ventas', textX, textStartY + lineGap)

  setFont(doc, 'normal', 8.5, C.black)
  safeText(doc, `Tel: ${e.phone}`, textX, textStartY + lineGap * 2)
  safeText(doc, `Email: ${e.email}`, textX, textStartY + lineGap * 3)

  y += Math.max(bH, lineGap * 4) + 4

  return y
}

// ── Image dimension helper ────────────────────────────────────────────────────

/**
 * Devuelve las dimensiones en píxeles de una imagen base64.
 * Necesario para calcular el aspect ratio antes de doc.addImage().
 */
function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 300, height: 100 })   // fallback 3:1
    img.src = base64
  })
}

// ── Función principal ─────────────────────────────────────────────────────────

/**
 * Genera y descarga la propuesta PDF completa.
 * 100% jsPDF nativo — sin html2canvas, sin capturas de pantalla.
 */
export async function generateProposalPDF(data: PDFProposalData): Promise<void> {
  // Cargar imágenes como base64 — fallback a null si falla
  let logoBase64: string | null = null
  let bigoteBase64: string | null = null
  try { logoBase64 = await loadImageAsBase64(logoUrl) } catch { /* sin logo */ }
  try { bigoteBase64 = await loadImageAsBase64(bigoteUrl) } catch { /* sin bigote */ }

  // Calcular dimensiones proporcionales del logo
  const LOGO_W_COVER  = 35   // mm — portada
  const LOGO_W_HEADER = 22   // mm — páginas 2+
  let logoHeightCover  = 12
  let logoHeightHeader = 7
  if (logoBase64) {
    const dims = await getImageDimensions(logoBase64)
    const ar = dims.width / dims.height
    logoHeightCover  = Math.round((LOGO_W_COVER  / ar) * 10) / 10
    logoHeightHeader = Math.round((LOGO_W_HEADER / ar) * 10) / 10
  }

  // Calcular dimensiones proporcionales del bigote
  const BIGOTE_H = 14   // mm fijo
  let bigoteWidth = 40  // fallback
  if (bigoteBase64) {
    const dims = await getImageDimensions(bigoteBase64)
    bigoteWidth = Math.round((BIGOTE_H * (dims.width / dims.height)) * 10) / 10
  }

  const dataWithLogo: PDFProposalData = {
    ...data,
    logoBase64,
    bigoteBase64,
    _logoDims: { wCover: LOGO_W_COVER, hCover: logoHeightCover, wHeader: LOGO_W_HEADER, hHeader: logoHeightHeader },
    _bigoteDims: { w: bigoteWidth, h: BIGOTE_H },
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const ctx: PageCtx = { n: 1 }

  // ── DIAGNÓSTICO TEMPORAL — remover después de verificar ──────────────────
  const FILETE_Y_DBG = MT + HEADER_HEIGHT - 1   // Y actual del separador
  const CONTENT_Y_DBG = CONTENT_START_Y          // Y donde empieza el contenido
  console.log('FILETE_Y:', FILETE_Y_DBG)
  console.log('CONTENT_Y:', CONTENT_Y_DBG)
  // ─────────────────────────────────────────────────────────────────────────

  // Página 1: encabezado unificado + portada
  drawPageHeader(doc, dataWithLogo, 1)
  let y = drawSection1_Cover(doc, dataWithLogo)
  console.log('cursorY al iniciar sección 1:', y)

  // Sección 1 — ¿Por qué ser aliados?
  y = drawSection2_WhyAllies(doc, dataWithLogo, y, ctx)
  console.log('cursorY al iniciar sección 2:', y)
  y += SP.section

  // Sección 2 — Datos del mercado
  y = drawSection3_MarketData(doc, dataWithLogo, y, ctx)
  y += SP.section

  // Sección 3 — P&L
  y = drawSection5_PL(doc, dataWithLogo, y, ctx)
  y += SP.section

  // Sección 4 — Propuesta comercial (condiciones pactadas)
  y = drawSection6_CommercialProposal(doc, dataWithLogo, y, ctx)
  y += SP.section

  // Sección 5 — Propuesta de valor Rappi
  y = drawSection7_ValueProp(doc, dataWithLogo, y, ctx)
  y += SP.section

  // Sección 6 — Próximos pasos
  y = drawSection9_NextSteps(doc, dataWithLogo, y, ctx)
  y += SP.section

  // Sección 7 — Firma del ejecutivo
  drawSection10_Signature(doc, dataWithLogo, y, ctx)

  // Guardar
  const restaurant = data.restaurantName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/g, '')
  const zone       = data.zoneMetrics.opsZone.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
  const dateStr    = data.generatedAt.toISOString().slice(0, 10)
  doc.save(`Propuesta_Rappi_${restaurant}_${zone}_${dateStr}.pdf`)
}
