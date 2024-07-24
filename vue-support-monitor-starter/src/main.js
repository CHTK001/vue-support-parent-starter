import "./input.css"
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
import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/lib/common'
import hljsVuePlugin from '@highlightjs/vue-plugin'
import socket from '@/config/socketio.js'
import {Terminal, configHighlight} from 'vue-web-terminal'
import hljs from 'highlight.js'
import java from 'highlight.js/lib/languages/java'
import 'highlight.js/styles/tomorrow-night-bright.css'
hljs.registerLanguage('java', java)
import DataVVue3 from '@kjgl77/datav-vue3'
import JsonViewer from 'vue-json-viewer'
import 'vue-json-viewer/style.css'

const app = createApp(App);

import * as elIcons from '@element-plus/icons-vue'
import * as scIcons from '@/assets/icons'
//统一注册el-icon图标
for(let icon in elIcons){
  app.component(`ElIcon${icon}`, elIcons[icon])
}
//统一注册sc-icon图标
for(let icon in scIcons){
  app.component(`ScIcon${icon}`, scIcons[icon])
}

app.use(store)
.use(socket)
.use(JsonViewer)
.use(DataVVue3)
.use(hljsVuePlugin)
.use(Terminal, {highlight: true})
.use(router)
.use(VueClipBoard)
.use(ElementPlus)
.use(i18n)
.use(scui);
configHighlight(true)
  app.mount('#app')
  

