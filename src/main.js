import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/inter'
import '@/styles/main.scss'

import App from '@/App.vue'
import BaseIcon from '@/components/ui/BaseIcon.vue'
import router from '@/router'
import { http } from '@/api/client'
import { retireLegacyCredentials, retireLegacyPwa } from './legacyPwa.js'

const app = createApp(App)
app.component('BaseIcon', BaseIcon)

// Uma troca de conta em outra aba descarta também os dados privados das telas antigas.
http.events.addEventListener('external-changed', () => window.location.reload())
http.events.addEventListener('expired', () => {
  if (router.currentRoute.value.meta.requiresAuth) window.location.replace('/login')
})

async function start() {
  try {
    try {
      retireLegacyCredentials(window.localStorage)
      retireLegacyCredentials(window.sessionStorage)
    } catch { /* Nem o acesso ao storage é obrigatório para iniciar. */ }
    if (await retireLegacyPwa()) {
      window.location.reload()
      return
    }
    app.use(createPinia())
    app.use(router)
    app.mount('#app')
    await router.isReady()
  } catch {
    document.querySelector('#app').textContent = 'Não foi possível iniciar com segurança. Feche as abas antigas, limpe os dados deste site e recarregue.'
  }
}

start()
