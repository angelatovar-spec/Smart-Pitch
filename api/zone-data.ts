import path from 'path'
import fs from 'fs'
import Papa from 'papaparse'
import type { IncomingMessage, ServerResponse } from 'http'

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'Data_zones.csv')
    const content  = fs.readFileSync(filePath, 'utf-8')

    const parsed = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
    })

    const data = parsed.data
      .map((row) => {
        const out: Record<string, string | number> = {}
        for (const [k, v] of Object.entries(row)) {
          const trimmed = v.trim()
          const n = Number(trimmed)
          out[k] = trimmed === '' || isNaN(n) ? trimmed : n
        }
        return out
      })
      .filter((r) => r['OPS_ZONE'])

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(JSON.stringify({ data, updatedAt: new Date().toISOString() }))
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: String(err) }))
  }
}
