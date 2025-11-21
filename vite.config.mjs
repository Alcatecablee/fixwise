import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'landing',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './landing/src'),
    },
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        // Ensure request body stream is properly forwarded
        proxyTimeout: 60000,
        timeout: 60000,
        // Don't buffer bodies
        onProxyReq: (proxyReq, req) => {
          if (req.method === 'POST' || req.method === 'PUT') {
            // Set content length if available
            if (req.headers['content-length']) {
              proxyReq.setHeader('content-length', req.headers['content-length']);
            }
          }
        }
      },
    },
  },
  preview: {
    port: 5000,
    host: '0.0.0.0'
  }
})
