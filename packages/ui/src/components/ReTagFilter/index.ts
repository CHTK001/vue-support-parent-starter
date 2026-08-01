/**
 * ReTagFilter —— 多组筛选标签组件（按主题加载）
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReTagFilter", {
  default: () => import("./theme/default/ReTagFilter.vue"),
  koi: () => import("./theme/koi/ReTagFilter.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;
