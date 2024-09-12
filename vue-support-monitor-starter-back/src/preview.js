import "./input.css"
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'
import config from "@/config"
import api from '@/api'
import tool from '@/utils/tool'
import http from "@/utils/request"
import { permission, rolePermission } from '@/utils/permission'
import i18n from './locales'
import store from './store'
import App from './Preview.vue'
import auth from '@/directives/auth'
import auths from '@/directives/auths'
import authsAll from '@/directives/authsAll'
import role from '@/directives/role'
import time from '@/directives/time'
import copy from '@/directives/copy'
import VueVideoPlayer from '@videojs-player/vue'
import 'video.js/dist/video-js.css'

const app = createApp(App);
// import * as scIcons from '@/assets/icons'
// for(let icon in scIcons){
//   app.component(`ScIcon${icon}`, scIcons[icon])
// }
import Download  from '@assets/icons/Download.vue'
app.component(`ScIconDownload`, Download)

app.config.globalProperties.$CONFIG = config;
app.config.globalProperties.$TOOL = tool;
app.config.globalProperties.$HTTP = http;
app.config.globalProperties.$API = api;
app.config.globalProperties.$AUTH = permission;
app.config.globalProperties.$ROLE = rolePermission;
//注册全局指令
app.directive('auth', auth)
app.directive('auths', auths)
app.directive('auths-all', authsAll)
app.directive('role', role)
app.directive('time', time)
app.directive('copy', copy)
app.use(store)
.use(ElementPlus)
.use(VueVideoPlayer)
.use(i18n)
  app.mount('#app')
  

