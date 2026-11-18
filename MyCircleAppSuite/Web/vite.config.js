import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: true,
      // Ensure WebSocket connection for HMR works reliably
      protocol: 'ws',
      host: 'localhost',
    },
    // Prevent port conflicts causing full reloads
    port: 5173,
    strictPort: false,
  },
  // Optimize deps to prevent re-optimization on config change
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'socket.io-client',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('leaflet')) return 'maps';
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('three') || id.includes('@react-three')) return 'three';
          if (id.includes('axios') || id.includes('socket.io-client')) return 'network';

          return 'vendor';
        },
      },
    },
  },
})
