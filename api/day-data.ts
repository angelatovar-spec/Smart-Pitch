import path from 'path'
import fs from 'fs'
import Papa from 'papaparse'
import type { IncomingMessage, ServerResponse } from 'http'

const DAY_NORM: Record<string, string> = {
  mon: 'lun', lunes: 'lun', monday: 'lun',
  tue: 'mar', martes: 'mar', tuesday: 'mar',
  wed: 'mié', miercoles: 'mié', 'miércoles': 'mié', wednesday: 'mié',
  thu: 'jue', jueves: 'jue', thursday: 'jue',
  fri: 'vie', viernes: 'vie', friday: 'vie',
  sat: 'sáb', sabado: 'sáb', 'sábado': 'sáb', saturday: 'sáb',
  sun: 'dom', domingo: 'dom', sunday: 'dom',
}

function normalizeDia(dia: string): string {
  return DAY_NORM[dia.toLowerCase().trim()] ?? dia.toLowerCase().trim()
}

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'venta_dia.csv')
    const content  = fs.readFileSync(filePath, 'utf-8')

    const parsed = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
    })

    // Índice: "COUNTRY|STORE_OP_ZONE_ID|BRAND_CATEGORY" → DayEntry[]
    const index: Record<string, unknown[]> = {}

    for (const row of parsed.data) {
      const country = (row['COUNTRY'] ?? '').trim()
      const zoneId  = (row['STORE_OP_ZONE_ID'] ?? '').trim()
      const cat     = (row['BRAND_CATEGORY'] ?? '').trim()
      const diaRaw  = (row['DIA_SEMANA'] ?? '').trim()
      const ordenes = Number(row['ORDENES_TOTALES_DIA_AVG'])
      const gmv     = Number(row['GMV_DIA_AVG'])

      if (!country || !zoneId || !cat || !diaRaw) continue

      const key = `${country}|${zoneId}|${cat}`
      if (!index[key]) index[key] = []

      index[key].push({
        dia:     normalizeDia(diaRaw),
        ordenes: isNaN(ordenes) ? 0 : ordenes,
        gmv:     isNaN(gmv)     ? 0 : gmv,
      })
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(JSON.stringify(index))
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: String(err) }))
  }
}
