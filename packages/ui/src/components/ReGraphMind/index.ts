/**
 * ReGraphMind —— 思维导图组件
 *
 * 等价于 <ReGraph mode="mind" />，专用于发散式思维导图。
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReGraphMind", {
  default: () => import("./theme/default/ReGraphMind.vue"),
  koi: () => import("./theme/koi/ReGraphMind.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;