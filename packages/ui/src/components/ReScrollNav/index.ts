/**
 * ReScrollNav —— 横向滚动导航壳层（按主题加载）
 */
import { defineThemeComponent } from "../../theme";
import type { ReScrollNavExpose } from "./types";

const themed = defineThemeComponent("ReScrollNav", {
  default: () => import("./theme/default/ReScrollNav.vue"),
  koi: () => import("./theme/koi/ReScrollNav.vue"),
});

export const component = themed.component;
export { themed as install };
export type { ReScrollNavExpose };
export default component;
