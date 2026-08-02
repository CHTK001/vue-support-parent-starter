/**
 * ReBreadcrumb —— 面包屑导航组件
 *
 * 支持自定义分隔符、图标、跳转
 *   <ReBreadcrumb :items="[{ label: '首页', href: '/' }, { label: '详情' }]" />
 */
import type { App, Plugin } from "vue";
import ReBreadcrumb from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReBreadcrumb", ReBreadcrumb);
  },
};

export { plugin as install };
export default ReBreadcrumb;
export type { BreadcrumbItem } from "./types";