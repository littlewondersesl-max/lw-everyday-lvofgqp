import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer as createViteServer } from 'vite'
import { attachGameSockets } from './sockets'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const port = Number(process.env.PORT || 43123)
const dev = process.env.NODE_ENV !== 'production'

const httpServer = http.createServer()
const sockets = attachGameSockets(httpServer)

if (dev) {
  const vite = await createViteServer({
    root,
    server: { middlewareMode: true, hmr: { server: httpServer, path: '/vite-hmr' } },
    appType: 'spa',
  })
  httpServer.on('request', (req, res) => {
    vite.middlewares(req, res, () => {
      res.statusCode = 404
      res.end('Not found')
    })
  })
} else {
  const dist = path.join(root, 'dist')
  httpServer.on('request', (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost')
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '')
    const file = path.normalize(path.join(dist, rel))
    if (!file.startsWith(dist)) {
      res.statusCode = 403
      res.end()
      return
    }
    const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(dist, 'index.html')
    const ext = path.extname(target)
    const types: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.json': 'application/json',
    }
    res.setHeader('content-type', types[ext] || 'application/octet-stream')
    fs.createReadStream(target).pipe(res)
  })
}

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Pip is ready at http://127.0.0.1:${port}`)
})

process.on('SIGINT', () => {
  sockets.close()
  httpServer.close()
})
