import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  base: '/',
  // Somente assets importados, emitidos com hash em /assets/. PWA fica adiada.
  publicDir: false,
  plugins: [vue(), vueDevTools()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
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
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use '@/styles/abstracts' as *;\n`,
      },
    },
  },
})
