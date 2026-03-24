declare module "*.svg?component" {
  import type { FunctionalComponent, SVGAttributes } from "vue";
  const component: FunctionalComponent<SVGAttributes>;
  export default component;
}

declare module "@repo/assets/svg/*.svg?component" {
  import type { FunctionalComponent, SVGAttributes } from "vue";
  const component: FunctionalComponent<SVGAttributes>;
  export default component;
}

declare module "@repo/components/ReSegmented" {
  import type { DefineComponent } from "vue";
  export interface OptionsType {
    label?: any;
    icon?: any;
    iconAttrs?: any;
    value?: any;
    disabled?: boolean;
    tip?: string;
  }
  const component: DefineComponent<Record<string, any>, any, any>;
  export default component;
}

declare module "@repo/components/ReSegmented/index" {
  import type { DefineComponent } from "vue";
  export interface OptionsType {
    label?: any;
    icon?: any;
    iconAttrs?: any;
    value?: any;
    disabled?: boolean;
    tip?: string;
  }
  const component: DefineComponent<Record<string, any>, any, any>;
  export default component;
}


