import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'
import scui from './scui'
import i18n from './locales'
import router from './router'
import store from './store'
import App from './App.vue'

const app = createApp(App);

app.use(store)
    .use(router)
    .use(ElementPlus)
    .use(i18n)
    .use(scui);

//挂载app
app.mount('#app');
