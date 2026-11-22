/**
 * ReErrorBar —— 统一错误提示条（亮色 / 暗色双主题）
 *
 * 设计规范（Signal 信号条形态）：
 *   - 白/暗色卡片底 + 3px 红色左缘线 + 淡红圆形图标底；重试按钮为实心红图标
 *   - 横向单行（高度 36px）：图标 · 文案 · 重试（文案可被 slot 覆盖）
 *   - 宽度同页面流，最大 920px（超出隐藏）
 * Props:
 *   - message: 错误文案（必传）
 *   - retryText: 重试按钮的无障碍标签/悬浮提示（不显示为可见文字），传空串时不渲染重试按钮
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
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReErrorBar", {
  default: () => import("./theme/default/ReErrorBar.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;
