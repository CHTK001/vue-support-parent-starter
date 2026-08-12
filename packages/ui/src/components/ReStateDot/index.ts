/**
 * ReStateDot —— 状态圆点（default 主题）
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReStateDot", {
  default: () => import("./theme/default/ReStateDot.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;
