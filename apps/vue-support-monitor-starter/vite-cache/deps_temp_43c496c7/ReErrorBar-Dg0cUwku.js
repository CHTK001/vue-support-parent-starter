import { t as defineThemeComponent } from "./theme-BnvP-uxy.js";
//#region ../../packages/ui/src/components/ReErrorBar/index.ts
/**
* ReErrorBar —— 统一错误提示条（亮色 / 暗色双主题）
*
* 设计规范：
*   - 浅红底 · 红边框 · 深红文字（亮色）；暗色下红底更透明、文字更亮
*   - 横向三段：图标 · 文案 · 重试（文案可被 slot 覆盖）
*   - 宽度同页面流，最大 920px（超出隐藏）
* Props:
*   - message: 错误文案（必传）
*   - retryText: 重试按钮文案（默认「重试」），传空串时不渲染重试按钮
*   - retryLoading: 重试按钮是否加载中（圆圈转圈）
* Events:
*   - retry: 单击重试按钮时触发（各页面传本地重试函数）
* Slots:
*   - message: 覆盖文案
*   - action: 覆盖重试按钮右侧区域（如「查看详情」）
*
* 来源：替代 pages/ 下 `.chm-alert` / `.as-error` / `.sw-error` / `.dcv-error` /
*   `.del-error` / `.dal-error` / `.dar-error` / `.settings-error` / `.fetch-error` /
*   `.mapping-state-error` / `.iw__error` / `.git-repo__error` 等分散写法，
*   统一输出同一形态。
*/
var themed = defineThemeComponent("ReErrorBar", { default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReErrorBar/theme/default/ReErrorBar.vue") });
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
