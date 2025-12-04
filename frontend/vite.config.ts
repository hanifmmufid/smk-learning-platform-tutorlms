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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],

          // React Router
          'router': ['react-router-dom'],

          // UI & Animation libraries
          'ui-vendor': ['framer-motion', '@heroicons/react'],

          // State management & utilities
          'utils': ['zustand', 'axios'],
        },
      },
    },
    // Increase chunk size warning limit to 1000kb (from default 500kb)
    // This is acceptable for modern web apps with good caching strategy
    chunkSizeWarningLimit: 1000,

    // Enable minification with esbuild (faster than terser)
    minify: 'esbuild',
    // Remove console and debugger in production
    target: 'es2015',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'axios',
      'framer-motion',
      '@heroicons/react',
    ],
  },
})
