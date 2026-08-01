/**
 * ReLoading —— 全屏加载遮罩（按主题加载）
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReLoading", {
  default: () => import("./theme/default/ReLoading.vue"),
  koi: () => import("./theme/koi/ReLoading.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;
