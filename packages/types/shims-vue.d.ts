declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "*.scss" {
  const scss: Record<string, string>;
  export default scss;
}

declare interface Window {
  $uu: any;
  console: any;
  location: any;
}

declare interface Console {
  firebug: any;
  profiles: any;
  table: Function;
}

export { Window, Console };
