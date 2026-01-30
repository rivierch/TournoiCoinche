import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Configuration Vite pour le mode web uniquement (sans Electron)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
