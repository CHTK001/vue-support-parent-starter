const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ReDialog-6T0VdlS4.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/dist-Clzx2YUA.js","assets/dist-DI3cGDuP.js","assets/dist-DogtK295.js","assets/button-CLXz94Uh.js","assets/use-size-BpzpcbJM.js","assets/use-namespace-BksmY6RT.js","assets/_baseSet-CMSvwkCM.js","assets/isObject-CBh4bHyD.js","assets/_baseGet-DmmfCxUg.js","assets/use-deprecated-qam6HGto.js","assets/use-form-common-props-DzQ9ZY64.js","assets/constants-ntbKDiND.js","assets/install-CE5IEjzX.js","assets/isPlainObject-CmtvaEIG.js","assets/icon-C0dIJHSD.js","assets/icon-CKvLDnIU.js","assets/style-D30oR_2q.js","assets/objects-BYkkqs6t.js","assets/get-cR0zxN0m.js","assets/aria-DKP9Ei-1.js","assets/use-form-item-D-dEMqBj.js","assets/use-id-C2v-tXFq.js","assets/use-global-config-CwtC64sR.js","assets/use-locale-MdBtu2ja.js","assets/use-z-index-Q40Vppe1.js","assets/use-empty-values-B_20a6o3.js","assets/isEqual-BgqgQyvI.js","assets/_baseIsEqual-4zTScXwg.js","assets/_Uint8Array-Cf2dnQh6.js","assets/_arrayPush-DAsStFRE.js","assets/dialog-C6HCRlOo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/use-draggable-P7Ccy1As.js","assets/clamp--xaQdoQg.js","assets/toNumber-PE_CR5nS.js","assets/overlay-D6Leq3yd.js","assets/scroll-CaaKdoVq.js","assets/raf-Ck-OXP6t.js","assets/focus-trap-B31xXeBw.js","assets/event-BIZRdi1l.js","assets/browser-DVA6k_z5.js","assets/use-dialog-BDtWV0XE.js","assets/event-CeZgVnv0.js","assets/refs-BRnhjbOJ.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/CloseFab-BDUUpPI2.js","assets/CloseFab-DOA6DYuP.css","assets/ReDialog-D0RXPwJY.css","assets/modern-vars-DGJCsX_d.css","assets/ReDialog-DwASanEg.js","assets/ReDialog-DRQkccvZ.css"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as defineThemeComponent } from "./theme-B9R3AFqb.js";
//#region ../../packages/ui/src/components/ReDialog/index.ts
/**
* ReDialog —— 弹窗组件（按主题加载）
*
* 根据 getConfig().other.themeId 局部加载对应主题实现：
*  - default：完整实现（el-dialog 封装 + modern / windows 布局）
*  - koi：KoiDialog 移植（窗口壳 / 最小化浮标 / 全屏）
*/
var themed = defineThemeComponent("ReDialog", {
	default: () => __vitePreload(() => import("./ReDialog-6T0VdlS4.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52])),
	koi: () => __vitePreload(() => import("./ReDialog-DwASanEg.js"), __vite__mapDeps([53,1,35,6,3,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,5,23,24,25,26,27,28,29,30,31,32,33,34,36,37,38,39,40,41,42,43,44,45,46,47,48,49,2,50,54]))
});
/** 按当前主题异步解析组件实例 */
var component = themed.component;
//#endregion
export { themed as n, component as t };
