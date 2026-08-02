/**
 * ReGraphForce —— 力导向图组件
 *
 * 等价于 <ReGraph mode="force" />，专用于无层级关系的网络图、社交关系等。
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReGraphForce", {
  default: () => import("./theme/default/ReGraphForce.vue"),
  koi: () => import("./theme/koi/ReGraphForce.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;