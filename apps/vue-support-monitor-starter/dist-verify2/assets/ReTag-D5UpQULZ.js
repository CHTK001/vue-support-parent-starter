const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ReTag-DE2v04bd.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/tag-CqzZCxmq.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/use-locale-MdBtu2ja.js","assets/get-cR0zxN0m.js","assets/_baseGet-DmmfCxUg.js","assets/isObject-CBh4bHyD.js","assets/use-size-BpzpcbJM.js","assets/use-namespace-BksmY6RT.js","assets/_baseSet-CMSvwkCM.js","assets/use-form-common-props-DzQ9ZY64.js","assets/constants-ntbKDiND.js","assets/install-CE5IEjzX.js","assets/isPlainObject-CmtvaEIG.js","assets/dist-DogtK295.js","assets/rolldown-runtime-CEgmsyvS.js","assets/icon-CKvLDnIU.js","assets/style-D30oR_2q.js","assets/objects-BYkkqs6t.js","assets/dist-DI3cGDuP.js","assets/aria-DKP9Ei-1.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/ReIcon-mRxVAA3T.js","assets/registry-Dp44ioVs.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/ReIcon-B6YUJqdV.css","assets/ReTag-Dde59TAC.css","assets/ReTag-BHCUbvEq.js","assets/ReTag-D8pOHr8A.css"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as defineThemeComponent } from "./theme-B9R3AFqb.js";
//#region ../../packages/ui/src/components/ReTag/index.ts
/**
* ReTag —— 标签组件（按主题加载）
*
* 根据 getConfig().other.themeId 局部加载对应主题实现：
*  - default：el-tag 封装
*  - koi：KoiTag 移植（自定义 div + el-tag 回退）
*/
var themed = defineThemeComponent("ReTag", {
	default: () => __vitePreload(() => import("./ReTag-DE2v04bd.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27])),
	koi: () => __vitePreload(() => import("./ReTag-BHCUbvEq.js"), __vite__mapDeps([28,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,29]))
});
/** 按当前主题异步解析组件实例 */
var component = themed.component;
//#endregion
export { themed as n, component as t };
