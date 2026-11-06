/**
 * hairline 图形注册表 —— 空状态「动画图」可选的图形类型。
 *
 * <p>为什么要有这一层：{at code at lucasmarkes/hairline} 导出了三十多个图形
 * （plot / phosphor / terrain / riffle / slow / …），空状态只写死 {at code plot}
 * 就等于把「动画图」做成了单一款式。这里把可选的图形收成一张表：</p>
 * <ul>
 *   <li>配置里存的是**键名**（app.yaml {at code other.emptyState.hairline}），
 *       换默认图形不用改组件；</li>
 *   <li>键名非法 / 缺失 → 回落 {at code plot}，不会因为配置写错而白屏；</li>
 *   <li>主题配置里的下拉项直接遍历 {at code HAIRLINE_FIGURE_KEYS}，
 *       新增图形只需在这里加一行 + 补 i18n 文案。</li>
 * </ul>
 *
 * <p>注意：这里只挑选了适合「空状态」这个场景的图形（体积适中、静置时有内容）。
 * 需要更多时直接从包导出里补，键名保持与包内函数名一致。</p>
 */

import type { Figure, HairlineOptions } from "@lucasmarkes/hairline";

/** 图形键 → hairline 的挂载函数 */
export type HairlineFigureMount = (el: HTMLElement, options?: HairlineOptions) => Figure;

/**
 * 可选图形：键名即配置里写的值，值是「取挂载函数」的懒加载器。
 *
 * <p><b>必须是懒引用。</b>图库约 200KB，若在这里 {at code import} 具名函数，
 * 它会跟着任何碰到 ReEmpty 的页面进主包（首屏也会下载）。改成 {at code import()}
 * 之后，图库只随首个真正需要它的组件（空状态动画图 / 加载动画的矢量款）一起下来；
 * 同一页面多处使用由打包器共享同一个分包，不会重复下载。</p>
 */
export const HAIRLINE_FIGURES = {
  plot: () => import("@lucasmarkes/hairline").then((m) => m.plot),
  phosphor: () => import("@lucasmarkes/hairline").then((m) => m.phosphor),
  slow: () => import("@lucasmarkes/hairline").then((m) => m.slow),
  terrain: () => import("@lucasmarkes/hairline").then((m) => m.terrain),
  riffle: () => import("@lucasmarkes/hairline").then((m) => m.riffle),
  stack: () => import("@lucasmarkes/hairline").then((m) => m.stack),
  branches: () => import("@lucasmarkes/hairline").then((m) => m.branches),
  drawer: () => import("@lucasmarkes/hairline").then((m) => m.drawer),
  vault: () => import("@lucasmarkes/hairline").then((m) => m.vault),
  turntable: () => import("@lucasmarkes/hairline").then((m) => m.turntable),
  sieve: () => import("@lucasmarkes/hairline").then((m) => m.sieve),
  query: () => import("@lucasmarkes/hairline").then((m) => m.query),
} satisfies Record<string, () => Promise<HairlineFigureMount>>;

/** 合法的图形键 */
export type HairlineFigureKey = keyof typeof HAIRLINE_FIGURES;

/** 全部合法键（顺序即主题配置里的展示顺序） */
export const HAIRLINE_FIGURE_KEYS = Object.keys(HAIRLINE_FIGURES) as HairlineFigureKey[];

/** 默认图形：与接入多图形之前的行为一致 */
export const DEFAULT_HAIRLINE_FIGURE: HairlineFigureKey = "plot";

/** 把任意值收窄成合法键名；非法值回落默认 */
export function normalizeHairlineFigure(value: unknown): HairlineFigureKey {
  // 必须用 hasOwn，不能用 `in`：后者会命中原型链上的 "toString" / "__proto__"，
  // 拿到的值不是函数，挂载时会当场 TypeError。
  return typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(HAIRLINE_FIGURES, value)
    ? (value as HairlineFigureKey)
    : DEFAULT_HAIRLINE_FIGURE;
}

/**
 * 取某个图形键对应的挂载函数（键名非法时回落默认）。
 *
 * <p>ReEmpty 与加载动画都需要同一个图形；调用方拿到的是库函数本身，
 * 不依赖 ReEmpty 的组件结构。</p>
 */
export async function hairlineFigureOf(name: unknown): Promise<HairlineFigureMount> {
  return HAIRLINE_FIGURES[normalizeHairlineFigure(name)]();
}

/** 在元素上挂载指定图形（键名非法时自动回落） */
export async function mountHairlineFigure(
  el: HTMLElement,
  name: unknown,
  options?: HairlineOptions,
): Promise<Figure> {
  const mount = await hairlineFigureOf(name);
  return mount(el, options);
}
