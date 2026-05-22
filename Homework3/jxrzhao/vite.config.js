import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function newsDataPlugin() {
  const virtualId = 'virtual:news-data'
  const resolvedId = '\0' + virtualId

  return {
    name: 'news-data',
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (id !== resolvedId) return
      const newsDir = path.resolve(__dirname, 'data/stocknews')
      const result = {}
      for (const ticker of fs.readdirSync(newsDir)) {
        const tickerDir = path.join(newsDir, ticker)
        if (!fs.statSync(tickerDir).isDirectory()) continue
        result[ticker] = []
        for (const file of fs.readdirSync(tickerDir)) {
          if (!file.endsWith('.txt')) continue
          const raw = fs.readFileSync(path.join(tickerDir, file), 'utf-8')
          const titleMatch = raw.match(/^Title:\s*(.+)$/m)
          const dateMatch = raw.match(/^Date:\s*(.+)$/m)
          const contentStart = raw.indexOf('Content:\n')
          result[ticker].push({
            title: titleMatch ? titleMatch[1].trim() : 'Untitled',
            date: dateMatch ? dateMatch[1].trim() : 'Unknown date',
            content: contentStart !== -1
              ? raw.slice(contentStart + 'Content:\n'.length).trim()
              : raw,
          })
        }
        result[ticker].sort((a, b) => b.date.localeCompare(a.date))
      }
      return `export default ${JSON.stringify(result)}`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    newsDataPlugin(),
  ],
})
