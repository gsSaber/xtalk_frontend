import * as Pinia from 'pinia'
import uviewPlus from 'uview-plus'
import { createSSRApp } from 'vue'
import App from './App.vue'
import store from './stores/index'

export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  app.use(uviewPlus)
  return {
    app,
    Pinia,
  }
}
