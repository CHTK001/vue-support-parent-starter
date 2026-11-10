import { t as defineThemeComponent } from "./theme-BnvP-uxy.js";
//#region ../../packages/ui/src/components/ReSearch/index.ts
/**
* ReSearch —— 搜索区折叠组件（按主题加载）
*
* 只有一份实现：default 与 koi 两个键指向同一文件。
* 曾经的两份副本同源分叉，「隐藏过滤区后无法还原」的修复只能在被渲染的那份上验证，
* 另一份静默腐烂 —— 重建第二套视觉时再拆目录。
*/
var singleImpl = () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReSearch/theme/koi/ReSearch.vue");
var themed = defineThemeComponent("ReSearch", {
	default: singleImpl,
	koi: singleImpl
});
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
