import { createSSRApp } from 'vue'
import App from './App.vue'
import { store } from './store'

import tmUi from './uni_modules/tm-ui'
import uviewPlus from 'uview-plus'
import '@/assets/style/index.css'

export function createApp() {
  const app = createSSRApp(App)

  app.use(store)
  app.use(uviewPlus)
  app.use(tmUi)

  return {
    app,
    store,
  }
}
