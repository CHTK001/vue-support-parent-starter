// Ambient module declarations for dynamic imports and missing packages
declare module "@repo/theme/koi/framework" {
  import type { App } from "vue";
  export function installKoi(app: App): Promise<void>;
  const _default: (app: App) => void;
  export default _default;
}
declare module "@repo/ui/components/ReDialog/theme/koi/ReDialog" {
  import type { DefineComponent } from "vue";
  const ReDialog: DefineComponent;
  export default ReDialog;
}
declare module "@repo/ui/components/ReSelect/theme/koi/ReSelect" {
  import type { DefineComponent } from "vue";
  const ReSelect: DefineComponent;
  export default ReSelect;
}
declare module "@repo/utils/sse" {
  export * from "@repo/utils/sse";
}
declare module "@repo/pinia" {
  export * from "@repo/pinia/src";
}
declare module "@repo/utils/types" {
  export * from "@repo/utils/src/types";
}
