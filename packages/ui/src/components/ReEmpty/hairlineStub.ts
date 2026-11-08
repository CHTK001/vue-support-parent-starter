/**
 * `@lucasmarkes/hairline` 开发环境占位 stub。
 *
 * <p>该包在 {@code packages/ui/package.json} 中声明为 {@code ^0.5.1}，但当前 workspace 的
 * store（{@code node_modules/.pnpm}）里缺少物理副本，且集成工具链的
 * {@code pnpm.patchedDependencies} 项（{@code @file-viewer/core} / {@code @file-viewer/renderer-text}）
 * 对应的 {@code patches/} 文件也缺失，使得跑 {@code pnpm install / pnpm add} 时直接 ENOENT。</p>
 *
 * <p>{@code plot} 仅被 ReEmpty 的 {@code layout="plot"} 布局使用（ReTable 的虚线空状态图）——
 * 可选功能。本 stub 提供 ReEmpty 调用方的最小契约（{@code update} / {@code destroy}），不实现
 * 任何实际绘图；真实环境修复依赖后（补齐 store 或还原 patches），把
 * {@code vite.config.ts} alias 中该条目删去即可恢复成真图。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
export function plot(
  _el: HTMLElement,
  _options?: { theme?: string; label?: string },
): {
  update: (o: Record<string, unknown>) => void;
  destroy: () => void;
} {
  return {
    update() {},
    destroy() {},
  };
}

/** 与 {@code @lucasmarkes/hairline} 的 `Figure` 同构的轻类型 */
export type Figure = {
  update: (o: Record<string, unknown>) => void;
  destroy: () => void;
};
