import App from "./App.vue";
// 最优先导入全局配置，确保在其他代码执行前就加载
import "@/components/AntdConfig";
import { getPlatformConfig, injectResponsiveStorage, useI18n } from "@repo/config";
import { router, setupStore } from "@repo/core";
import { MotionPlugin } from "@vueuse/motion";
// import { useEcharts } from "@/plugins/echarts";
import { createApp, type Directive } from "vue";
import { useElementPlus } from "@repo/plugins";
import techUILite from "techui-vue3-lite";
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
import { setupDirectives } from "./directives";
// 导入 Ant Design Vue
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css";
// 导入 Ant Design Vue 图标
import * as AntIcons from "@ant-design/icons-vue";
// 导入全局方法插件
import IconPlugin from "./components/Icon";
// 导入Ant Design Vue全局配置
import setupAntdConfig from "./components/AntdConfig";

// 全局注册 components 文件夹下的所有组件
const modules = import.meta.glob("./components/**/index.vue", { eager: true });
const components: Record<string, any> = {};

Object.keys(modules).forEach((key) => {
  const componentName = key.split("/").slice(-2, -1)[0];
  components[componentName] = (modules[key] as any).default;
});

const app = createApp(App);

Object.keys(directives).forEach((key) => {
  app.directive(key, (directives as { [key: string]: Directive })[key]);
});

app.component("IconifyIconOffline", IconifyIconOffline);
app.component("IconifyIconOnline", IconifyIconOnline);
app.component("FontIcon", FontIcon);

app.component("Auth", Auth);
app.component("ScTable", ScTable);

// 全局注册 Ant Design Vue 的图标组件
Object.keys(AntIcons).forEach((key) => {
  app.component(key, AntIcons[key]);
});

// 全局注册 components 文件夹下的所有组件
Object.keys(components).forEach((key) => {
  // 组件名转换为驼峰式命名，首字母大写
  const componentName = key.replace(/-(\w)/g, (_, c) => c.toUpperCase()).replace(/^\w/, (c) => c.toUpperCase());
  app.component(componentName, components[key]);
});

app.use(VueTippy);
// 使用 Ant Design Vue
app.use(Antd);
// 注册全局方法
app.use(IconPlugin);
// 使用Ant Design Vue全局配置
app.use(setupAntdConfig);

// 注册指令
setupDirectives(app);

techUILite(app).then(() => {
  getPlatformConfig(app).then(async (config) => {
    setupStore(app);
    app.use(router);
    await router.isReady();
    injectResponsiveStorage(app, config);
    app.use(MotionPlugin).use(useI18n).use(useElementPlus).use(Table);
    // .use(PureDescriptions)
    // .use(useEcharts);
    app.mount("#app");
  });
});
