/**
 * Minimal static server for the production build (dist/).
 * Serves the app under /intergalactic-cable/ (matching the GitHub Pages
 * subpath) and redirects / to it, so bare preview URLs just work.
 * Not part of the deployed site — GitHub Pages serves dist/ directly.
 */

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const ROOT = new URL('./dist/', import.meta.url).pathname
const BASE = '/intergalactic-cable/'
const PORT = 4173

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const server = createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0].split('#')[0])

    if (url === '/' || url === '') {
      res.writeHead(302, { Location: BASE })
      res.end()
      return
    }
    if (!url.startsWith(BASE)) {
      res.writeHead(302, { Location: BASE })
      res.end()
      return
    }

    let rel = url.slice(BASE.length)
    if (rel === '' || rel.endsWith('/')) rel += 'index.html'

    const filePath = normalize(join(ROOT, rel))
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403)
      res.end('Forbidden')
      return
    }

    const s = await stat(filePath).catch(() => null)
    if (!s?.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
      return
    }
    const body = await readFile(filePath)
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    })
    res.end(body)
  } catch {
    res.writeHead(500)
    res.end('Server error')
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Intergalactic Cable preview: http://0.0.0.0:${PORT}${BASE}`)
})
