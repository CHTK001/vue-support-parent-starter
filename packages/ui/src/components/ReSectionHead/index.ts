/**
 * ReSectionHead —— 区段头部（default 主题）
 *
 * 当前仅 default 主题：纯展示组件，主题差异小。
 */
import { defineThemeComponent } from "../../../theme";

const themed = defineThemeComponent("ReSectionHead", {
  default: () => import("./ReSectionHead.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;
