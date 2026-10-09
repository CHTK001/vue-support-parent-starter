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

import { colIndexToLetter } from "./xlsxSelectStats";

/** 选区变化事件名（composed，可穿透 Shadow DOM） */
export const FV_SELECTION_EVENT = "fv-selection-change";

/* ================================================================== *
 *  稀疏表格右侧补列（窄表格铺满容器宽）                                *
 *                                                                     *
 *  e-virt-table 对 widthFillDisable:true 的列不参与“铺满”分摊，        *
 *  file-viewer 的 spreadsheet 渲染器给所有数据列都开了它，因此内容窄于   *
 *  容器时表格宽度=内容宽、右侧留白。这里 patch {@code loadColumns}：     *
 *  先走原逻辑装入基础列量出内容宽，若容器仍有剩余，则追加 N 个          *
 *  {@code widthFillDisable:false} 的“补列”再装一次 —— 此时            *
 *  resizeNum>0 → stageWidth=容器宽，且后续 resizeAllColumn 只会把       *
 *  额外宽度分摊给补列（数据列宽保持忠实还原）。补列是空列：key 用       *
 *  {@code c100000+}（远超 xlsx 16384 列上限，永不与真实列 key 撞号），  *
 *  getDataColumnIndex 会把它解析成超大下标 → cellCache/搜索/溢出镜像    *
 *  全部落空，统计与复制只遍历 sheet.cells/真实行数据，不受影响。         *
 * </p>                                                                 *
 *                                                                     *
 *  <p><b>幂等性</b>：渲染器每次 loadColumns 传的都是 fresh 基础列       *
 *  （getDisplayColumns 每次 clone），补列仅存在于传给 e-virt 的数组副本  *
 *  中，不会回流到 virtualState.columns；ResizeObserver →               *
 *  syncTableLayout → loadColumns 会按新容器宽重算补列。</p>             *
 * ================================================================== */

/** 补列 key 起始下标（xlsx 列上限 16384，此处远超，保证不与真实数据列撞号） */
const FILLER_KEY_BASE = 100000;

/** 补列目标宽度（px/列）：剩余宽按 ~100px 一列切分，最后一列吃掉余数 */
const FILLER_TARGET_WIDTH = 100;

/** 是否已安装补列补丁（幂等，一个页面只装一次） */
let fillerInstalled = false;

/** 判断是否为本补丁生成的补列 key（c100000+） */
function isFillerKey(key: unknown): boolean {
  if (typeof key !== "string" || !key.startsWith("c")) return false;
  const n = Number(key.slice(1));
  return Number.isInteger(n) && n >= FILLER_KEY_BASE;
}

/** 补列列配置（形状对齐渲染器 buildColumns 的数据列，仅 widthFillDisable 关闭） */
type FillerColumn = {
  key: string;
  title: string;
  width: number;
  widthFillDisable?: boolean;
  renderType?: string;
  headerAlign?: string;
  headerVerticalAlign?: string;
  align?: string;
  verticalAlign?: string;
  overflowTooltipShow?: boolean;
  overflowTooltipHeaderShow?: boolean;
};

/** e-virt-table 实例上补列补丁需要触及的字段形状 */
type EVirtFillHeader = { width?: number };
type EVirtFillConfig = {
  scrollbarMode?: string;
  SCROLLBAR_MODE?: string;
  SCROLLER_TRACK_SIZE?: number;
};
type EVirtFillCtx = {
  containerElement?: HTMLElement;
  config?: EVirtFillConfig;
};
type EVirtFillLike = {
  header?: EVirtFillHeader;
  ctx?: EVirtFillCtx;
};

/**
 * 在原生 loadColumns 之后按需追加补列并重装。
 *
 * <p>量宽口径与 e-virt {@code header.init} 完全一致：stageWidth（resizeNum>0 时）
 * = floor(容器宽)，visibleWidth = stageWidth - gap；gap 按 {@code B(config)}
 * 复刻（renderer 未设 scrollbarMode / SCROLLER_TRACK_SIZE → 0）。
 * 补列宽度总和精确等于剩余宽 → l=0，不触发 resizeAllColumn 分摊/最小宽度中止。</p>
 *
 * @param self 表实例（this）
 * @param base 基础列（已剔除旧补列）
 * @param original 原生 loadColumns
 */
function appendFillerColumns(
  self: EVirtFillLike,
  base: unknown[],
  original: (...args: unknown[]) => unknown,
): void {
  // 空表格（渲染器清空时传 []）不补列，保持清空语义
  if (!Array.isArray(base) || base.length === 0) return;
  const header = self.header;
  const container = self.ctx?.containerElement;
  if (!header || typeof header.width !== "number" || !container) return;

  const cfg = self.ctx?.config ?? {};
  const innerScrollbar = (cfg.scrollbarMode ?? cfg.SCROLLBAR_MODE) === "inner";
  const gap = innerScrollbar ? 0 : cfg.SCROLLER_TRACK_SIZE || 0;

  const containerWidth = Math.floor(container.getBoundingClientRect().width);
  // 容器隐藏（宽 0）时跳过；显示后 ResizeObserver 会重跑 loadColumns 补上
  if (containerWidth <= 0) return;

  const deficit = containerWidth - gap - header.width;
  // 宽表格（内容 ≥ 容器）：原逻辑已铺满（stageWidth=floor(容器宽)），无需补列
  if (deficit <= 0) return;

  // 补列数量与标题口径：跟随数据列（跳过 index 列）——列名为纯字母 → 续 Excel 列字母，否则续数字
  const dataCols = base.filter(
    (c): c is Record<string, unknown> =>
      !!c && typeof c === "object" && (c as { key?: unknown }).key !== "__index",
  );
  const dataCount = dataCols.length;
  const lastTitle = dataCount > 0 ? String(dataCols[dataCount - 1].title ?? "") : "";
  const useLetters = /^[A-Za-z]+$/.test(lastTitle);

  const count = Math.max(1, Math.ceil(deficit / FILLER_TARGET_WIDTH));
  const each = Math.floor(deficit / count);
  const fillers: FillerColumn[] = [];
  for (let i = 0; i < count; i++) {
    const width = i === count - 1 ? deficit - each * (count - 1) : each;
    fillers.push({
      key: `c${FILLER_KEY_BASE + i}`,
      title: useLetters ? colIndexToLetter(dataCount + i) : `${dataCount + i + 1}`,
      width,
      // 关键：仅补列参与宽度分摊 → resizeNum>0 → stageWidth=容器宽；
      // 后续容器变化时 resizeAllColumn 也只会拉伸补列，数据列宽保持忠实还原
      widthFillDisable: false,
      renderType: "both",
      headerAlign: "center",
      headerVerticalAlign: "middle",
      align: "left",
      verticalAlign: "middle",
      overflowTooltipShow: true,
      overflowTooltipHeaderShow: true,
    });
  }
  original.call(self, [...base, ...fillers]);
}

/**
 * 安装补列补丁（幂等）。
 *
 * <p>patch {@code EVirtTable.prototype.loadColumns}：先剔除可能残留的旧补列
 * （防御，正常路径渲染器只传基础列）、走原逻辑装入，再按容器剩余宽追加补列
 * 重装一次。draw 有 rAF 去抖，双装不产生额外绘制。</p>
 *
 * @returns 安装成功返回 true；e-virt-table 不可用或无 loadColumns 方法返回 false
 */
export async function installEVirtTableFillerColumns(): Promise<boolean> {
  if (fillerInstalled) return true;
  try {
    // 路径必须与 renderer-spreadsheet 内部 import 完全一致（同一模块实例）
    const mod = (await import("e-virt-table/dist/index.es.js")) as {
      default?: { prototype?: unknown };
    };
    const proto = mod.default?.prototype as Record<string, unknown> | undefined;
    const originalLoadColumns = proto?.loadColumns as
      | ((...args: unknown[]) => unknown)
      | undefined;
    if (typeof originalLoadColumns !== "function") return false;
    proto!.loadColumns = function patchedLoadColumns(
      this: EVirtFillLike,
      ...args: unknown[]
    ): unknown {
      const raw = args[0];
      // 防御性剔除旧补列（正常路径无补列），保证多次调用幂等
      const base = Array.isArray(raw)
        ? (raw as unknown[]).filter(
            (c) => !(c && typeof c === "object" && isFillerKey((c as { key?: unknown }).key)),
          )
        : raw;
      const result = (originalLoadColumns as (...a: unknown[]) => unknown).call(this, base);
      try {
        appendFillerColumns(this, Array.isArray(base) ? base : [], originalLoadColumns);
      } catch (e) {
        // 补列失败只是右侧留白（原状），不影响预览主流程
        console.warn("[eVirtTableFillerColumns] 补列失败（忽略）", e);
      }
      return result;
    };
    fillerInstalled = true;
    return true;
  } catch (e) {
    console.warn("[eVirtTableFillerColumns] 安装失败", e);
    return false;
  }
}

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
