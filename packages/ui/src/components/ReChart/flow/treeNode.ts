/**
 * ReChartFlowBuilder —— 基于 @antv/g6 复刻官方「资金流向图」(fund-flow) 示例。
 *
 * 参考：https://g6.antv.antgroup.com/zh/examples/scene-case/default/fund-flow/
 * 版本对齐：@antv/g6@5.1.1（与官方示例 version 一致）。
 *
 * 本文件把官方示例的自定义节点（tree-node）提取成可复用注册函数，
 * 供 ReChartFlow 组件按需调用；注册幂等，规避热更新重复注册告警。
 *
 * 节点的沾边字段用「宽松 any」访问 G6 运行时提供的实例 API
 * （context.model / shapeMap / upsert / getSize 等），避免与 G6 内部类型强耦合，
 * 保证组件库升级 G6 大版本时不因 TS 类型崩掉。
 */
import { Rect as GRect, Text as GText } from "@antv/g";
import {
  Badge,
  CommonEvent,
  ExtensionCategory,
  iconfont,
  Label,
  Rect,
  register,
} from "@antv/g6";

export { GRect, GText };

/** 官方调色板（状态 → 涨跌色） */
export const FLOW_STATUS_COLORS: Record<string, string> = {
  B: "#1783FF",
  R: "#F46649",
  Y: "#DB9D0D",
  G: "#60C42D",
  DI: "#A7A7A7",
};
export const FLOW_GREY = "#CED4D9";

/** 流线节点业务字段（对应官方决策树 JSON 字段） */
export interface FlowNodeDatum {
  id?: string;
  name?: string;
  label?: string;
  currency?: string;
  variableValue?: number;
  variableUp?: boolean;
  variableName?: string;
  status?: string;
  rate?: number;
}

let registered = false;
let iconCssInjected = false;

/** 注入 iconfont 字体（等 mount 后惰性执行，避免 SSR 下崩溃） */
export function ensureIconFont(): void {
  if (iconCssInjected || typeof document === "undefined") return;
  iconCssInjected = true;
  try {
    if (iconfont?.css) {
      const style = document.createElement("style");
      style.innerHTML = `@import url('${iconfont.css}');`;
      document.head.appendChild(style);
    }
  } catch {
    // 字体注入失败不影响图主体渲染
  }
}

/** G6 节点构造 options 类型（宽松） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

/**
 * 注册自定义节点 tree-node（幂等）。
 * 需要在 Graph 实例化之前调用；ReChartFlow 会在 onMounted 前调用。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerTreeNode(): void {
  if (registered) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class TreeNode extends (Rect as any) {
    constructor(options: AnyObj) {
      super(options);
    }

    get nodeDatum(): AnyObj {
      const ctx = (this as AnyObj).context;
      return ctx?.model?.getNodeLikeDatum?.((this as AnyObj).id) ?? (this as AnyObj).data ?? {};
    }

    get childData(): AnyObj[] {
      const ctx = (this as AnyObj).context;
      return ctx?.model?.getChildrenData?.((this as AnyObj).id) ?? (this as AnyObj).childrenData ?? [];
    }

    getSizeOf(attributes: AnyObj): [number, number] {
      const s = Array.isArray(attributes?.size) ? attributes.size : [202, 60];
      return [s[0] ?? 202, s[1] ?? 60];
    }

    shapeX(name: string, which: "max" | "min"): number {
      const b = (this as AnyObj).shapeMap?.[name]?.getLocalBounds?.();
      if (!b) return 0;
      return which === "max" ? b.max?.[0] ?? 0 : b.min?.[0] ?? 0;
    }

    getLabelStyle(attributes: AnyObj) {
      const [width, height] = this.getSizeOf(attributes);
      return {
        x: -width / 2 + 8,
        y: -height / 2 + 16,
        text: this.nodeDatum.name ?? this.nodeDatum.id ?? "",
        fontSize: 12,
        opacity: 0.85,
        fill: "#000",
        cursor: "pointer",
      };
    }

    getPriceStyle(attributes: AnyObj) {
      const [width, height] = this.getSizeOf(attributes);
      return {
        x: -width / 2 + 8,
        y: height / 2 - 8,
        text: this.nodeDatum.label ?? "",
        fontSize: 16,
        fill: "#000",
        opacity: 0.85,
      };
    }
    drawPrice(attributes: AnyObj, container: AnyObj) {
      (this as AnyObj).upsert?.("price", GText, this.getPriceStyle(attributes), container);
    }

    getCurrencyStyle(attributes: AnyObj) {
      const [, height] = this.getSizeOf(attributes);
      return {
        x: this.shapeX("price", "max") + 4,
        y: height / 2 - 8,
        text: this.nodeDatum.currency ?? "",
        fontSize: 12,
        fill: "#000",
        opacity: 0.75,
      };
    }
    drawCurrency(attributes: AnyObj, container: AnyObj) {
      (this as AnyObj).upsert?.("currency", GText, this.getCurrencyStyle(attributes), container);
    }

    getPercentStyle(attributes: AnyObj) {
      const [width, height] = this.getSizeOf(attributes);
      const d = this.nodeDatum;
      const color = FLOW_STATUS_COLORS[d.status ?? "DI"] ?? FLOW_STATUS_COLORS.DI;
      return {
        x: width / 2 - 4,
        y: height / 2 - 8,
        text: `${((Number(d.variableValue) || 0) * 100).toFixed(2)}%`,
        fontSize: 12,
        textAlign: "right" as const,
        fill: color,
      };
    }
    drawPercent(attributes: AnyObj, container: AnyObj) {
      (this as AnyObj).upsert?.("percent", GText, this.getPercentStyle(attributes), container);
    }

    getTriangleStyle(attributes: AnyObj) {
      const d = this.nodeDatum;
      const color = FLOW_STATUS_COLORS[d.status ?? "DI"] ?? FLOW_STATUS_COLORS.DI;
      const [, height] = this.getSizeOf(attributes);
      const pMinX = this.shapeX("percent", "min");
      return {
        fill: color,
        x: d.variableUp ? pMinX - 18 : pMinX,
        y: height / 2 - 16,
        fontFamily: "iconfont",
        fontSize: 16,
        text: "\ue62d",
        transform: d.variableUp ? [] : [["rotate", 180]],
      };
    }
    drawTriangle(attributes: AnyObj, container: AnyObj) {
      (this as AnyObj).upsert?.("triangle", Label, this.getTriangleStyle(attributes), container);
    }

    getVariableStyle(attributes: AnyObj) {
      const [, height] = this.getSizeOf(attributes);
      return {
        fill: "#000",
        fontSize: 12,
        opacity: 0.45,
        text: this.nodeDatum.variableName ?? "",
        textAlign: "right" as const,
        x: this.shapeX("triangle", "min") - 4,
        y: height / 2 - 8,
      };
    }
    drawVariable(attributes: AnyObj, container: AnyObj) {
      (this as AnyObj).upsert?.("variable", GText, this.getVariableStyle(attributes), container);
    }

    getCollapseStyle(attributes: AnyObj) {
      if ((this.childData ?? []).length === 0) return false;
      const { collapsed } = attributes;
      const [width] = this.getSizeOf(attributes);
      return {
        backgroundFill: "#fff",
        backgroundHeight: 16,
        backgroundLineWidth: 1,
        backgroundRadius: 0,
        backgroundStroke: FLOW_GREY,
        backgroundWidth: 16,
        cursor: "pointer",
        fill: FLOW_GREY,
        fontSize: 16,
        text: collapsed ? "+" : "-",
        textAlign: "center" as const,
        textBaseline: "middle" as const,
        x: width / 2,
        y: 0,
      };
    }
    drawCollapse(attributes: AnyObj, container: AnyObj) {
      const style = this.getCollapseStyle(attributes);
      if (style === false) return;
      const btn = (this as AnyObj).upsert?.("collapse", Badge, style, container);
      if (btn && !(btn as AnyObj).__bound__) {
        (btn as AnyObj).__bound__ = true;
        btn.addEventListener?.(CommonEvent.CLICK, () => {
          const { collapsed } = (this as AnyObj).attributes;
          const graph = (this as AnyObj).context?.graph;
          if (collapsed) graph?.expandElement?.((this as AnyObj).id);
          else graph?.collapseElement?.((this as AnyObj).id);
        });
      }
    }

    getProcessBarStyle(attributes: AnyObj) {
      const d = this.nodeDatum;
      const color = FLOW_STATUS_COLORS[d.status ?? "DI"] ?? FLOW_STATUS_COLORS.DI;
      const percent = `${Number(d.rate) * 100}%`;
      const [width, height] = this.getSizeOf(attributes);
      const radius = attributes?.radius ?? 0;
      return {
        x: -width / 2,
        y: height / 2 - 4,
        width,
        height: 4,
        radius: [0, 0, radius, radius],
        fill: `linear-gradient(to right, ${color} ${percent}, ${FLOW_GREY} ${percent})`,
      };
    }
    drawProcessBar(attributes: AnyObj, container: AnyObj) {
      (this as AnyObj).upsert?.("process-bar", GRect, this.getProcessBarStyle(attributes), container);
    }

    // 覆写主矩形底色：白底 + 灰描边（官方 fund-flow 风格）
    getKeyStyle(attributes: AnyObj) {
      const base = (Rect.prototype as AnyObj).getKeyStyle?.call(this, attributes) ?? {};
      return { ...base, fill: "#fff", lineWidth: 1, stroke: FLOW_GREY };
    }

    // 覆盖基类渲染入口：G6 的 Rect 会回调多个 draw hooks，
    // 官方示例通过覆写 getKeyStyle / render 追加多个子形。
    render(attributes: AnyObj = (this as AnyObj).parsedAttributes, container: AnyObj) {
      if (typeof (Rect.prototype as AnyObj).render === "function") {
        (Rect.prototype as AnyObj).render.call(this, attributes, container);
      }
      this.drawPrice(attributes, container);
      this.drawCurrency(attributes, container);
      this.drawPercent(attributes, container);
      this.drawTriangle(attributes, container);
      this.drawVariable(attributes, container);
      this.drawProcessBar(attributes, container);
      this.drawCollapse(attributes, container);
    }
  }

  // TreeNode 是按官方示例从 Rect(any) 扩展的自定义节点，类型检查器无法静态证明
  // 它满足 @antv/g6 register 的 Node 构造签名（Rect 已被 `as any` 包裹），
  // 这里沿用项目自身的 AnyObj/any 风格显式断言，不改变运行语义。
  register(ExtensionCategory.NODE, "tree-node", TreeNode as unknown as new (...args: any[]) => any);
  registered = true;
}