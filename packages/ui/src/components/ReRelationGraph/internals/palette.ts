/**
 * 分组配色（唯一来源）。
 *
 * <p>节点填充 / 分组轮廓 / combo 描边 / 工具面板色点全从这里取，
 * 所以「同组同色」在全图各处一致；业务要画图例、头像底色、
 * 自定义面板时也应该用 {@link groupColorOf}，不要自己再抄一套调色板
 * （抄一套就得跟着这里改，实际做过的项目里几乎都抄歪了）。</p>
 *
 * <p>取色是「组名 hash → 调色板下标」，跟数据顺序无关：
 * 加节点、换布局、改分组顺序都不会让颜色跳变。</p>
 */

/** 分组调色板（沿用 G6 官方 bubble-sets 示例的六色） */
export const GROUP_PALETTE = [
  "#1783FF",
  "#00C9C9",
  "#F08F56",
  "#D580FF",
  "#786CFF",
  "#FF85C0",
] as const;

/** 组名 hash → 稳定色（同组同色，跨渲染稳定） */
export const groupColorOf = (group: string, palette: readonly string[] = GROUP_PALETTE): string => {
  let hash = 0;
  for (let i = 0; i < group.length; i++) hash = (hash * 31 + group.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length] ?? GROUP_PALETTE[0];
};
