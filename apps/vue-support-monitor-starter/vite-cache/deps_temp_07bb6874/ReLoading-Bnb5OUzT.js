import { t as defineThemeComponent } from "./theme-DY5ftAcm.js";
//#region ../../packages/ui/src/components/ReLoading/index.ts
/**
* ReLoading —— 全屏加载遮罩（按主题加载）
*/
var themed = defineThemeComponent("ReLoading", {
	default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReLoading/theme/default/ReLoading.vue"),
	koi: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReLoading/theme/koi/ReLoading.vue")
});
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
