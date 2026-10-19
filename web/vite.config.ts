import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Keeps /api same-origin in dev so the browser never issues a preflight,
    // which matters because the API only answers GET and POST.
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
})
