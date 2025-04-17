import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Определение __dirname в ES модулях
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production';
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000/api';
  const serverPort = parseInt(env.VITE_SERVER_PORT || '5000', 10);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@features': resolve(__dirname, 'src/features'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@api': resolve(__dirname, 'src/api'),
        '@store': resolve(__dirname, 'src/store'),
        '@types': resolve(__dirname, 'src/types'),
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      cors: true,
      hmr: {
        overlay: true,
      },
      proxy: {
        '/api': {
          target: `http://localhost:${serverPort}`,
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
      // Улучшенные настройки сборки
      chunkSizeWarningLimit: 1000, // Увеличиваем лимит предупреждения о размере чанка
      reportCompressedSize: false, // Отключаем отчет о сжатом размере для ускорения сборки
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Более детальное разделение на чанки
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('scheduler') || id.includes('prop-types')) {
                return 'react-vendor';
              }
              if (id.includes('fortawesome') || id.includes('tailwind')) {
                return 'ui-vendor';
              }
              if (id.includes('zustand') || id.includes('axios')) {
                return 'data-vendor';
              }
              // Прочие зависимости
              return 'vendor';
            }
          }
        }
      }
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
        'axios',
        '@fortawesome/react-fontawesome',
        '@fortawesome/free-solid-svg-icons'
      ]
    },
    preview: {
      port: 5173,
      host: '0.0.0.0',
    },
    // Добавляем информацию о сборке
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV_MODE__: !isProd
    }
  }
})
