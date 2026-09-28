/**
 * 卡片视觉基线入口（跨包引用）
 *
 * `re-surface.css` 定义了库统一的卡片/面板视觉规格（ReStatCard 风格：
 * 16px 圆角、无实色边框、双层柔光投影、悬停上浮 2px），由
 * ReStatCard / ReStat 组件内部 import。
 *
 * 宿主应用若要在自己的组件里用同一套规格（class="re-surface" 等），
 * 需显式引入本模块把样式打进产物：
 *
 *   import '@repo/ui/surface'
 *
 * 只做副作用引入，不导出任何成员。类名与令牌见 re-surface.css 顶部注释。
 */
import "./radius-vars.css";
import "./re-surface.css";

export {};
