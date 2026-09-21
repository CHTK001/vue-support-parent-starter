/**
 * ReFlowGraph 图形注册
 *
 * spider-flow 的观感：小尺寸图标节点 + 下方文字标签 + 正交彩色连线。
 * 这里用两个通用图形（flow-node / flow-edge）承载全部业务类型，差异只体现在
 * attrs（图标 path、主色、描边虚实、标签）上，因此新增节点类型无需注册新图形。
 */
import { Graph } from "@antv/x6";
import { resolveFlowIcon } from "./icons";
import type { FlowEdgeKind, FlowNodeTypeDef } from "./types";

export const FLOW_NODE_SHAPE = "flow-node";
export const FLOW_EDGE_SHAPE = "flow-edge";

/** 节点徽章尺寸（连线锚点按它算，标签在 bbox 之外） */
export const NODE_SIZE = 40;

/** 连线语义色 */
export const FLOW_EDGE_COLORS: Record<FlowEdgeKind, string> = {
  normal: "#00b96b",
  exception: "#e5484d",
  condition: "#4f7cff",
  else: "#a8b3c0",
};

/** 四向磁吸锚点（默认隐藏，节点 hover 时由 CSS 淡入） */
export function flowPortGroups() {
  const circle = {
    r: 4,
    magnet: true,
    stroke: "#4f7cff",
    strokeWidth: 1.5,
    fill: "#ffffff",
  };
  return {
    top: { position: "top", attrs: { circle } },
    right: { position: "right", attrs: { circle } },
    bottom: { position: "bottom", attrs: { circle } },
    left: { position: "left", attrs: { circle } },
  } as const;
}

export function flowPortItems() {
  return (["top", "right", "bottom", "left"] as const).map((g) => ({ group: g, id: g }));
}

let registered = false;

/** 注册节点/连线图形，幂等 */
export function ensureFlowRegistered(): void {
  if (registered) return;
  registered = true;

  Graph.registerNode(
    FLOW_NODE_SHAPE,
    {
      width: NODE_SIZE,
      height: NODE_SIZE,
      markup: [
        { tagName: "rect", selector: "badge" },
        { tagName: "path", selector: "icon" },
        { tagName: "text", selector: "label" },
      ],
      attrs: {
        badge: {
          refWidth: "100%",
          refHeight: "100%",
          rx: 12,
          ry: 12,
          fill: "#4f7cff",
          stroke: "#ffffff",
          strokeWidth: 1.5,
          fontFamily: "var(--flow-font, inherit)",
        },
        icon: {
          refX: 0.5,
          refY: 0.5,
          x: -12,
          y: -12,
          fill: "none",
          stroke: "#ffffff",
          strokeWidth: 1.7,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: resolveFlowIcon(),
        },
        label: {
          refX: 0.5,
          refY: 1,
          refDy: 10,
          textAnchor: "middle",
          textVerticalAnchor: "top",
          fontSize: 12,
          fill: "#4e5969",
          text: "",
          fontFamily: "var(--flow-font, inherit)",
        },
      },
      ports: { groups: flowPortGroups(), items: flowPortItems() },
      zIndex: 1,
    },
    true,
  );

  Graph.registerEdge(
    FLOW_EDGE_SHAPE,
    {
      inherit: "edge",
      zIndex: 0,
      attrs: {
        line: {
          stroke: FLOW_EDGE_COLORS.normal,
          strokeWidth: 1.8,
          strokeLinecap: "round",
          targetMarker: { name: "block", width: 9, height: 7 },
        },
        label: { fontSize: 11, fill: "#86909c" },
      },
      router: { name: "orth", args: { padding: 28 } },
      connector: { name: "rounded", args: { radius: 8 } },
    },
    true,
  );
}

/** 节点 metadata：业务数据挂 data，图形只吃 attrs */
export function buildFlowNodeMetadata(input: {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  color: string;
  iconPath?: string;
  data?: Record<string, unknown>;
}) {
  return {
    id: input.id,
    shape: FLOW_NODE_SHAPE,
    x: input.x,
    y: input.y,
    width: NODE_SIZE,
    height: NODE_SIZE,
    attrs: {
      badge: { fill: input.color },
      icon: { d: input.iconPath || resolveFlowIcon(input.type) },
      label: { text: input.label },
    },
    ports: { groups: flowPortGroups(), items: flowPortItems() },
    data: {
      flowType: input.type,
      flowLabel: input.label,
      flowData: input.data ?? {},
    },
  };
}

/** 连线样式：语义色 + 不传递变量走虚线 */
export function flowEdgeAttrs(kind: FlowEdgeKind | undefined, transfer: boolean | undefined) {
  const stroke = FLOW_EDGE_COLORS[kind ?? "normal"];
  return {
    line: {
      stroke,
      strokeWidth: 1.8,
      strokeLinecap: "round",
      strokeDasharray: transfer === false ? "6 4" : undefined,
      targetMarker: { name: "block", width: 9, height: 7, stroke: "none", fill: stroke },
    },
  };
}

/** 连线 metadata */
export function buildFlowEdgeMetadata(input: {
  id: string;
  from: string;
  to: string;
  fromPort?: string;
  toPort?: string;
  kind?: FlowEdgeKind;
  label?: string;
  transfer?: boolean;
  data?: Record<string, unknown>;
}) {
  return {
    id: input.id,
    shape: FLOW_EDGE_SHAPE,
    source: { cell: input.from, port: input.fromPort ?? "bottom" },
    target: { cell: input.to, port: input.toPort ?? "top" },
    attrs: flowEdgeAttrs(input.kind, input.transfer),
    labels: input.label
      ? [{ position: 0.5, attrs: { label: { text: input.label } } }]
      : [],
    data: {
      flowKind: input.kind ?? "normal",
      flowTransfer: input.transfer !== false,
      flowData: input.data ?? {},
    },
  };
}

/** 供页面构造调色板：type → 主色/图标 的解析 */
export function resolveFlowType(
  types: FlowNodeTypeDef[],
  type?: string,
): FlowNodeTypeDef {
  return types.find((t) => t.type === type) ?? { type: type ?? "default", label: type ?? "节点" };
}
