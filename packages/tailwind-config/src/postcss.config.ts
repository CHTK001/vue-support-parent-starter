/* 
 * Tailwind CSS v4 PostCSS 配置（保留用于兼容，v4 优先使用 @tailwindcss/vite 插件）
 * 
 * 注意：v4 时代推荐直接使用 @tailwindcss/vite 插件，
 * 这个 PostCSS 配置仅用于特殊场景。
 * 
 * 如果不需要 PostCSS 方式，这个文件可以删除，
 * 在 vite.config.ts 中使用 @tailwindcss/vite 插件即可。
 */

import theme from "./theme.css?inline";

export default {
  plugins: [],
};