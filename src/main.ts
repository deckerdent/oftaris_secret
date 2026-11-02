import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@awesome.me/webawesome/dist/components/page/page.js'
import '@awesome.me/webawesome/dist/components/icon/icon.js'
import '@awesome.me/webawesome/dist/components/dropdown/dropdown.js'
import '@awesome.me/webawesome/dist/components/badge/badge.js'

import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { applySystemTheme } from './theme'
import { useAuthStore } from './stores/auth'

applySystemTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')

void useAuthStore().initialize()
