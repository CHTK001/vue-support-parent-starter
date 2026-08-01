/**
 * ReDrawer —— 抽屉组件（按主题加载）
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReDrawer", {
  default: () => import("./theme/default/ReDrawer.vue"),
  koi: () => import("./theme/koi/ReDrawer.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;
