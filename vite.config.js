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
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000' },
      '/ws': { target: 'http://127.0.0.1:8000', ws: true },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
