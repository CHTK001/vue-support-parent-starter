/**
 * AI 控制台品牌色阶注入（单一出处）。
 *
 * --el-color-primary 九级色阶与 --brand-50..600、--focus-ring、--selection-bg
 * 由 @repo/utils 的 applyPrimaryColorVars 按品牌蓝种子色运行时派生写入
 * <html>（亮/暗各一套，tokens.css 不再静态写死，消除两套手工色阶的漂移）。
 *
 * 例外：--brand-gradient 是有意设计的「蓝→紫」双色调（见 refactor.css 的
 * --gradient-brand），经 options.gradient 覆写运行时派生的单色蓝渐变。
 * 深档 --brand-700..950 运行时不派生，仍静态保留在 tokens.css。
 */
import { applyPrimaryColorVars, BRAND_COLOR_BLUE } from "@repo/utils";

export function applyAiBrandVars(dark: boolean): void {
  applyPrimaryColorVars(document.documentElement, BRAND_COLOR_BLUE, dark, {
    gradient: `linear-gradient(135deg, var(--brand-500) 0%, ${dark ? "#7c3aed" : "#6d28d9"} 100%)`,
  });
}
