const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ReGraph3D-BEeMm9Pd.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/dist-DogtK295.js","assets/rolldown-runtime-CEgmsyvS.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/internals-C4HpkYaV.js","assets/timer-d7k6Rryl.js","assets/quadtree-DbdpW_fl.js","assets/three.core-BLfAYNmz.js","assets/three.module-K9H-7qa7.js","assets/ReGraph3D-CoBrgWSd.css","assets/ReGraph3D-CIFRrwmO.js","assets/ReGraph3D-ojFTtXtZ.css"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as defineThemeComponent } from "./theme-B9R3AFqb.js";
//#region ../../packages/ui/src/components/ReGraph3D/index.ts
/**
* ReGraph3D —— 3D 力导向关系图组件
*
* 基于 three.js + d3-force 实现（d3-force-3d 的 d3-force 封装）。
* 不引入 3d-force-graph npm 包，自行封装以减少依赖与体积。
*
* 支持：
*   - 力导向布局（3D）
*   - 鼠标拖拽旋转 / 滚轮缩放
*   - 自动旋转
*   - 节点悬停 / 点击事件
*   - 节点大小（按 val 或度数）
*   - 节点颜色（按 group）
*   - 方向箭头
*
* 主题：
*   - default：完整功能（搜索 / 工具栏 / 节点交互）
*   - koi：精简视图（无工具栏，仅 3D 渲染）
*/
var themed = defineThemeComponent("ReGraph3D", {
	default: () => __vitePreload(() => import("./ReGraph3D-BEeMm9Pd.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10])),
	koi: () => __vitePreload(() => import("./ReGraph3D-CIFRrwmO.js"), __vite__mapDeps([11,1,4,5,6,7,8,9,3,12]))
});
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
