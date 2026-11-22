import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

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
  publicDir: 'public',
  clearScreen: !isTauriEnv,
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.ico', 'icons/icon-192x192.png', 'icons/icon-512x512.png'],
      devOptions: { enabled: false },
      manifest: {
        id: '/',
        name: 'NextRouter',
        short_name: 'NextRouter',
        description:
          'Gestão de transporte escolar e universitário com acompanhamento de rotas em tempo real.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        theme_color: '#1c1c1e',
        background_color: '#fafafa',
        categories: ['navigation', 'travel', 'utilities'],
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Início',
            short_name: 'Início',
            description: 'Abrir painel principal do NextRouter',
            url: '/',
            icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Transporte',
            short_name: 'Transporte',
            description: 'Acompanhar viagens e rotas',
            url: '/transporte',
            icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Empresas',
            short_name: 'Empresas',
            description: 'Pesquisar empresas de transporte',
            url: '/empresas',
            icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/admin(\/|$)/,
          /^\/ws\//,
          /^\/media\//,
          /^\/static\//,
          /^\/uploads\//,
          /^\/downloads\//,
          /^\/private-documents\//,
          /^\/health\//,
          /^\/html-template-test(\/|$)/,
        ],
        runtimeCaching: [
          {
            // Nunca cachear API, admin, documentos privados ou mídia autenticada.
            urlPattern: ({ url }) =>
              /^\/(api|admin|ws|media|uploads|downloads|private-documents)(\/|$)/.test(url.pathname),
            handler: 'NetworkOnly',
          },
          {
            // Cache limitado apenas para tiles públicos de mapa (melhora uso móvel em deslocamento).
            urlPattern: ({ url }) =>
              /(^|\.)(tile\.openstreetmap\.org|basemaps\.cartocdn\.com|tiles\.openfreemap\.org)$/.test(
                url.hostname,
              ),
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-cache',
              expiration: {
                maxEntries: 250,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
    ...(command === 'serve' ? [vueDevTools()] : []),
  ],
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
