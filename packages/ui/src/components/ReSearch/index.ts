/**
 * ReSearch —— 搜索区折叠组件（按主题加载）
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReSearch", {
  default: () => import("./theme/default/ReSearch.vue"),
  koi: () => import("./theme/koi/ReSearch.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;
