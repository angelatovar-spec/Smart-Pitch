import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Caches en memoria — se invalidan reiniciando el servidor de desarrollo ────
let cachedZoneData: { data: unknown[]; updatedAt: string } | null = null
let cachedDayData: Record<string, unknown[]> | null = null

// ── Normalización de días: CSV usa Mon/Tue/... → etiquetas españolas cortas ──
const DAY_NORM: Record<string, string> = {
  mon: 'lun', lunes:      'lun', monday:    'lun',
  tue: 'mar', martes:     'mar', tuesday:   'mar',
  wed: 'mié', miercoles:  'mié', miércoles: 'mié', wednesday: 'mié',
  thu: 'jue', jueves:     'jue', thursday:  'jue',
  fri: 'vie', viernes:    'vie', friday:    'vie',
  sat: 'sáb', sabado:     'sáb', sábado:    'sáb', saturday:  'sáb',
  sun: 'dom', domingo:    'dom', sunday:    'dom',
}

function normalizeDia(dia: string): string {
  return DAY_NORM[dia.toLowerCase().trim()] ?? dia.toLowerCase().trim()
}

export default defineConfig({
  plugins: [
    react(),
    // ── GET /api/zone-data ──────────────────────────────────────────────────
    {
      name: 'zone-data-api',
      configureServer(server) {
        server.middlewares.use('/api/zone-data', (_req, res) => {
          try {
            if (!cachedZoneData) {
              const csvPath = path.resolve(__dirname, 'data/Data_zones.csv')

              if (!fs.existsSync(csvPath)) {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'data/Data_zones.csv no encontrado' }))
                return
              }

              const csvContent = fs.readFileSync(csvPath, 'utf-8')
              const lines = csvContent.trim().split('\n')
              const headers = lines[0].split(',').map((h) => h.trim())

              const data = lines.slice(1).map((line) => {
                const values = line.split(',')
                const row: Record<string, string | number> = {}
                headers.forEach((h, i) => {
                  const raw = (values[i] ?? '').trim()
                  const num = Number(raw)
                  row[h] = isNaN(num) || raw === '' ? raw : num
                })
                return row
              }).filter((r) => r['OPS_ZONE'])

              cachedZoneData = { data, updatedAt: new Date().toISOString() }
            }

            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            })
            res.end(JSON.stringify(cachedZoneData))
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: String(err) }))
          }
        })
      },
    },
    // ── GET /api/day-data ───────────────────────────────────────────────────
    {
      name: 'day-data-api',
      configureServer(server) {
        server.middlewares.use('/api/day-data', (_req, res) => {
          try {
            if (!cachedDayData) {
              const csvPath = path.resolve(__dirname, 'data/venta_dia.csv')

              if (!fs.existsSync(csvPath)) {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'data/venta_dia.csv no encontrado' }))
                return
              }

              const csvContent = fs.readFileSync(csvPath, 'utf-8')
              const lines = csvContent.trim().split('\n')
              const headers = lines[0].split(',').map((h) => h.trim())

              // Índice: "OPS_ZONE_ID|BRAND_CATEGORY" → DayEntry[]
              const index: Record<string, unknown[]> = {}

              lines.slice(1).forEach((line) => {
                if (!line.trim()) return
                const values = line.split(',')
                const row: Record<string, string> = {}
                headers.forEach((h, i) => {
                  row[h] = (values[i] ?? '').trim()
                })

                const country = row['COUNTRY'] ?? ''
                const zoneId  = row['STORE_OP_ZONE_ID'] ?? ''
                const cat     = row['BRAND_CATEGORY'] ?? ''
                const diaRaw  = row['DIA_SEMANA'] ?? ''
                const ordenes = Number(row['ORDENES_TOTALES_DIA_AVG'])
                const gmv     = Number(row['GMV_DIA_AVG'])

                if (!country || !zoneId || !cat || !diaRaw) return

                const key = `${country}|${zoneId}|${cat}`
                if (!index[key]) index[key] = []

                index[key].push({
                  dia:     normalizeDia(diaRaw),
                  ordenes: isNaN(ordenes) ? 0 : ordenes,
                  gmv:     isNaN(gmv)     ? 0 : gmv,
                })
              })

              cachedDayData = index
            }

            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            })
            res.end(JSON.stringify(cachedDayData))
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: String(err) }))
          }
        })
      },
    },
  ],
  define: {
    global: 'globalThis',
  },
})
