/**
 * LogicFlow 自定义节点定义
 * - 4 个连接点（上、右、下、左）
 * - 支持 resize (resizable = true)
 * - 支持 rotation (rotatable = true)
 */
import { HtmlNode, HtmlNodeModel } from "@logicflow/core";
import type { LogicFlow } from "@logicflow/core";

// ── 类型颜色 ──
const TYPE_COLORS: Record<string, string> = {
  START: "#10b981",
  END: "#ef4444",
  PAGE_ACCESS: "#3b82f6",
  AI_PAGE_ACCESS: "#7c3aed",
  BROWSER_AGENT: "#8b5cf6",
  URL_PARSE: "#6366f1",
  DATA_PARSE: "#8b5cf6",
  SAVE_RESULT: "#14b8a6",
  ASYNC_SAVE: "#0891b2",
  CONDITION: "#f59e0b",
  DOWNLOADER: "#64748b",
  SUB_FLOW: "#06b6d4",
  HUMAN_INTERVENE: "#f97316",
  IMAGE: "#a855f7",
};

// ── SVG 图标 ──
const TYPE_SVGS: Record<string, string> = {
  START:
    '<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16ZM10.622 8.415l4.879 3.252a.4.4 0 0 1 0 .666l-4.88 3.252a.4.4 0 0 1-.621-.332V8.747a.4.4 0 0 1 .622-.332Z"/>',
  PAGE_ACCESS:
    '<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Zm-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.008 8.008 0 0 0 5.648 6.667ZM10.03 13c.151 2.439.848 4.73 1.97 6.752A15.905 15.905 0 0 0 13.97 13h-3.94Zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.008 8.008 0 0 0 19.938 13ZM4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333A8.008 8.008 0 0 0 4.062 11Zm5.969 0h3.938A15.905 15.905 0 0 0 12 4.248A15.905 15.905 0 0 0 10.03 11Zm4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.008 8.008 0 0 0-5.648-6.667Z"/>',
  AI_PAGE_ACCESS:
    '<path fill="currentColor" d="M13.5 2c0 .444-.193.843-.5 1.118V5h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h5V3.118A1.5 1.5 0 1 1 13.5 2ZM6 7a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H6Zm-4 3H0v6h2v-6Zm20 0h2v6h-2v-6ZM9 14.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3Zm6 0a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3Z"/>',
  BROWSER_AGENT:
    '<path fill="currentColor" d="m10.364 19.833l1.93-3.342a4.499 4.499 0 0 1-4.234-2.315L4.795 8.52a8.003 8.003 0 0 0 5.57 11.313Zm2.226.146A8 8 0 0 0 19.602 9.5h-3.86c.479.715.758 1.575.758 2.5c0 .848-.234 1.64-.642 2.318l-3.268 5.66Zm1.553-6.691l.022-.038a2.5 2.5 0 1 0-4.354-.042l.024.042a2.499 2.499 0 0 0 4.308.037Zm-8.108-6.62l1.928 3.34A4.5 4.5 0 0 1 12 7.5h6.615A7.992 7.992 0 0 0 12 4a7.98 7.98 0 0 0-5.965 2.669ZM12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Z"/>',
  URL_PARSE:
    '<path fill="currentColor" d="m18.364 15.535l-1.414-1.414l1.414-1.414a5 5 0 0 0-7.07-7.071L9.878 7.05L8.465 5.636l1.414-1.414a7 7 0 0 1 9.9 9.9l-1.415 1.413Zm-2.828 2.829l-1.414 1.414a7 7 0 1 1-9.9-9.9l1.414-1.414l1.415 1.414l-1.415 1.415a5 5 0 0 0 7.071 7.07l1.415-1.413l1.414 1.414Zm-.707-10.607l1.414 1.414l-7.071 7.072l-1.414-1.415l7.07-7.07Z"/>',
  DATA_PARSE:
    '<path fill="currentColor" d="m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617Zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15Zm-3.847-8.699a2 2 0 1 0 2.646 2.646a4 4 0 1 1-2.646-2.646Z"/>',
  SAVE_RESULT:
    '<path fill="currentColor" d="M5 12.5c0 .313.461.858 1.53 1.393C7.914 14.585 9.877 15 12 15c2.123 0 4.086-.415 5.47-1.107c1.069-.535 1.53-1.08 1.53-1.393v-2.171C17.35 11.349 14.827 12 12 12s-5.35-.652-7-1.671V12.5Zm14 2.829C17.35 16.349 14.827 17 12 17s-5.35-.652-7-1.671V17.5c0 .313.461.858 1.53 1.393C7.914 19.585 9.877 20 12 20c2.123 0 4.086-.415 5.47-1.107c1.069-.535 1.53-1.08 1.53-1.393v-2.171ZM3 17.5v-10C3 5.015 7.03 3 12 3s9 2.015 9 4.5v10c0 2.485-4.03 4.5-9 4.5s-9-2.015-9-4.5Zm9-7.5c2.123 0 4.086-.415 5.47-1.107C18.538 8.358 19 7.813 19 7.5c0-.313-.461-.858-1.53-1.393C16.085 5.415 14.123 5 12 5c-2.123 0-4.086.415-5.47 1.107C5.461 6.642 5 7.187 5 7.5c0 .313.461.858 1.53 1.393C7.914 9.585 9.877 10 12 10Z"/>',
  ASYNC_SAVE:
    '<path fill="currentColor" d="M7 19v-6h10v6h2V7.828L16.172 5H5v14h2ZM4 3h13l4 4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm5 12v4h6v-4H9Z"/>',
  CONDITION:
    '<path fill="currentColor" d="M7.105 15.21A3.001 3.001 0 1 1 5 15.17V8.83a3.001 3.001 0 1 1 2 0V12c.836-.628 1.874-1 3-1h4a3.001 3.001 0 0 0 2.895-2.21a3.001 3.001 0 1 1 2.032.064A5.002 5.002 0 0 1 14 13h-4a3.001 3.001 0 0 0-2.895 2.21ZM6 17a1 1 0 1 0 0 2a1 1 0 0 0 0-2ZM6 5a1 1 0 1 0 0 2a1 1 0 0 0 0-2Zm12 0a1 1 0 1 0 0 2a1 1 0 0 0 0-2Z"/>',
  DOWNLOADER:
    '<path fill="currentColor" d="M13 10h5l-6 6l-6-6h5V3h2v7Zm-9 9h16v-7h2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8h2v7Z"/>',
  HUMAN_INTERVENE:
    '<path fill="currentColor" d="m17.841 15.659l.176.177l.178-.177a2.25 2.25 0 1 1 3.181 3.182L18.018 22.2l-3.359-3.359a2.25 2.25 0 1 1 3.182-3.182ZM12 14v2a6 6 0 0 0-6 6H4a8 8 0 0 1 7.75-7.996L12 14Zm0-13c3.315 0 6 2.685 6 6a5.998 5.998 0 0 1-5.775 5.996L12 13c-3.315 0-6-2.685-6-6a5.998 5.998 0 0 1 5.775-5.996L12 1Zm0 2C9.79 3 8 4.79 8 7s1.79 4 4 4s4-1.79 4-4s-1.79-4-4-4Z"/>',
  IMAGE:
    '<path fill="currentColor" d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm1 2v14h14V5H5Zm2 10h10l-3-4-2.5 3L9 11l-2 4Z"/>',
};

const SUB_FLOW_SVG =
  '<path fill="currentColor" d="M6 21.5A3.5 3.5 0 1 1 9.355 17H15v-2h2V9.242L14.757 7H9v2H3V3h6v2h5.757L18 1.756L22.243 6L19 9.241V15h2v6h-6v-2H9.355A3.502 3.502 0 0 1 6 21.5Zm0-5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-5Zm13 .5h-2v2h2v-2ZM18 4.586L16.586 6L18 7.414L19.414 6L18 4.586ZM7 5H5v2h2V5Z"/>';

const FALLBACK_SVG =
  '<path fill="currentColor" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10Z"/>';

// ── Helpers ──
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getRuntimeClass(status?: string): string {
  if (status === "RUNNING") return "lf-node--running";
  if (status === "SUCCESS") return "lf-node--success";
  if (status === "FAILED") return "lf-node--failed";
  if (status === "WAIT_MANUAL") return "lf-node--wait-manual";
  return "";
}

function getTypeColor(kind?: string): string {
  return (kind && TYPE_COLORS[kind]) || "#6b7280";
}

function getIconSvg(kind?: string): string {
  const body = (kind && TYPE_SVGS[kind]) || FALLBACK_SVG;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">${body}</svg>`;
}

function getBorderColor(status?: string, defaultColor = "#6b7280"): string {
  if (status === "RUNNING") return "#3b82f6";
  if (status === "SUCCESS") return "#22c55e";
  if (status === "FAILED") return "#ef4444";
  if (status === "WAIT_MANUAL") return "#eab308";
  return defaultColor;
}

function getStatusColor(status?: string): string {
  if (status === "SUCCESS") return "#22c55e";
  if (status === "FAILED") return "#ef4444";
  if (status === "WAIT_MANUAL") return "#eab308";
  if (status === "RUNNING") return "#3b82f6";
  return "#d1d5db";
}

function hasStatus(status?: string): boolean {
  return !!status && status !== "PENDING" && status !== "WAITING";
}

function buildTooltip(p: Record<string, any>): string {
  const rs = p.runtimeStatus || "";
  let tipText = "";
  const isError = rs === "FAILED";
  const round = p.executionRound ? parseInt(p.executionRound) : 0;
  if (rs === "RUNNING" && p.displayInfo) {
    tipText = escapeHtml(p.displayInfo);
    if (round > 0) tipText += ` — 第 ${round} 轮`;
  } else if (rs === "FAILED" && p.errorMessage)
    tipText =
      p.errorMessage.length > 25
        ? escapeHtml(p.errorMessage.substring(0, 25)) + "…"
        : escapeHtml(p.errorMessage);
  else if (rs === "SUCCESS") {
    tipText = p.displayInfo ? escapeHtml(p.displayInfo) : "执行成功";
    if (round > 0) tipText += ` — 第 ${round} 轮`;
  } else if (rs === "WAIT_MANUAL") tipText = "等待人工处理";
  if (!tipText) return "";
  return `<span class="lf-rect__tooltip ${isError ? "lf-tooltip--has-error" : ""}">${tipText}</span>`;
}

// ── Delete button helper ──
function bindDelete(
  rootEl: HTMLElement,
  eventCenter: { emit: (event: string, data: any) => void },
  nodeId: string
) {
  const delBtn = rootEl.querySelector(".lf-node__del");
  if (delBtn) {
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      eventCenter.emit("custom:node-remove", { nodeId });
    });
  }
}

// ── 全局节点默认配置 ──
let nodeDefaults = { resizable: true, rotatable: true };

export function setNodeDefaults(config: { resizable?: boolean; rotatable?: boolean }) {
  if (config.resizable !== undefined) nodeDefaults.resizable = config.resizable;
  if (config.rotatable !== undefined) nodeDefaults.rotatable = config.rotatable;
}

// ══════════════════════════════════════════════
//  RECT 节点 — 4 锚点 + resizable + rotatable
// ══════════════════════════════════════════════
export const rectNodeDef = {
  type: "flow-rect",
  view: class FlowRectView extends HtmlNode {
    setHtml(rootEl: HTMLElement) {
      const model = this.props.model;
      const p = model.properties;
      rootEl.style.overflow = "visible";

      const typeColor = getTypeColor(p.kind);
      const iconSvg = getIconSvg(p.kind);
      const statusClass = getRuntimeClass(p.runtimeStatus);
      const bdrColor = getBorderColor(p.runtimeStatus, typeColor);
      const sColor = getStatusColor(p.runtimeStatus);
      const hs = hasStatus(p.runtimeStatus);

      // htmlContent 优先：渲染自定义 HTML
      if (p.htmlContent) {
        rootEl.innerHTML = `
          <div class="lf-rect lf-rect--custom ${statusClass}" style="--clr: ${typeColor}; --bdr: ${bdrColor};">
            ${p.mode === "edit" ? '<button class="lf-node__del" type="button">×</button>' : ""}
            <div class="lf-rect__custom-body">${p.htmlContent}</div>
            <span class="lf-rect__dot" style="background: ${sColor}; ${hs ? "" : "display:none"}"></span>
            ${buildTooltip(p)}
            <div class="lf-rect__pulse"></div>
            <div class="lf-rect__pulse lf-pulse--warning"></div>
          </div>`;
        bindDelete(rootEl, model.graphModel.eventCenter, model.id);
        return;
      }

      rootEl.innerHTML = `
        <div class="lf-rect ${statusClass}" style="--clr: ${typeColor}; --bdr: ${bdrColor};">
          ${
            p.mode === "edit"
              ? '<button class="lf-node__del" type="button">×</button>'
              : ""
          }
          <div class="lf-rect__body">
            <div class="lf-rect__icon-wrap" style="background: ${typeColor}18">
              <span class="lf-rect__icon">${iconSvg}</span>
              <span class="lf-rect__spinner"></span>
            </div>
            <div class="lf-rect__info">
              <span class="lf-rect__title">${escapeHtml(p.label || "")}</span>
              <span class="lf-rect__type">${escapeHtml(p.kind || "")}</span>
            </div>
          </div>
          <span class="lf-rect__dot" style="background: ${sColor}; ${
        hs ? "" : "display:none"
      }"></span>
          ${buildTooltip(p)}
          <div class="lf-rect__pulse"></div>
          <div class="lf-rect__pulse lf-pulse--warning"></div>
        </div>
      `;

      bindDelete(rootEl, model.graphModel.eventCenter, model.id);
    }
  },
  model: class FlowRectModel extends HtmlNodeModel {
    setAttributes() {
      this.width = 210;
      this.height = 60;
      // 4 个连接点：上、右、下、左
      this.anchorsOffset = [
        [0, -this.height / 2],
        [this.width / 2, 0],
        [0, this.height / 2],
        [-this.width / 2, 0],
      ];
      this.resizable = nodeDefaults.resizable;
      this.rotatable = nodeDefaults.rotatable;
    }
    getNodeStyle() {
      const style = super.getNodeStyle();
      style.fill = "transparent";
      style.stroke = "transparent";
      return style;
    }
  },
};

// ══════════════════════════════════════════════
//  CIRCLE 节点 (START/END) — 4 锚点 + resizable + rotatable
// ══════════════════════════════════════════════
const CIRCLE_SVG: Record<string, string> = {
  START:
    '<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16ZM10.622 8.415l4.879 3.252a.4.4 0 0 1 0 .666l-4.88 3.252a.4.4 0 0 1-.621-.332V8.747a.4.4 0 0 1 .622-.332Z"/>',
  END:
    '<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16ZM9 9h6v6H9V9Z"/>',
};

function getCircleIcon(kind?: string): string {
  const body = (kind && CIRCLE_SVG[kind]) || CIRCLE_SVG.START;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none">${body}</svg>`;
}

const CIRCLE_COLORS: Record<string, string> = {
  START: "#10b981",
  END: "#ef4444",
};

function getCircleColor(kind?: string): string {
  return (kind && CIRCLE_COLORS[kind]) || "#6b7280";
}

export const circleNodeDef = {
  type: "flow-circle",
  view: class FlowCircleView extends HtmlNode {
    setHtml(rootEl: HTMLElement) {
      const model = this.props.model;
      const p = model.properties;
      rootEl.style.overflow = "visible";

      const typeColor = getCircleColor(p.kind);
      const iconSvg = getCircleIcon(p.kind);
      const statusClass = getRuntimeClass(p.runtimeStatus);
      const bdrColor = getBorderColor(p.runtimeStatus, typeColor);

      rootEl.innerHTML = `
        <div class="lf-circle ${statusClass}" style="--clr: ${typeColor}; --bdr: ${bdrColor};">
          ${
            p.mode === "edit"
              ? '<button class="lf-node__del" type="button">×</button>'
              : ""
          }
          <div class="lf-circle__inner">
            <span class="lf-circle__icon">${iconSvg}</span>
            <span class="lf-circle__spinner"></span>
          </div>
          <span class="lf-circle__label">${escapeHtml(p.label || "")}</span>
          <div class="lf-circle__pulse"></div>
        </div>
      `;

      bindDelete(rootEl, model.graphModel.eventCenter, model.id);
    }
  },
  model: class FlowCircleModel extends HtmlNodeModel {
    setAttributes() {
      this.width = 60;
      this.height = 60;
      this.anchorsOffset = [
        [0, -this.height / 2],
        [this.width / 2, 0],
        [0, this.height / 2],
        [-this.width / 2, 0],
      ];
      this.resizable = nodeDefaults.resizable;
      this.rotatable = nodeDefaults.rotatable;
    }
    getNodeStyle() {
      const style = super.getNodeStyle();
      style.fill = "transparent";
      style.stroke = "transparent";
      return style;
    }
  },
};

// ══════════════════════════════════════════════
//  DIAMOND 节点 (CONDITION) — 4 锚点 + resizable + rotatable
// ══════════════════════════════════════════════
const DIAMOND_SVG =
  '<path fill="currentColor" d="M7.105 15.21A3.001 3.001 0 1 1 5 15.17V8.83a3.001 3.001 0 1 1 2 0V12c.836-.628 1.874-1 3-1h4a3.001 3.001 0 0 0 2.895-2.21a3.001 3.001 0 1 1 2.032.064A5.002 5.002 0 0 1 14 13h-4a3.001 3.001 0 0 0-2.895 2.21ZM6 17a1 1 0 1 0 0 2a1 1 0 0 0 0-2ZM6 5a1 1 0 1 0 0 2a1 1 0 0 0 0-2Zm12 0a1 1 0 1 0 0 2a1 1 0 0 0 0-2Z"/>';

export const diamondNodeDef = {
  type: "flow-diamond",
  view: class FlowDiamondView extends HtmlNode {
    setHtml(rootEl: HTMLElement) {
      const model = this.props.model;
      const p = model.properties;
      rootEl.style.overflow = "visible";

      const typeColor = getTypeColor(p.kind) || "#f59e0b";
      const statusClass = getRuntimeClass(p.runtimeStatus);
      const bdrColor = getBorderColor(p.runtimeStatus, typeColor);

      rootEl.innerHTML = `
        <div class="lf-diamond ${statusClass}" style="--clr: ${typeColor}; --bdr: ${bdrColor};">
          ${
            p.mode === "edit"
              ? '<button class="lf-node__del" type="button">×</button>'
              : ""
          }
          <div class="lf-diamond__shell">
            <div class="lf-diamond__body">
              <span class="lf-diamond__icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">${DIAMOND_SVG}</svg></span>
              <span class="lf-diamond__spinner"></span>
            </div>
          </div>
          <span class="lf-diamond__label">${escapeHtml(p.label || "")}</span>
          <div class="lf-diamond__pulse"></div>
        </div>
      `;

      bindDelete(rootEl, model.graphModel.eventCenter, model.id);
    }
  },
  model: class FlowDiamondModel extends HtmlNodeModel {
    setAttributes() {
      this.width = 140;
      this.height = 120;
      this.anchorsOffset = [
        [0, -this.height / 2],
        [this.width / 2, 0],
        [0, this.height / 2],
        [-this.width / 2, 0],
      ];
      this.resizable = nodeDefaults.resizable;
      this.rotatable = nodeDefaults.rotatable;
    }
    getNodeStyle() {
      const style = super.getNodeStyle();
      style.fill = "transparent";
      style.stroke = "transparent";
      return style;
    }
  },
};

// ══════════════════════════════════════════════
//  SUBFLOW 节点 — 4 锚点 + resizable + rotatable
// ══════════════════════════════════════════════
export const subflowNodeDef = {
  type: "flow-subflow",
  view: class FlowSubFlowView extends HtmlNode {
    setHtml(rootEl: HTMLElement) {
      const model = this.props.model;
      const p = model.properties;
      rootEl.style.overflow = "visible";

      const statusClass = getRuntimeClass(p.runtimeStatus);
      const bdrColor = getBorderColor(p.runtimeStatus, "#99f6e4");
      const sColor = getStatusColor(p.runtimeStatus);
      const hs = hasStatus(p.runtimeStatus);

      rootEl.innerHTML = `
        <div class="lf-subflow ${statusClass}" style="--clr: #06b6d4; --bdr: ${bdrColor};">
          ${
            p.mode === "edit"
              ? '<button class="lf-node__del" type="button">×</button>'
              : ""
          }
          <div class="lf-subflow__container">
            <div class="lf-subflow__header">
              <span class="lf-subflow__icon"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none">${SUB_FLOW_SVG}</svg></span>
              <span class="lf-subflow__spinner"></span>
              <span class="lf-subflow__title">${escapeHtml(p.label || "")}</span>
              <span class="lf-subflow__badge">SUB</span>
            </div>
            <div class="lf-subflow__body">
              <span class="lf-subflow__label">子流程容器</span>
            </div>
          </div>
          <span class="lf-rect__dot" style="background: ${sColor}; ${
        hs ? "" : "display:none"
      }"></span>
          <div class="lf-rect__pulse"></div>
          <div class="lf-rect__pulse lf-pulse--warning"></div>
        </div>
      `;

      bindDelete(rootEl, model.graphModel.eventCenter, model.id);
    }
  },
  model: class FlowSubFlowModel extends HtmlNodeModel {
    setAttributes() {
      const size = this.properties.containerSize;
      if (size && Array.isArray(size) && size.length === 2) {
        this.width = size[0];
        this.height = size[1];
      } else {
        this.width = 250;
        this.height = 100;
      }
      this.anchorsOffset = [
        [0, -this.height / 2],
        [this.width / 2, 0],
        [0, this.height / 2],
        [-this.width / 2, 0],
      ];
      this.resizable = nodeDefaults.resizable;
      this.rotatable = nodeDefaults.rotatable;
    }
    getNodeStyle() {
      const style = super.getNodeStyle();
      style.fill = "transparent";
      style.stroke = "transparent";
      return style;
    }
  },
};

// ══════════════════════════════════════════════
//  IMAGE 节点 — 用 HtmlNode 封装 <img> 显示
//  ══════════════════════════════════════════════
export const imageNodeDef = {
  type: "flow-image",
  view: class FlowImageView extends HtmlNode {
    setHtml(rootEl: HTMLElement) {
      const model = this.props.model;
      const p = model.properties;
      rootEl.style.overflow = "visible";

      const typeColor = getTypeColor(p.kind);
      const statusClass = getRuntimeClass(p.runtimeStatus);
      const bdrColor = getBorderColor(p.runtimeStatus, typeColor);
      const sColor = getStatusColor(p.runtimeStatus);
      const hs = hasStatus(p.runtimeStatus);

      const imgSrc = p.imageUrl ? escapeHtml(p.imageUrl) : "";
      const titleText = escapeHtml(p.label || "");

      rootEl.innerHTML = `
        <div class="lf-image ${statusClass}" style="--clr: ${typeColor}; --bdr: ${bdrColor};">
          ${
            p.mode === "edit"
              ? '<button class="lf-node__del" type="button">×</button>'
              : ""
          }
          <div class="lf-image__container">
            ${
              imgSrc
                ? `<img class="lf-image__img" src="${imgSrc}" alt="${titleText}" />`
                : `<div class="lf-image__placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none">${TYPE_SVGS.IMAGE}</svg><span>无图片</span></div>`
            }
          </div>
          <span class="lf-image__title">${titleText}</span>
          <span class="lf-rect__dot" style="background: ${sColor}; ${
        hs ? "" : "display:none"
      }"></span>
          ${buildTooltip(p)}
          <div class="lf-rect__pulse"></div>
          <div class="lf-rect__pulse lf-pulse--warning"></div>
        </div>
      `;

      bindDelete(rootEl, model.graphModel.eventCenter, model.id);
    }
  },
  model: class FlowImageModel extends HtmlNodeModel {
    setAttributes() {
      this.width = 200;
      this.height = 160;
      this.anchorsOffset = [
        [0, -this.height / 2],
        [this.width / 2, 0],
        [0, this.height / 2],
        [-this.width / 2, 0],
      ];
      this.resizable = nodeDefaults.resizable;
      this.rotatable = nodeDefaults.rotatable;
    }
    getNodeStyle() {
      const style = super.getNodeStyle();
      style.fill = "transparent";
      style.stroke = "transparent";
      return style;
    }
  },
};

// ── 注册所有节点 ──
export function registerAllNodes(lf: LogicFlow, config?: { resizable?: boolean; rotatable?: boolean }) {
  if (config) setNodeDefaults(config);
  lf.register(rectNodeDef);
  lf.register(circleNodeDef);
  lf.register(diamondNodeDef);
  lf.register(subflowNodeDef);
  lf.register(imageNodeDef);
}

// ── 节点类型映射 ──
export function getLfNodeType(kind?: string): string {
  if (kind === "START" || kind === "END") return "flow-circle";
  if (kind === "CONDITION") return "flow-diamond";
  if (kind === "SUB_FLOW") return "flow-subflow";
  if (kind === "IMAGE") return "flow-image";
  return "flow-rect";
}

// ── 节点尺寸映射 ──
export function getNodeSize(
  lfType: string,
  containerSize?: [number, number]
): [number, number] {
  if (lfType === "flow-circle") return [60, 60];
  if (lfType === "flow-diamond") return [140, 120];
  if (lfType === "flow-subflow" && containerSize) return containerSize;
  if (lfType === "flow-subflow") return [250, 100];
  if (lfType === "flow-image") return [200, 160];
  return [210, 60];
}
