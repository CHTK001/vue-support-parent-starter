/**
 * ReGraphTree —— 树状图组件
 *
 * 等价于 <ReGraph mode="tree" />，专用于层次分明的树状结构（组织架构、分类等）。
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReGraphTree", {
  default: () => import("./theme/default/ReGraphTree.vue"),
  koi: () => import("./theme/koi/ReGraphTree.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;