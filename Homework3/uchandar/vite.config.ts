import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'news-files',
      configureServer(server) {
        server.middlewares.use('/api/news-files', (req, res) => {
          const ticker = req.url?.replace(/^\//, '')
          if (!ticker) { res.statusCode = 400; res.end('[]'); return; }

          try {
            const files = readdirSync(join('public/data/stocknews', ticker)).sort()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(files))
          } catch {
            res.statusCode = 404
            res.end('[]')
          }
        })

        server.middlewares.use('/api/news-body', (req, res) => {
          const [ticker, ...rest] = (req.url?.replace(/^\//, '') ?? '').split('/')
          const filename = decodeURIComponent(rest.join('/'))
          if (!ticker || !filename) { res.statusCode = 400; res.end(''); return; }

          try {
            const body = readFileSync(join('public/data/stocknews', ticker, filename), 'utf-8')
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.end(body)
          } catch {
            res.statusCode = 404
            res.end('')
          }
        })
      }
    }
  ],
})
