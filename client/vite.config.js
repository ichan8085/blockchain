import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const parts = id.toString().split('node_modules/');
            if (parts[1]) {
              // Mengambil nama folder utama library (contoh: 'react', 'lodash')
              return parts[1].split('/')[0].toString();
            }
          }
        },
      },
    },
  },
})
