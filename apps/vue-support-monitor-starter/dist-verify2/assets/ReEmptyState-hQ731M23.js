const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ReEmptyState-BLLuVuvd.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/ReEmptyState-D9mzZJFk.css"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as defineThemeComponent } from "./theme-B9R3AFqb.js";
//#region ../../packages/ui/src/components/ReEmptyState/index.ts
/**
* ReEmptyState —— 极简空状态 / 占位组件（default 实现）
*
* 当前仅 default 主题：Vercel/Linear 风格 · 低饱和度 · 无渐变。
* 若未来需要 koi 主题版本，可在此目录新增 ReEmptyState.vue 并在 index.ts 注册。
*/
var themed = defineThemeComponent("ReEmptyState", { default: () => __vitePreload(() => import("./ReEmptyState-BLLuVuvd.js"), __vite__mapDeps([0,1,2,3])) });
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
