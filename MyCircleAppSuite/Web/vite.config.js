import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('three') || id.includes('@react-three')) return 'three';
          if (id.includes('leaflet')) return 'maps';
          if (id.includes('axios') || id.includes('socket.io-client')) return 'network';

          return 'vendor';
        },
      },
    },
  },
})
