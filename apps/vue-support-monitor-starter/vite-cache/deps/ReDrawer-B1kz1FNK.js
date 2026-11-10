import { t as defineThemeComponent } from "./theme-DlZtNnND.js";
//#region ../../packages/ui/src/components/ReDrawer/index.ts
/**
* ReDrawer —— 抽屉组件（按主题加载）
*/
var themed = defineThemeComponent("ReDrawer", {
	default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReDrawer/theme/default/ReDrawer.vue"),
	koi: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReDrawer/theme/koi/ReDrawer.vue")
});
var component = themed.component;
//#endregion
export { themed as n, component as t };
