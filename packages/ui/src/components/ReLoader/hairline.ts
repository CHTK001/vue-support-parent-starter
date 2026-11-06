/**
 * 线稿加载动画的挂载入口（ReLoader 与主题配置预览共用）。
 *
 * <p>为什么单独一层：{@code @lucasmarkes/hairline} 约 200KB，只能动态引入；
 * 两个调用点各写一遍「动态 import + 配色覆盖」必然漂移，所以收在这里。
 * 本文件被 {@code import()} 时才执行，库也就随这个分包一起下来，
 * 首屏 loader.js 与普通加载态都不背它。</p>
 */
import type { Figure, HairlineOptions } from "@lucasmarkes/hairline";
import { mountHairlineFigure } from "../ReEmpty/figures";

/**
 * 把库的配色接到当前主题上。
 *
 * <p>必须写成**内联自定义属性**：库把默认配色写在 {@code :where([data-hairline])}
 * 规则里，普通声明盖不住它；内联值会沿 DOM 继承给 svg 内部的每一条线。
 * {@code --sla-c} 由调用方（ReLoader 的 animVars / 预览的卡片样式）下发。</p>
 */
export function applyHairlineTheme(host: HTMLElement): void {
  const tint = "var(--sla-c, var(--el-color-primary, #406eeb))";
  // 底板透明：加载遮罩下面就是页面背景，库自带的深/浅底会在浅色页面上留一块色块
  host.style.setProperty("--hairline-plate", "transparent");
  host.style.setProperty("--hairline-hi", tint);
  host.style.setProperty("--hairline-edge", `color-mix(in srgb, ${tint} 62%, transparent)`);
  host.style.setProperty("--hairline-mid", `color-mix(in srgb, ${tint} 38%, transparent)`);
  host.style.setProperty("--hairline-lo", `color-mix(in srgb, ${tint} 22%, transparent)`);
}

/**
 * 在宿主上挂一款图形（配色已接好）。
 *
 * @param host   宿主元素，库会在它身上写 {@code data-hairline} 并塞 svg
 * @param figure 图形键（非法值由 figures.ts 兜底成 plot）
 * @param options 其余库选项（play / label 等）
 */
export async function mountLoaderFigure(
  host: HTMLElement,
  figure: string,
  options?: HairlineOptions,
): Promise<Figure> {
  // 配色先接上：图库分包还在路上时，宿主已经拿到主题色，不会有先后闪烁
  applyHairlineTheme(host);
  const made = await mountHairlineFigure(host, figure, { theme: "auto", ...options });
  // 标记位：库绑定成功后才打，CSS 据此隐藏同位置的近似图（见 animations.ts 的 .sla.has-hl）
  host.classList.add("has-hl");
  return made;
}
