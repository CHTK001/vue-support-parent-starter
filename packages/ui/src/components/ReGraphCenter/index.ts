/**
 * ReGraphCenter —— 中心布局组件
 *
 * 等价于 <ReGraph mode="center" />，专用于以某节点为中心的放射布局。
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReGraphCenter", {
  default: () => import("./theme/default/ReGraphCenter.vue"),
  koi: () => import("./theme/koi/ReGraphCenter.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;