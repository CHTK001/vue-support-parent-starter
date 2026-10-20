const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ReFlowGraph-p0wb-dP7.js","assets/ReFlowGraph-DlkGBrS3.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/es-B93eErVb.js","assets/rolldown-runtime-CEgmsyvS.js","assets/isObject-CBh4bHyD.js","assets/_baseGet-DmmfCxUg.js","assets/_baseFlatten-D6objHuc.js","assets/_arrayPush-DAsStFRE.js","assets/_Uint8Array-Cf2dnQh6.js","assets/_baseClone-CR0xuNh7.js","assets/_arrayEach-OvAge8dJ.js","assets/_baseSet-CMSvwkCM.js","assets/isPlainObject-CmtvaEIG.js","assets/union-CKG0-ouI.js","assets/_baseIteratee-0zvAcVIj.js","assets/get-cR0zxN0m.js","assets/_baseIsEqual-4zTScXwg.js","assets/hasIn-COufhDdn.js","assets/isArrayLikeObject-CeWRLNuC.js","assets/merge-DIljS_69.js","assets/_baseEach-CPGfeQSN.js","assets/_baseSlice-CS6dHRAG.js","assets/sortBy-BKBwN3Oc.js","assets/isEmpty-DZzpJqft.js","assets/clamp--xaQdoQg.js","assets/toNumber-PE_CR5nS.js","assets/cloneDeep-BJ4zGpri.js","assets/debounce-DfrQLO3V.js","assets/now-B_tnrbij.js","assets/isEqual-BgqgQyvI.js","assets/pick-BwGnaelS.js","assets/_flatRest-CP5Zoeqo.js","assets/throttle-DxY_k3Za.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/ReButton-CH6SFZxo.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/tooltip-DEX5DBfd.js","assets/event-BIZRdi1l.js","assets/browser-DVA6k_z5.js","assets/dist-DI3cGDuP.js","assets/use-namespace-BksmY6RT.js","assets/isUndefined-DfHYomSZ.js","assets/dist-Clzx2YUA.js","assets/aria-DKP9Ei-1.js","assets/use-id-C2v-tXFq.js","assets/focus-trap-B31xXeBw.js","assets/use-z-index-Q40Vppe1.js","assets/use-aria-VmjVV7Ut.js","assets/install-CE5IEjzX.js","assets/constants-ntbKDiND.js","assets/icon-CKvLDnIU.js","assets/style-D30oR_2q.js","assets/objects-BYkkqs6t.js","assets/button-CLXz94Uh.js","assets/use-size-BpzpcbJM.js","assets/use-deprecated-qam6HGto.js","assets/use-form-common-props-DzQ9ZY64.js","assets/dist-DogtK295.js","assets/icon-C0dIJHSD.js","assets/use-form-item-D-dEMqBj.js","assets/use-global-config-CwtC64sR.js","assets/use-locale-MdBtu2ja.js","assets/use-empty-values-B_20a6o3.js","assets/ReIcon-mRxVAA3T.js","assets/registry-Dp44ioVs.js","assets/ReIcon-B6YUJqdV.css","assets/ReButton-CVtu1Sci.css","assets/ReDialog-DZGeR3lw.js","assets/theme-B9R3AFqb.js","assets/src-DzQcKxHP.js","assets/ReFlowGraph-DKGGwqVL.css","assets/ReFlowGraph--t2hfA6E.js"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as defineThemeComponent } from "./theme-B9R3AFqb.js";
//#region ../../packages/ui/src/components/ReFlowGraph/index.ts
/**
* ReFlowGraph —— 可视化流程设计器（按主题加载）
*
* 基于 @antv/x6，交互对齐 X6 官方 DAG 示例
* （https://x6.antv.antgroup.com/examples/showcase/practices/#dag）：
*   - 180×36 横向卡片节点（白底 + 左侧主色竖条 + 图标 + 标签），节点体由 Vue 组件
*     经 `@antv/x6-vue-shape` 渲染，与官方用 `@antv/x6-react-shape` 的做法对应
*   - 四向磁吸端口，连线按语义着色：正常绿 / 异常红 / 条件蓝 / 其余灰，不传递变量转虚线
*   - 左侧调色板（点击或 HTML5 拖拽入板）、右侧可拖宽停靠属性面板（表单由插槽提供）
*   - 就地改名、右键菜单、框选、复制粘贴、辅助线、撤销重做、快捷键
*   - 结构预检（唯一开始、末端必须结束、悬空/孤立告警）、缩放适配、缩略图、PNG 导出
*
* 与官方实践的有意差异见 `internals/engine.ts` 文件头（方向约束、平移手势、框选修饰键）
* 与 README 的「与官方 DAG 实践的差异」一节。
*
* 主题：
*   - default：完整设计器
*   - koi：只读视图（editable 时才带调色板）
*/
var themed = defineThemeComponent("ReFlowGraph", {
	default: () => __vitePreload(() => import("./ReFlowGraph-p0wb-dP7.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72])),
	koi: () => __vitePreload(() => import("./ReFlowGraph--t2hfA6E.js"), __vite__mapDeps([73,2,1,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72]))
});
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
