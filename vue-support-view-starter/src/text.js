import './assets/main.css'

import { createApp } from 'vue'
import App from './views/TextView.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'
import http from "@/utils/request"
import tool from '@/utils/tool'

/*黑色主题*/
// import 'highlight.js/styles/atom-one-dark.css';
/*白色主题*/
import 'highlight.js/styles/atom-one-light.css';
import hljs from 'highlight.js/lib/core';
// import javascript from 'highlight.js/lib/languages/javascript';
import hljsVuePlugin from "@highlightjs/vue-plugin";
// 批量引入常用语言库
import 'highlight.js/lib/common';

const app = createApp(App)
app.config.globalProperties.$TOOL = tool;
// 注意Vue2的directive是挂在Vue上的，Vue3中无法直接引入Vue但可以挂在app上
app.directive('highlight', function (el) {
  let highlight = el.querySelectorAll('pre code');
  highlight.forEach((block) => {
      // Deprecated as of 10.7.0. highlightBlock will be removed entirely in v12.0
      // Deprecated as of 10.7.0. Please use highlightElement now.
      hljs.highlightElement(block);
  })
});
app.use(router)
  .use(ElementPlus)
  .use(hljsVuePlugin)

app.mount('#app')
