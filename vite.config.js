import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'landing',
  server: {
    port: 5000,
    host: '0.0.0.0',
    strictPort: true
  },
  preview: {
    port: 5000,
    host: '0.0.0.0'
  }
})
