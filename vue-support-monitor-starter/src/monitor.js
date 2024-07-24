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
import {Terminal, configHighlight} from 'vue-web-terminal'
import hljs from 'highlight.js'
import java from 'highlight.js/lib/languages/java'
import 'highlight.js/styles/tomorrow-night-bright.css'
hljs.registerLanguage('java', java)
import DataVVue3 from '@kjgl77/datav-vue3'
import * as echarts from 'echarts';
window.echarts=echarts;

import techUILite from "techui-vue3-lite"
import vue3api from '@/plugins/vue3api'
import common from '@/plugins/common'

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
.use(DataVVue3)
.use(hljsVuePlugin)
.use(Terminal, {highlight: true})
.use(router)
.use(VueClipBoard)
.use(ElementPlus)
.use(i18n)
.use(scui);
configHighlight(true)
//挂载app
techUILite(app).then(()=>{
    app.use(vue3api)
    app.use(common)
    app.mount('#app')
  })
  
