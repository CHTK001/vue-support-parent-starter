/// <reference types="vite/client" />

declare module "vxe-pc-ui/es/tooltip";

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
