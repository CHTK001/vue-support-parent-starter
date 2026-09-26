/**
 * ReCostText —— 请求耗时展示组件
 *
 * 按阈值以绿 / 黄 / 红三色标识请求快慢。
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReCostText", {
  default: () => import("./ReCostText.vue"),
  koi: () => import("./ReCostText.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;
