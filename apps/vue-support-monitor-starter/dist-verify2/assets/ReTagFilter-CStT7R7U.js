const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ReTagFilter-DHZhgJgT.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/ReTagFilter-BD-AR_op.css","assets/ReTagFilter-D5yBqN6Z.js","assets/ReTagFilter-e3sRPqvE.css"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as defineThemeComponent } from "./theme-B9R3AFqb.js";
//#region ../../packages/ui/src/components/ReTagFilter/index.ts
/**
* ReTagFilter —— 多组筛选标签组件（按主题加载）
*/
var themed = defineThemeComponent("ReTagFilter", {
	default: () => __vitePreload(() => import("./ReTagFilter-DHZhgJgT.js"), __vite__mapDeps([0,1,2,3])),
	koi: () => __vitePreload(() => import("./ReTagFilter-D5yBqN6Z.js"), __vite__mapDeps([4,1,2,5]))
});
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
