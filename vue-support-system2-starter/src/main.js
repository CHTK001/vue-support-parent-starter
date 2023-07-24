import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'
import scui from './scui'
import i18n from './locales'
import router from './router'
import store from './store'
import App from './App.vue'
import 'viewerjs/dist/viewer.css'
import VueViewer from 'v-viewer'

const app = createApp(App);

app.use(store)
    .use(router)
    .use(ElementPlus)
    .use(i18n)
    .use(VueViewer, {
        defaultOptions: {
          zIndex: 9999
        }
      })
    .use(scui);

//挂载app
app.mount('#app');
