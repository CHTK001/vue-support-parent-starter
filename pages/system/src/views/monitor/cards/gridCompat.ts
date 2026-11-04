/**
 * grid-layout-plus 的类型兼容层（与首页 {@code views/home/gridCompat.ts} 同源）
 *
 * <p>该库把 {@code cols}（列数）误声明成了 {@code Breakpoints}：</p>
 * <ul>
 *   <li>{@code dist/components/types.d.ts} —— {@code cols?: Breakpoints}</li>
 *   <li>{@code Breakpoints = Record<Breakpoint, number>}（断点宽度映射表）</li>
 * </ul>
 * <p>运行时显然接受数字 —— 官方用法就是 {@code :cols="12"}，首页两处也一直这么写并正常工作；
 * 只是类型层把「列数」与「断点表」写混了（应为 {@code cols?: number}）。</p>
 *
 * <p>不改 node_modules，只在此处集中做一次断言并说明来源；库修好后把断言删掉即可。</p>
 *
 * <p>组件与类型统一从 {@code @repo/theme/koi/views/home/gridLayout} 取：{@code grid-layout-plus}
 * 是 theme 的依赖，业务页面包直接 import 会在 pnpm 的严格 node_modules 下解析失败。</p>
 */
import type { Breakpoints } from "@repo/theme/koi/views/home/gridLayout";
import { MONITOR_GRID_COLS } from "./types";

/** 网格列数（12 列，与 {@link MONITOR_GRID_COLS} 保持一致） */
export const GRID_COLS = MONITOR_GRID_COLS as unknown as Breakpoints;
