/**
 * grid-layout-plus 的类型兼容层
 *
 * <p>该库把 `cols`（列数）误声明成了 `Breakpoints`：</p>
 *   - `dist/components/types.d.ts:20`  `cols?: Breakpoints`
 *   - `dist/components/grid-layout.vue.d.ts:164`  `cols: import('..').Breakpoints`
 *   - 而 `Breakpoints = Record<Breakpoint, number>`（断点宽度映射表）
 *
 * <p>运行时显然接受数字 —— 官方用法就是 {@code :cols="12"}，本仓两处也一直这么写并正常工作；
 * 只是类型层把「列数」与「断点表」写混了（应为 {@code cols?: number}）。</p>
 *
 * <p>不修改 node_modules，只在此处集中做一次断言并说明来源：两处 {@code :cols} 由此共用同一常量，
 * 避免各自写 {@code as unknown} 后悄悄漂移。库修好后把断言删掉即可。</p>
 */
import type { Breakpoints } from "grid-layout-plus";

/** 网格列数（12 列，与两处 GridLayout 的 :cols 保持一致） */
export const GRID_COLS = 12 as unknown as Breakpoints;
