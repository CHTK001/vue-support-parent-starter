import App from "./App.vue";
import { getPlatformConfig, injectResponsiveStorage, useI18n } from "@repo/config";
import { router, setupStore } from "@repo/core";
import { MotionPlugin } from "@vueuse/motion";
// import { useEcharts } from "@/plugins/echarts";
import { createApp, type Directive } from "vue";
import { useElementPlus } from "@repo/plugins";
import Table from "@pureadmin/table";
// import PureDescriptions from "@pureadmin/descriptions";
// 引入重置样式
import "@repo/assets/style/layout/default/reset.scss";
// 一定要在main.ts中导入tailwind.css，防止vite每次hmr都会请求src/style/index.scss整体css文件导致热更新慢的问题
import "@repo/assets/style/layout/default/tailwind.css";
import "element-plus/dist/index.css";
// 导入字体图标
import "@repo/assets/iconfont/iconfont.js";
import "@repo/assets/iconfont/iconfont.css";
// 导入公共样式
import "@repo/assets/style/layout/default/index.scss";
import "@repo/assets/style/modern-page.scss";
// 自定义指令
//@ts-ignore
import * as directives from "@repo/core/directives";
// 全局注册@iconify/vue图标库
import { FontIcon, IconifyIconOffline, IconifyIconOnline } from "@repo/components/ReIcon";
// 全局注册按钮级别权限组件
import { Auth } from "@repo/components/ReAuth";
import ScTable from "@repo/components/ScTable/index.vue";
// 全局注册vue-tippy
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import VueTippy from "vue-tippy";

const app = createApp(App);

Object.keys(directives).forEach(key => {
  app.directive(key, (directives as { [key: string]: Directive })[key]);
});

app.component("IconifyIconOffline", IconifyIconOffline);
app.component("IconifyIconOnline", IconifyIconOnline);
app.component("FontIcon", FontIcon);

app.component("Auth", Auth);
app.component("ScTable", ScTable);

app.use(VueTippy);

getPlatformConfig(app).then(async config => {
  setupStore(app);
  app.use(router);
  await router.isReady();
  console.log("Router initialized:", router); // 构建后查看控制台输出
  injectResponsiveStorage(app, config);
  app.use(MotionPlugin).use(useI18n).use(useElementPlus).use(Table);
  // .use(PureDescriptions)
  // .use(useEcharts);
  app.mount("#app");
});
