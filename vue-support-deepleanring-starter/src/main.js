import {createApp} from 'vue'
import App from './App.vue'
import VueClipBoard from 'vue-clipboard2'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from '@/router'
import {Base64} from 'js-base64'

let app = createApp(App);
app.prototype = {};
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
app
    .use(Base64)
    .use(router)
    .use(VueClipBoard)
    .use(ElementPlus, {locale: zhCn})
    .mount('#app')