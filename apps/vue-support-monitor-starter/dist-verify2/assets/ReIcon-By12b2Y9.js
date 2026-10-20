const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ReIcon-CyM2YNO2.js","assets/ReIcon-mRxVAA3T.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/dist-DogtK295.js","assets/rolldown-runtime-CEgmsyvS.js","assets/icon-CKvLDnIU.js","assets/use-namespace-BksmY6RT.js","assets/_baseSet-CMSvwkCM.js","assets/isObject-CBh4bHyD.js","assets/_baseGet-DmmfCxUg.js","assets/style-D30oR_2q.js","assets/objects-BYkkqs6t.js","assets/get-cR0zxN0m.js","assets/dist-DI3cGDuP.js","assets/aria-DKP9Ei-1.js","assets/install-CE5IEjzX.js","assets/isPlainObject-CmtvaEIG.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/registry-Dp44ioVs.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/ReIcon-B6YUJqdV.css","assets/ReIcon-mx_iKwze.js","assets/ReIcon-BI9YQTiE.js","assets/ReIcon-BZdeJfjy.css"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as defineThemeComponent } from "./theme-B9R3AFqb.js";
//#region ../../packages/ui/src/components/ReIcon/index.ts
/**
* ReIcon —— 通用图标组件（按主题加载）
*
* 根据 getConfig().other.themeId 局部加载对应主题实现：
*  - default：element-plus / iconify / iconfont 多源图标
*  - koi：本地 svg sprite + element-plus 图标
*/
var themed = defineThemeComponent("ReIcon", {
	default: () => __vitePreload(() => import("./ReIcon-CyM2YNO2.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20])),
	koi: () => __vitePreload(() => import("./ReIcon-mx_iKwze.js"), __vite__mapDeps([21,22,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,23]))
});
/**
* 可直接渲染的异步组件（`defineAsyncComponent` 的返回值）。
* 外部按需引入时必须写成 `import("@repo/ui/re-icon").then((m) => m.default)`，
* **不能**写成 `m.default()` —— 它不是 loader，调用会抛 "m.default is not a function"。
*/
var component = themed.component;
//#endregion
export { themed as n, component as t };
