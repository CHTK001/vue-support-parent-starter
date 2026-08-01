/**
 * ReTag —— 标签组件（按主题加载）
 *
 * 根据 getConfig().other.themeId 局部加载对应主题实现：
 *  - default：el-tag 封装
 *  - koi：KoiTag 移植（自定义 div + el-tag 回退）
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReTag", {
  default: () => import("./theme/default/ReTag.vue"),
  koi: () => import("./theme/koi/ReTag.vue"),
});

/** 按当前主题异步解析组件实例 */
export const component = themed.component;

export { themed as install };
export default component;
