/**
 * Dev-only location hub: stores pins in .data/user-locations.json
 * so the localhost dashboard works without waiting on Firestore rules.
 */
import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

type Pin = {
  userId: string
  email?: string
  name?: string
  latitude: number
  longitude: number
  cityLabel: string
  purpose: string
  updatedAt: string
}

function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export function elafLocationHubPlugin(rootDir: string): Plugin {
  const dataDir = path.join(rootDir, '.data')
  const dataFile = path.join(dataDir, 'user-locations.json')

  function loadPins(): Pin[] {
    try {
      if (!fs.existsSync(dataFile)) return []
      const raw = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
      return Array.isArray(raw) ? raw : []
    } catch {
      return []
    }
  }

  function savePins(pins: Pin[]) {
    fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(dataFile, JSON.stringify(pins, null, 2), 'utf8')
  }

  return {
    name: 'elaf-location-hub',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || '').split('?')[0]
        if (url !== '/api/user-locations') return next()

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ pins: loadPins() }))
          return
        }

        if (req.method === 'POST') {
          try {
            const body = JSON.parse(await readBody(req)) as Partial<Pin>
            if (
              !body.userId ||
              typeof body.latitude !== 'number' ||
              typeof body.longitude !== 'number'
            ) {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: 'invalid pin' }))
              return
            }
            const pin: Pin = {
              userId: String(body.userId),
              email: body.email ? String(body.email) : undefined,
              name: body.name ? String(body.name) : undefined,
              latitude: body.latitude,
              longitude: body.longitude,
              cityLabel: String(body.cityLabel || ''),
              purpose: 'nearby_mosques',
              updatedAt: new Date().toISOString(),
            }
            const pins = loadPins().filter((p) => p.userId !== pin.userId)
            pins.unshift(pin)
            savePins(pins)
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
          return
        }

        next()
      })
    },
  }
}
