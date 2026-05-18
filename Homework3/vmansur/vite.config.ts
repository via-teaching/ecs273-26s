import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react"
          }

          if (id.includes("node_modules/d3")) {
            return "d3"
          }

          const newsTickerMatch = id.match(/[\\/]data[\\/]stocknews[\\/]([^\\/]+)[\\/]/i)
          if (newsTickerMatch?.[1]) {
            return `news-${newsTickerMatch[1].toUpperCase()}`
          }

          return undefined
        },
      },
    },
  },
})
