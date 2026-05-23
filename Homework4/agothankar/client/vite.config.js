import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const stockNewsRoot = path.resolve(projectRoot, 'data/stocknews')
const generatedNewsPath = path.resolve(projectRoot, 'data/stocknews.generated.json')

function getTitleFromFileName(fileName) {
  return fileName
    .replace(/\.txt$/i, '')
    .replace(/^\d{4}-\d{2}-\d{2} \d{2}-\d{2}_/, '')
    .trim()
}

function getDateFromFileName(fileName) {
  const match = fileName.match(/^(\d{4}-\d{2}-\d{2}) (\d{2})-(\d{2})_/)
  return match ? `${match[1]} ${match[2]}:${match[3]}` : ''
}

function parseNewsFile(content, fileName) {
  const normalizedContent = content.replace(/\r\n/g, '\n')
  const [metadataBlock, ...bodyBlocks] = normalizedContent.split(/\n\s*\n/)
  const metadata = {}

  metadataBlock.split('\n').forEach(line => {
    const match = line.match(/^([^:]+):\s*(.*)$/)
    if (!match) return

    metadata[match[1].trim().toLowerCase()] = match[2].trim()
  })

  return {
    title: metadata.title || getTitleFromFileName(fileName),
    date: metadata.date || getDateFromFileName(fileName),
    url: metadata.url || '',
    body: bodyBlocks.join('\n\n').trim(),
    fileName,
  }
}

async function buildStockNewsIndex() {
  const stockNews = {}

  try {
    const tickerEntries = await fs.readdir(stockNewsRoot, { withFileTypes: true })
    const tickerDirs = tickerEntries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()

    await Promise.all(tickerDirs.map(async ticker => {
      const tickerDir = path.join(stockNewsRoot, ticker)
      const entries = await fs.readdir(tickerDir, { withFileTypes: true })

      stockNews[ticker] = await Promise.all(
        entries
          .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.txt'))
          .sort((a, b) => b.name.localeCompare(a.name))
          .map(async entry => {
            const content = await fs.readFile(path.join(tickerDir, entry.name), 'utf8')
            return parseNewsFile(content, entry.name)
          })
      )
    }))
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }

  await fs.mkdir(path.dirname(generatedNewsPath), { recursive: true })
  await fs.writeFile(generatedNewsPath, JSON.stringify(stockNews, null, 2))
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
