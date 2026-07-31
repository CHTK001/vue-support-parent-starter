/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module "*.yaml" {
  const value: Record<string, unknown>;
  export default value;
}

declare module "element-plus/dist/locale/zh-cn.mjs" {
  const zhCn: { name: string; el: Record<string, string> };
  export default zhCn;
}
