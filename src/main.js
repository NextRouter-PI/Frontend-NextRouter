import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/css/global.css'
import './assets/css/theme.css'
import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component("svg-icon", SvgIcon)

app.mount('#app')




