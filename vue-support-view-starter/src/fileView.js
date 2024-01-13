import './assets/main.css'

import { createApp } from 'vue'
import App from './views/FileView.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'
import http from "@/utils/request"
import tool from '@/utils/tool'
import FileViewer from 'file-viewer3'

const app = createApp(App)
app.config.globalProperties.$TOOL = tool;

app.use(router)
.use(FileViewer)
  .use(ElementPlus)

app.mount('#app')
