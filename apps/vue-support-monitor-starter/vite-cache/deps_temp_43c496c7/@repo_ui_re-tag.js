import { t as defineThemeComponent } from "./theme-BnvP-uxy.js";
//#region ../../packages/ui/src/components/ReTag/index.ts
/**
* ReTag —— 标签组件（按主题加载）
*
* 根据 getConfig().other.themeId 局部加载对应主题实现：
*  - default：el-tag 封装
*  - koi：KoiTag 移植（自定义 div + el-tag 回退）
*/
var themed = defineThemeComponent("ReTag", {
	default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReTag/theme/default/ReTag.vue"),
	koi: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReTag/theme/koi/ReTag.vue")
});
/** 按当前主题异步解析组件实例 */
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
