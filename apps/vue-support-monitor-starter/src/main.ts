import { createApp, type Directive } from "vue";
import Table from "@pureadmin/table";
import { getPlatformConfig, injectResponsiveStorage, useI18n } from "@repo/config";
import { router, setupStore } from "@repo/core";
import { useElementPlus } from "@repo/plugins";
import { MotionPlugin } from "@vueuse/motion";
import App from "./App.vue";
// 引入重置样式
import "@/styles/threshold.scss";
import "@repo/assets/iconfont/iconfont.css";
import "@repo/assets/iconfont/iconfont.js";
import "@repo/assets/style/layout/default/index.scss";
import "@repo/assets/style/layout/default/reset.scss";
import "@repo/assets/style/layout/default/tailwind.css";
import "element-plus/dist/index.css";
//@ts-ignore
import { Auth } from "@repo/components/ReAuth";
import { FontIcon, IconifyIconOffline, IconifyIconOnline } from "@repo/components/ReIcon";
import ScTable from "@repo/components/ScTable/index.vue";
import * as directives from "@repo/core/directives";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import ElementPlusX from "vue-element-plus-x";
import VueTippy from "vue-tippy";
import setupAntdConfig from "./components/AntdConfig";
import IconPlugin from "./components/Icon";
import { setupDirectives } from "./directives";
import { setupFullscreenSocket } from "./plugins/fullscreenSocket";
import GlobalSocketPlugin from "./plugins/globalSocket";

const app = createApp(App);
Object.keys(directives).forEach((key) => {
  app.directive(key, (directives as { [key: string]: Directive })[key]);
});
app.component("IconifyIconOffline", IconifyIconOffline);
app.component("IconifyIconOnline", IconifyIconOnline);
app.component("FontIcon", FontIcon);

app.component("Auth", Auth);
app.component("ScTable", ScTable);

app.use(VueTippy);
// 注册全局方法
app.use(IconPlugin);
// 使用Ant Design Vue全局配置
app.use(setupAntdConfig);
// 使用 ElementPlusX
app.use(ElementPlusX);

app.config.warnHandler = (msg, instance, trace) => {
  if (msg.includes("__proxyIdCheat__")) return;
  console.warn(msg, trace);
};
// 注册指令
setupDirectives(app);

getPlatformConfig(app).then(async (config) => {
  setupStore(app);
  app.use(router);
  await router.isReady();
  injectResponsiveStorage(app, config);
  app.use(MotionPlugin).use(useI18n).use(useElementPlus).use(Table);
  // .use(PureDescriptions)
  // .use(useEcharts);

  app.use(GlobalSocketPlugin);
  setupFullscreenSocket(router);
  app.mount("#app");
});
