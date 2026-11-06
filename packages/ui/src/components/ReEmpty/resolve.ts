/**
 * ReEmpty 的「实际布局」解析。
 *
 * <p>优先级：显式 prop &gt; 全局配置（{@code other.emptyState}）&gt; "el"。</p>
 *
 * <p>为什么要单独拆出来：布局既可能来自 {@code <ReEmpty layout="plot">}（业务写死，
 * 必须永远生效），也可能来自部署配置（全局默认，admin 在主题配置里改）。两者混在
 * 组件里会让「传了 prop 却被配置覆盖」这种线上问题很难一眼看出来，所以把规则收在
 * 这个纯函数里，并配单测锁住。</p>
 */

/** 空状态可用的三种样式 */
export type EmptyLayout = "el" | "modern" | "plot";

/** 全局配置里这一个对象的最小形状（不直接依赖 @repo/config 的完整类型，便于单测） */
export interface EmptyStateLike {
  enable?: boolean;
  layout?: string;
  hairline?: string;
}

/** 全部可选布局（主题配置里按这个顺序出选项卡） */
export const EMPTY_LAYOUTS: readonly EmptyLayout[] = ["el", "modern", "plot"];

/** 把任意值收窄成合法布局；非法值一律当 "el" */
export function normalizeEmptyLayout(value: unknown): EmptyLayout {
  return value === "modern" || value === "plot" || value === "el" ? value : "el";
}

/**
 * 解析实际布局。
 *
 * @param propLayout 组件显式传入的 layout（没传就是 undefined）
 * @param config     全局配置 {@code other.emptyState}；不传时由调用方读取 appConfig
 */
export function resolveEmptyLayout(
  propLayout: unknown,
  config?: EmptyStateLike | null,
): EmptyLayout {
  // 1. 显式 prop 永远优先（业务里写死的 layout 不能被部署配置改掉）
  if (propLayout === "el" || propLayout === "modern" || propLayout === "plot") {
    return propLayout;
  }
  // 2. 配置关闭 → 回落默认，与接入配置前逐字一致
  if (!config || config.enable === false) return "el";
  // 3. 配置开启 → 用配置里的布局（非法值兜底 "el"）
  return normalizeEmptyLayout(config.layout);
}

/**
 * 解析「动画图」用哪款 hairline 图形。
 *
 * <p>优先级同样是 显式 prop &gt; 全局配置 &gt; 默认 {@code plot}；
 * 键名合法性由 {@code figures.ts} 的 {@code normalizeHairlineFigure} 兜底，
 * 这里只做取值，不 import hairline（保持本文件可在 node 里单测）。</p>
 */
export function resolveEmptyFigure(
  propFigure: unknown,
  config?: EmptyStateLike | null,
): string | undefined {
  if (typeof propFigure === "string" && propFigure) return propFigure;
  if (config && typeof config.hairline === "string" && config.hairline) {
    return config.hairline;
  }
  return undefined;
}
