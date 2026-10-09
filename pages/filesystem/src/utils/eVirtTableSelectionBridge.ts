/**
 * e-virt-table 选区事件桥接（@file-viewer 版）。
 *
 * <p>file-viewer 不通过组件 API 暴露选区事件；其 spreadsheet 渲染器底层用
 * e-virt-table，选区交互逻辑放在内部类 Ei（实例挂在主实例的 {@code selector}
 * 属性上）。这里 patch 主类（默认导出）的 {@code draw}（构造期间必然调用），
 * 在首次调用时给 {@code instance.selector} 打实例级补丁：包装
 * {@code setSelector} / {@code clearSelector}，把 {@code ctx.selector} 的
 * 行列范围以 composed CustomEvent 派发到 {@code containerElement}，
 * 外部（含 Shadow DOM 外）可监听。</p>
 *
 * <p><b>模块实例一致性（务必同版本）</b>：补丁 import 的路径必须与
 * {@code @file-viewer/renderer-spreadsheet} 内部 import <b>完全一致</b>
 * （{@code 'e-virt-table/dist/index.es.js'}），且 pnpm 必须把两者解析到
 * 同一物理实例。{@code pnpm-workspace.yaml} 已把 {@code e-virt-table}
 * 钉到 {@code 1.4.15}（与 renderer-spreadsheet 的内部依赖严格同版本），
 * 否则 pnpm 会装出两个实例、补丁打不到渲染器实际使用的那张表。</p>
 *
 * <p>坐标口径（已 spike 验证）：e-virt-table 的 colIndex 直接对应 xlsx
 * 列序号（0=A），行 yArr[0] 0 基 = 第 1 行；<b>无偏移</b>。
 * 拖选 B3:D3 → {@code xArr=[1,3], yArr=[2,2]} → sum=53 / count=3。</p>
 *
 * @author CH
 * @since 2026/10/09
 */

/** 选区变化事件名（composed，可穿透 Shadow DOM） */
export const FV_SELECTION_EVENT = "fv-selection-change";

/** e-virt-table 实例上需要触及的字段形状 */
type EVirtCtx = {
  containerElement?: HTMLElement;
  selector?: { xArr?: number[]; yArr?: number[] };
};
type EVirtSelLike = {
  setSelector?: (...args: unknown[]) => unknown;
  clearSelector?: (...args: unknown[]) => unknown;
  ctx?: EVirtCtx;
  __fvPatched?: boolean;
};
type EVirtLike = { selector?: EVirtSelLike };

/** 是否已安装（幂等，一个页面只装一次） */
let installed = false;

/**
 * 把当前选区以 CustomEvent 派发到容器元素。
 *
 * @param eiSelf Ei 实例（this）
 * @param clear 是否为清除选区（true → detail=null）
 */
function dispatchFvSelection(eiSelf: EVirtSelLike, clear = false): void {
  const ctx = eiSelf?.ctx;
  const container = ctx?.containerElement;
  const st = ctx?.selector;
  const hasSel =
    !clear &&
    Array.isArray(st?.xArr) &&
    Array.isArray(st?.yArr) &&
    (st?.xArr as number[])[0] >= 0;
  const detail = hasSel
    ? { xArr: [...(st?.xArr as number[])], yArr: [...(st?.yArr as number[])] }
    : null;
  if (!container) return;
  container.dispatchEvent(
    new CustomEvent(FV_SELECTION_EVENT, { bubbles: true, composed: true, detail }),
  );
}

/**
 * 安装选区桥接补丁（幂等）。
 *
 * <p>动态 import e-virt-table，patch 其默认导出的 {@code prototype.draw}。
 * 必须在 file-viewer 创建表格实例之前完成（在 {@code ensureFileViewerLoaded}
 * 里与 vue3 / preset-office 并行加载，先于渲染）。</p>
 *
 * @returns 安装成功返回 true；e-virt-table 不可用或无 draw 方法返回 false
 */
export async function installEVirtTableSelectionBridge(): Promise<boolean> {
  if (installed) return true;
  try {
    // 路径必须与 renderer-spreadsheet 内部 import 完全一致（同一模块实例）
    const mod = (await import("e-virt-table/dist/index.es.js")) as {
      default?: { prototype?: unknown };
    };
    const EVirtTable = mod.default;
    const proto = EVirtTable?.prototype as Record<string, unknown> | undefined;
    const originalDraw = proto?.draw as ((...args: unknown[]) => unknown) | undefined;
    if (typeof originalDraw !== "function") return false;
    proto!.draw = function patchedDraw(this: EVirtLike, ...args: unknown[]): unknown {
      const sel = this.selector;
      if (sel && !sel.__fvPatched) {
        sel.__fvPatched = true;
        const originalSet = sel.setSelector;
        if (typeof originalSet === "function") {
          sel.setSelector = function patchedSetSelector(this: EVirtSelLike, ...a: unknown[]): unknown {
            const result = (originalSet as (...a: unknown[]) => unknown).apply(this, a);
            dispatchFvSelection(this);
            return result;
          };
        }
        const originalClear = sel.clearSelector;
        if (typeof originalClear === "function") {
          sel.clearSelector = function patchedClearSelector(this: EVirtSelLike, ...a: unknown[]): unknown {
            const result = (originalClear as (...a: unknown[]) => unknown).apply(this, a);
            dispatchFvSelection(this, true);
            return result;
          };
        }
      }
      return (originalDraw as (...a: unknown[]) => unknown).apply(this, args);
    };
    installed = true;
    return true;
  } catch (e) {
    console.warn("[eVirtTableSelectionBridge] 安装失败", e);
    return false;
  }
}
