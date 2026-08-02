/**
 * ReGraphRelation —— 关系图组件（默认模式）
 *
 * 等价于 <ReGraph mode="relation" />，通用的关系图展示。
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReGraphRelation", {
  default: () => import("./theme/default/ReGraphRelation.vue"),
  koi: () => import("./theme/koi/ReGraphRelation.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;