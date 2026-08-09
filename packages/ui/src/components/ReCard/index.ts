/**
 * ReCard —— 卡片组件（按主题加载）
 *
 * 根据 getConfig().other.themeId 局部加载对应主题实现：
 *  - default：el-card 封装
 *  - koi：KoiCard 移植（独立 div 结构）
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReCard", {
  default: () => import("./theme/default/ReCard.vue"),
  koi: () => import("./theme/koi/ReCard.vue"),
});

/** 按当前主题异步解析组件实例 */
export const component = themed.component;

export { themed as install };
export default component;
