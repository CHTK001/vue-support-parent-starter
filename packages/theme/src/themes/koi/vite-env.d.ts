/// <reference types="vite/client" />

/** Vue 单文件组件模块声明（无 vite 环境纯 TS 校验时兜底） */
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

/** element-plus 中文语言包声明（纯 TS 校验时兜底） */
declare module "element-plus/dist/locale/zh-cn.mjs" {
  const zhCn: { name: string; el: Record<string, string> };
  export default zhCn;
}

/** 静态资源模块声明 */
declare module "*.png";
declare module "*.webp";
declare module "*.svg";
declare module "*.woff2";
declare module "*.json";
