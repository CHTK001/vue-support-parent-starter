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

/**
 * 可直接渲染的异步组件（`defineAsyncComponent` 的返回值）。
 * 外部按需引入时必须写成 `import("@repo/ui/re-icon").then((m) => m.default)`，
 * **不能**写成 `m.default()` —— 它不是 loader，调用会抛 "m.default is not a function"。
 */
export const component = themed.component;

export { themed as install };
export default component;
