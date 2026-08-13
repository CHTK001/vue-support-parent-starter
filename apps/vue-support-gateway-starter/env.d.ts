declare module "*.vue" {
  import type { DefineComponent } from "vue";
  //@ts-ignore
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "*.scss" {
  const scss: Record<string, string>;
  export default scss;
}

declare module "sortablejs" {
  import Sortable from "sortablejs";
  export default Sortable;
}
