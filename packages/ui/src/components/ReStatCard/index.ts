/**
 * ReStatCard —— 统计卡片（default 主题）
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReStatCard", {
  default: () => import("./theme/default/ReStatCard.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;
