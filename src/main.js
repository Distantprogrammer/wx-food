import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import shareMixin from '@/mixins/shareMixin'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)
  // 所有页面支持微信原生分享（右上角转发 / 朋友圈）
  app.mixin(shareMixin)
  return { app }
}