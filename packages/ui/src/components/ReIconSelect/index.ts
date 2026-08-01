/**
 * ReIconSelect —— 图标选择器（按主题加载）
 *
 * 根据 getConfig().other.themeId 局部加载对应主题实现：
 *  - default：多图标库（ep / ri / mdi）
 *  - koi：本地 svg + element 图标
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReIconSelect", {
  default: () => import("./theme/default/ReIconSelect.vue"),
  koi: () => import("./theme/koi/ReIconSelect.vue"),
});

/** 按当前主题异步解析组件实例 */
export const component = themed.component;

export { themed as install };
export default component;
export * from "../ReIcon/iconData";
