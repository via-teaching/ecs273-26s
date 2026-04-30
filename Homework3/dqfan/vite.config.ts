// @ts-nocheck
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const stockNewsModuleId = 'virtual:stock-news'
const resolvedStockNewsModuleId = `\0${stockNewsModuleId}`

function stockNewsPlugin(): Plugin {
  return {
    name: 'stock-news-loader',
    resolveId(id) {
      if (id === stockNewsModuleId) {
        return resolvedStockNewsModuleId
      }
    },
    load(id) {
      if (id !== resolvedStockNewsModuleId) {
        return
      }

      const newsRoot = path.join(__dirname, 'data', 'stocknews')
      const files = readNewsFiles(newsRoot)

      return `export default ${JSON.stringify(files)}`
    },
  }
}

function readNewsFiles(newsRoot: string) {
  const files: Array<{ path: string; content: string }> = []

  for (const ticker of fs.readdirSync(newsRoot)) {
    const tickerDir = path.join(newsRoot, ticker)
    if (!fs.statSync(tickerDir).isDirectory()) {
      continue
    }

    for (const fileName of fs.readdirSync(tickerDir)) {
      if (!fileName.endsWith('.txt')) {
        continue
      }

      const filePath = path.join(tickerDir, fileName)
      files.push({
        path: `../../data/stocknews/${ticker}/${fileName}`,
        content: fs.readFileSync(filePath, 'utf-8'),
      })
    }
  }

  return files
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    stockNewsPlugin(),
    react(), 
    tailwindcss()
  ],
})
