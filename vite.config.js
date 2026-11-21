import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

function resolveVendorChunk(id) {
  if (!id.includes('node_modules')) return undefined
  if (id.includes('maplibre-gl')) return 'vendor-maplibre'
  if (id.includes('/leaflet/')) return 'vendor-leaflet'
  if (id.includes('/chart.js/') || id.includes('/vue-chartjs/')) return 'vendor-charts'
  if (id.includes('/axios/')) return 'vendor-http'
  if (id.includes('/vue/') || id.includes('/@vue/') || id.includes('/vue-router/') || id.includes('/pinia/')) {
    return 'vendor-vue'
  }
  return undefined
}

const tauriDevHost = process.env.TAURI_DEV_HOST
const isTauriEnv = Boolean(process.env.TAURI_ENV_PLATFORM)

export default defineConfig(({ command }) => ({
  base: '/',
  // Somente assets importados, emitidos com hash em /assets/. PWA fica adiada.
  publicDir: false,
  clearScreen: !isTauriEnv,
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  plugins: [vue(), ...(command === 'serve' ? [vueDevTools()] : [])],
  server: {
    host: tauriDevHost || '127.0.0.1',
    port: 5173,
    strictPort: true,
    hmr: tauriDevHost ? { protocol: 'ws', host: tauriDevHost, port: 5174 } : undefined,
    proxy: {
      // Preservar Host e Origin mantém os checks de CSRF e WebSocket no Django.
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: false },
      '/ws': { target: 'http://127.0.0.1:8000', changeOrigin: false, ws: true },
      '/media': { target: 'http://127.0.0.1:8000', changeOrigin: false },
    },
  },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: ['es2022', 'chrome107', 'safari15.4'],
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: resolveVendorChunk,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use '@/styles/abstracts' as *;\n`,
      },
    },
  },
}))
