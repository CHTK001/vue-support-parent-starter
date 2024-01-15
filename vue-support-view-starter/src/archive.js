import './assets/main.css'

import { createApp } from 'vue'
import App from './views/ArchiveView.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'
import http from "@/utils/request"
import tool from '@/utils/tool'
import JsonViewer from "vue3-json-viewer"
import "vue3-json-viewer/dist/index.css";

const app = createApp(App)
app.config.globalProperties.$TOOL = tool;

app.use(router)
  .use(JsonViewer)
  .use(ElementPlus)

app.mount('#app')
