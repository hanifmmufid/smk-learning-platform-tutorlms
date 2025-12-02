import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3006,
    strictPort: true,
    host: true,
    allowedHosts: [
      'localhost',
      'smk.hanifmufid.com',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
