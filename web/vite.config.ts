import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(fileURLToPath(new URL('./src', import.meta.url))),
    },
  },
  server: {
    // Keeps /api same-origin in dev so the browser never issues a preflight,
    // which matters because the API only answers GET and POST.
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
})
