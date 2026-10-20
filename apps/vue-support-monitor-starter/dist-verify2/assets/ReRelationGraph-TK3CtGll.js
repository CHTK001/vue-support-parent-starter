const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ReRelationGraph-CT5PKmqp.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/G6Graph-B9sMX7ab.js","assets/rolldown-runtime-CEgmsyvS.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/src-BVnZQO9c.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/dist-DI3cGDuP.js","assets/src-DzQcKxHP.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/ReSelect-C2rq-Voy.js","assets/ReSelect-BrUGYrlz.js","assets/select-0mzxLp1O.js","assets/use-locale-MdBtu2ja.js","assets/get-cR0zxN0m.js","assets/_baseGet-DmmfCxUg.js","assets/isObject-CBh4bHyD.js","assets/event-BIZRdi1l.js","assets/browser-DVA6k_z5.js","assets/event-CeZgVnv0.js","assets/use-size-BpzpcbJM.js","assets/use-namespace-BksmY6RT.js","assets/_baseSet-CMSvwkCM.js","assets/toInteger-DwissHgA.js","assets/toNumber-PE_CR5nS.js","assets/_baseIteratee-0zvAcVIj.js","assets/_baseFlatten-D6objHuc.js","assets/_arrayPush-DAsStFRE.js","assets/_Uint8Array-Cf2dnQh6.js","assets/_baseIsEqual-4zTScXwg.js","assets/hasIn-COufhDdn.js","assets/castArray-DkZAeVfZ.js","assets/clamp--xaQdoQg.js","assets/isEqual-BgqgQyvI.js","assets/dist-Clzx2YUA.js","assets/aria-DKP9Ei-1.js","assets/vnode-6UdpuL7k.js","assets/scroll-CaaKdoVq.js","assets/style-D30oR_2q.js","assets/objects-BYkkqs6t.js","assets/raf-Ck-OXP6t.js","assets/tooltip-DEX5DBfd.js","assets/isUndefined-DfHYomSZ.js","assets/use-id-C2v-tXFq.js","assets/focus-trap-B31xXeBw.js","assets/use-z-index-Q40Vppe1.js","assets/use-aria-VmjVV7Ut.js","assets/pick-BwGnaelS.js","assets/_flatRest-CP5Zoeqo.js","assets/install-CE5IEjzX.js","assets/isPlainObject-CmtvaEIG.js","assets/constants-ntbKDiND.js","assets/use-form-common-props-DzQ9ZY64.js","assets/use-composition-BHiYKdrO.js","assets/use-empty-values-B_20a6o3.js","assets/dist-DogtK295.js","assets/icon-C0dIJHSD.js","assets/icon-CKvLDnIU.js","assets/use-form-item-D-dEMqBj.js","assets/scrollbar-DRrkTSQ2.js","assets/numbers-I--Pu7qj.js","assets/click-outside-B3b0egMR.js","assets/tag-CqzZCxmq.js","assets/checkbox-FhkQL8S5.js","assets/omit-nJwLfQRJ.js","assets/_baseClone-CR0xuNh7.js","assets/_arrayEach-OvAge8dJ.js","assets/_baseSlice-CS6dHRAG.js","assets/last-CtlzjKiB.js","assets/use-deprecated-qam6HGto.js","assets/src-CEonioA3.js","assets/message-BQI5cdKE.js","assets/typescript-CMUKtCBO.js","assets/use-global-config-CwtC64sR.js","assets/message-box-CXDJvJwn.js","assets/input-Bbhiel27.js","assets/use-draggable-P7Ccy1As.js","assets/overlay-D6Leq3yd.js","assets/button-CLXz94Uh.js","assets/validator-PIu3bjQD.js","assets/src-DDwlSqPX.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/vue-router-D43uXGPs.js","assets/src-C3nkWua1.css","assets/ReSelect-BMTEMGdm.css","assets/modern-vars-DGJCsX_d.css","assets/ReButton-owxlNwDO.js","assets/ReButton-CH6SFZxo.js","assets/ReIcon-mRxVAA3T.js","assets/registry-Dp44ioVs.js","assets/ReIcon-B6YUJqdV.css","assets/ReButton-CVtu1Sci.css","assets/ReIcon-By12b2Y9.js","assets/theme-B9R3AFqb.js","assets/ReInput-CGHpe202.js","assets/ReInput-D5IsrmWe.css","assets/ReSwitch-B3yMYGw4.js","assets/ReSwitch-BIIwnUAR.js","assets/types-BnhhpgPH.js","assets/isNativeReflectConstruct-DnutJBKU.js","assets/G6Graph-CfvPIAZi.css","assets/ReRelationGraph-23AP3HuK.js"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as defineThemeComponent } from "./theme-B9R3AFqb.js";
//#region ../../packages/ui/src/components/ReRelationGraph/index.ts
/**
* ReRelationGraph —— 关系图谱组件（G6 v5 内核）
*
* <p>能力概览：</p>
* <ul>
*   <li>节点：原型（circle/rect/image/html/star/triangle/diamond/donut/hexagon/ellipse）、
*       图片、名称、大小、分组、固定；</li>
*   <li>交互：左键 / 右键 / 双击 / 鼠标经过与退出，ctrl+左键多选；</li>
*   <li>边：类型、方向（箭头）、动态（虚线流动感）；</li>
*   <li>布局：18 种内置布局可切换，节点可拖拽、可固定，小地图、缩放、
*       悬停同组高亮（其余淡出）、悬停临近高亮（其余淡出）；</li>
*   <li>运行时通过实例方法动态增删改节点与边（addNode / addEdge / updateNode /
*       updateEdge / removeNode / removeEdge），同步 3D 视图，编辑进撤销栈；</li>
*   <li>内置类地图悬浮工具栏（画布右上角，圆角半透明 + 阴影）：布局切换 /
*       节点搜索定位 / 缩放 / 适配视口 / 撤销重做 / 图片导出 / 拖边连线 /
*       小地图开关 / 2D-3D 切换；</li>
*   <li>编辑能力：{@code editable} 下右键菜单删除、选中单个节点/边时工具栏出现
*       更新 / 删除按钮、拖边连线（连线模式开关）、撤销 / 重做（仅记录数据变更，
*       拖拽位移与布局不占栈）；</li>
*   <li>节点内容插槽 {@code #node-content="{ node, selected }"}（仅 2D，
*       类型为 {@code html} 的节点走 DOM 渲染）；</li>
*   <li>无障碍：工具栏 {@code role=toolbar} + 左右方向键巡航、画布可聚焦、
*       Ctrl+Z / Ctrl+Y / Ctrl+F / Esc 快捷键；文案随应用语言（i18n）切换；</li>
*   <li>2D/3D 双视图：{@code mode="2d"|"3d"} 或工具栏按钮切换，3D 基于
*       vue-force-graph-3d（力导向、拖拽、悬停高亮、右键菜单、选中），
*       G6 实例全程保活，两视图共享同一数据源与选中状态。</li>
* </ul>
*
* <p>用法：{@code <ReRelationGraph :nodes="nodes" :edges="edges" layout="force" />}；
* 3D 视图：{@code <ReRelationGraph :nodes="nodes" :edges="edges" mode="3d" />}。</p>
*
* @author CH
* @since 4.0.0.42
*/
var themed = defineThemeComponent("ReRelationGraph", {
	default: () => __vitePreload(() => import("./ReRelationGraph-CT5PKmqp.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101])),
	koi: () => __vitePreload(() => import("./ReRelationGraph-23AP3HuK.js"), __vite__mapDeps([102,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101]))
});
var component = themed.component;
//#endregion
export { themed as n, component as t };
