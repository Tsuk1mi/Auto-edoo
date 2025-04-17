import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Определение __dirname в ES модулях
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      cors: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        }
      }
    },
    build: {
      outDir: 'dist',
      minify: isProd ? 'terser' : false,
      sourcemap: !isProd,
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@fortawesome/react-fontawesome', '@fortawesome/free-solid-svg-icons'],
            'data-vendor': ['zustand', 'axios']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'axios']
    },
    preview: {
      port: 5173,
      host: '0.0.0.0',
    }
  }
})
