import "./input.css"
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'
import scui from './scui'
import i18n from './locales'
import router from './router'
import store from './store'
import App from './Monitor.vue'
import VueClipBoard from 'vue-clipboard2'
import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/lib/common'
import hljsVuePlugin from '@highlightjs/vue-plugin'
import socket from '@/config/socketio.js'

const app = createApp(App);
app.use(store)
.use(socket)
.use(hljsVuePlugin)
.use(router)
.use(VueClipBoard)
.use(ElementPlus)
.use(i18n)
.use(scui);

//挂载app
app.mount('#app');