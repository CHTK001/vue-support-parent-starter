/**
 * 展示格式化工具。
 *
 * <p>收敛各业务页重复实现的「百分数量纲兼容」等展示格式，
 * 保证同一份数据在不同页面看到同一个样子。</p>
 */

/**
 * 百分数展示（缺省一位小数）。
 *
 * <p>后端历史口径里 0-1 与 0-100 两种量纲都出现过：≤1 视为小数比例放大
 * 100 倍，>1 视为已经是百分数原样保留。相似度、置信度等字段共用本口径。</p>
 *
 * @param value 原始数值
 * @param digits 小数位，缺省 1
 * @returns 形如 `98.6%`；缺失或非法时为空串
 */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) {
    return "";
  }
  const pct = value <= 1 ? value * 100 : value;
  return `${pct.toFixed(digits)}%`;
}
