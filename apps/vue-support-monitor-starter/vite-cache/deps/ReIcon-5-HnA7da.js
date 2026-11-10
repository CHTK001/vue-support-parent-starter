import { t as defineThemeComponent } from "./theme-DlZtNnND.js";
//#region ../../packages/ui/src/components/ReIcon/index.ts
/**
* ReIcon —— 通用图标组件（按主题加载）
*
* 根据 getConfig().other.themeId 局部加载对应主题实现：
*  - default：element-plus / iconify / iconfont 多源图标
*  - koi：本地 svg sprite + element-plus 图标
*/
var themed = defineThemeComponent("ReIcon", {
	default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReIcon/theme/default/ReIcon.vue"),
	koi: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReIcon/theme/koi/ReIcon.vue")
});
/**
* 可直接渲染的异步组件（`defineAsyncComponent` 的返回值）。
* 外部按需引入时必须写成 `import("@repo/ui/re-icon").then((m) => m.default)`，
* **不能**写成 `m.default()` —— 它不是 loader，调用会抛 "m.default is not a function"。
*/
var component = themed.component;
//#endregion
export { themed as n, component as t };
