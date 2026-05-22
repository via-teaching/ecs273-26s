import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      "/stock_list": "http://localhost:8000",
      "/stock": "http://localhost:8000",
      "/stocknews": "http://localhost:8000",
      "/tsne": "http://localhost:8000",
    },
  },
})
