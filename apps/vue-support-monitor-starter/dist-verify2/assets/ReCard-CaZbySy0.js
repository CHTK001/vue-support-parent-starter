const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ReCard-E3Uvcq8A.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/card-v-sNLg7D.js","assets/use-namespace-BksmY6RT.js","assets/_baseSet-CMSvwkCM.js","assets/isObject-CBh4bHyD.js","assets/_baseGet-DmmfCxUg.js","assets/install-CE5IEjzX.js","assets/isPlainObject-CmtvaEIG.js","assets/use-global-config-CwtC64sR.js","assets/use-locale-MdBtu2ja.js","assets/get-cR0zxN0m.js","assets/use-size-BpzpcbJM.js","assets/objects-BYkkqs6t.js","assets/use-z-index-Q40Vppe1.js","assets/dist-DI3cGDuP.js","assets/use-empty-values-B_20a6o3.js","assets/isEqual-BgqgQyvI.js","assets/_baseIsEqual-4zTScXwg.js","assets/_Uint8Array-Cf2dnQh6.js","assets/_arrayPush-DAsStFRE.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/ReCard-BUdLpPnr.css","assets/modern-vars-DGJCsX_d.css","assets/ReCard-DsW6cTKe.js","assets/ReCard-BOaVUB2O.css"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as defineThemeComponent } from "./theme-B9R3AFqb.js";
//#region ../../packages/ui/src/components/ReCard/index.ts
/**
* ReCard —— 卡片组件（按主题加载）
*
* 根据 getConfig().other.themeId 局部加载对应主题实现：
*  - default：el-card 封装
*  - koi：KoiCard 移植（独立 div 结构）
*/
var themed = defineThemeComponent("ReCard", {
	default: () => __vitePreload(() => import("./ReCard-E3Uvcq8A.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23])),
	koi: () => __vitePreload(() => import("./ReCard-DsW6cTKe.js"), __vite__mapDeps([24,1,21,25]))
});
/** 按当前主题异步解析组件实例 */
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
