import { t as defineThemeComponent } from "./theme-DlZtNnND.js";
//#region ../../packages/ui/src/components/ReScrollNav/index.ts
/**
* ReScrollNav —— 横向滚动导航壳层（按主题加载）
*/
var themed = defineThemeComponent("ReScrollNav", {
	default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReScrollNav/theme/default/ReScrollNav.vue"),
	koi: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReScrollNav/theme/koi/ReScrollNav.vue")
});
var component = themed.component;
//#endregion
export { themed as n, component as t };
