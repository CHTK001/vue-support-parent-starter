/**
 * ReEmptyState —— 极简空状态 / 占位组件（default 实现）
 *
 * 当前仅 default 主题：Vercel/Linear 风格 · 低饱和度 · 无渐变。
 * 若未来需要 koi 主题版本，可在此目录新增 ReEmptyState.vue 并在 index.ts 注册。
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReEmptyState", {
  default: () => import("./ReEmptyState.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;
