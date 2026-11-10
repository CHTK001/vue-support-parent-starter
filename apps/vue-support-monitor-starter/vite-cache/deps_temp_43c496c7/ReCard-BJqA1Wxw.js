import { t as defineThemeComponent } from "./theme-BnvP-uxy.js";
//#region ../../packages/ui/src/components/ReCard/index.ts
/**
* ReCard —— 卡片组件（按主题加载）
*
* 根据 getConfig().other.themeId 局部加载对应主题实现：
*  - default：el-card 封装
*  - koi：KoiCard 移植（独立 div 结构）
*/
var themed = defineThemeComponent("ReCard", {
	default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReCard/theme/default/ReCard.vue"),
	koi: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReCard/theme/koi/ReCard.vue")
});
/** 按当前主题异步解析组件实例 */
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
