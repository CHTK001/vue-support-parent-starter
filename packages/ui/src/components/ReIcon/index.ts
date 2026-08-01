/**
 * ReIcon —— 通用图标组件（按主题加载）
 *
 * 根据 getConfig().other.themeId 局部加载对应主题实现：
 *  - default：element-plus / iconify / iconfont 多源图标
 *  - koi：本地 svg sprite + element-plus 图标
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReIcon", {
  default: () => import("./theme/default/ReIcon.vue"),
  koi: () => import("./theme/koi/ReIcon.vue"),
});

/** 按当前主题异步解析组件实例 */
export const component = themed.component;

export { themed as install };
export default component;
