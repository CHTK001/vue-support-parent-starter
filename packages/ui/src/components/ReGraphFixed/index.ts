/**
 * ReGraphFixed —— 固定位置组件
 *
 * 等价于 <ReGraph mode="fixed" />，节点位置由数据中 x/y 决定（拖拽后会重排）。
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReGraphFixed", {
  default: () => import("./theme/default/ReGraphFixed.vue"),
  koi: () => import("./theme/koi/ReGraphFixed.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;