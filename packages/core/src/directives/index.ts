/**
 * 通用指令集（@repo/core）
 *
 * 汇总通用 Vue 指令：
 *  - 权限指令：v-admin / v-superadmin / v-role / v-perm / v-menu
 *  - 通用指令：v-auth / v-waterMarker / v-draggable / v-debounce / v-throttle / v-copy 等
 * 供各主题 / 应用注册使用。
 */
import type { App } from "vue";
import auth from "./auth";
import waterMarker, { applyGlobalWatermark } from "./waterMarker";
import draggable from "./draggable";
import debounce from "./debounce";
import debounceInput from "./debounceInput";
import throttle from "./throttle";
import throttleInput from "./throttleInput";
import adaptive from "./adaptive";
import copy from "./copy";
import { setupPermissionDirectives } from "./permission";
import { vDebounce, vThrottle } from "./vDebounce";

const commonDirectives: Record<string, any> = {
  auth,
  waterMarker,
  draggable,
  debounce,
  debounceInput,
  throttle,
  throttleInput,
  adaptive,
  copy,
  vDebounce,
  vThrottle,
};

/** 注册全部通用指令 + 权限指令 */
export function setupCommonDirectives(app: App): void {
  Object.keys(commonDirectives).forEach((key) => {
    app.directive(key, commonDirectives[key]);
  });
  setupPermissionDirectives(app);
}

/** 指令插件（app.use 用） */
export default {
  install(app: App) {
    setupCommonDirectives(app);
  },
};

export * from "./permission";
export { applyGlobalWatermark } from "./waterMarker";
