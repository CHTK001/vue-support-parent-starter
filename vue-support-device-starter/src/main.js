import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'
import scui from './scui'
import i18n from './locales'
import router from './router'
import store from './store'
import App from './App.vue'
import VueClipBoard from 'vue-clipboard2'
import 'highlight.js/lib/common'
import java from 'highlight.js/lib/languages/java'
import hljs from 'highlight.js'
import hljsVuePlugin from '@highlightjs/vue-plugin'
import vuePlugin from "@highlightjs/vue-plugin"
import "./input.css"

const app = createApp(App);
hljs.registerLanguage('java', java)
app.use(store)
    .use(vuePlugin)
    .use(hljsVuePlugin)
    .use(router)
    .use(VueClipBoard)
    .use(ElementPlus)
    .use(i18n)
    .use(scui);

//挂载app
app.mount('#app');
