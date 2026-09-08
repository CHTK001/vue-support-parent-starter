// Ambient module declarations for dynamic imports and missing packages
declare module "@repo/theme/koi/framework" {
  import type { App } from "vue";
  export default function install(app: App): void;
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
