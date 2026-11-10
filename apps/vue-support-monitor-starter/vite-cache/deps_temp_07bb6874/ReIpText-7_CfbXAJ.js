import { t as defineThemeComponent } from "./theme-DY5ftAcm.js";
//#region ../../packages/ui/src/components/ReIpText/index.ts
/**
* ReIpText —— IP 地址展示组件
*
* 显示 IP + 归属地，支持缓存和三方查询补全。
*/
var themed = defineThemeComponent("ReIpText", {
	default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReIpText/ReIpText.vue"),
	koi: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReIpText/ReIpText.vue")
});
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
