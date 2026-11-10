import { t as defineThemeComponent } from "./theme-DlZtNnND.js";
//#region ../../packages/ui/src/components/ReEmptyState/index.ts
/**
* ReEmptyState —— 极简空状态 / 占位组件（default 实现）
*
* 当前仅 default 主题：Vercel/Linear 风格 · 低饱和度 · 无渐变。
* 若未来需要 koi 主题版本，可在此目录新增 ReEmptyState.vue 并在 index.ts 注册。
*/
var themed = defineThemeComponent("ReEmptyState", { default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReEmptyState/theme/default/ReEmptyState.vue") });
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
