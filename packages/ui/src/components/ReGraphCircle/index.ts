/**
 * ReGraphCircle —— 环形布局组件
 *
 * 等价于 <ReGraph mode="circle" />，专用于环形/放射展示场景。
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReGraphCircle", {
  default: () => import("./theme/default/ReGraphCircle.vue"),
  koi: () => import("./theme/koi/ReGraphCircle.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;