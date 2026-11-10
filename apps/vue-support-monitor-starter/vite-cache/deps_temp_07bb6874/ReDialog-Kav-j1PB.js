import { t as defineThemeComponent } from "./theme-DY5ftAcm.js";
//#region ../../packages/ui/src/components/ReDialog/index.ts
/**
* ReDialog —— 弹窗组件（按主题加载）
*
* 根据 getConfig().other.themeId 局部加载对应主题实现：
*  - default：完整实现（el-dialog 封装 + modern / windows 布局）
*  - koi：KoiDialog 移植（窗口壳 / 最小化浮标 / 全屏）
*/
var themed = defineThemeComponent("ReDialog", {
	default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReDialog/ReDialog.vue"),
	koi: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReDialog/theme/koi/ReDialog.vue")
});
/** 按当前主题异步解析组件实例 */
var component = themed.component;
//#endregion
export { themed as n, component as t };
