/**
 * ReDialog —— 弹窗组件（按主题加载）
 *
 * 根据 getConfig().other.themeId 局部加载对应主题实现：
 *  - default：el-dialog 封装
 *  - koi：KoiDialog 移植（窗口壳 / 最小化浮标 / 全屏）
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReDialog", {
  default: () => import("./theme/default/ReDialog.vue"),
  koi: () => import("./theme/koi/ReDialog.vue"),
});

/** 按当前主题异步解析组件实例 */
export const component = themed.component;

export { themed as install };
export default component;
