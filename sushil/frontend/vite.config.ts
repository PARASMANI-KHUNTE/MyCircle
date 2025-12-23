import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    host: true,            // allow external access (Render)
    allowedHosts: 'all'    // prevent "Blocked request" error
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
})
