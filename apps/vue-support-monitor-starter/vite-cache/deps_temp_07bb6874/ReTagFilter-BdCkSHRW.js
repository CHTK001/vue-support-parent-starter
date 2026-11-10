import { t as defineThemeComponent } from "./theme-DY5ftAcm.js";
//#region ../../packages/ui/src/components/ReTagFilter/index.ts
/**
* ReTagFilter —— 多组筛选标签组件（按主题加载）
*/
var themed = defineThemeComponent("ReTagFilter", {
	default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReTagFilter/theme/default/ReTagFilter.vue"),
	koi: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReTagFilter/theme/koi/ReTagFilter.vue")
});
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
