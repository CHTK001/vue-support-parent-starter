/**
 * Agent-Flow 调色板节点类型与样式
 *
 * 参考 https://x6.antv.antgroup.com/examples/showcase/practices/#agentFlow
 * 提供一套可拖拽的节点模板，每个类型对应一种配色与图标。
 */
import type { ReGraphNodeType, ReGraphNodeTypeDef } from "./types";

/** 默认调色板节点类型（start / llm / knowledge / tool / condition / ...） */
export const DEFAULT_NODE_TYPES: ReGraphNodeTypeDef[] = [
  { type: "start", label: "开始", icon: "▶", color: "#52c41a" },
  { type: "end", label: "结束", icon: "■", color: "#ff4d4f" },
  { type: "llm", label: "大模型", icon: "✦", color: "#1677ff" },
  { type: "knowledge", label: "知识库", icon: "❖", color: "#13c2c2" },
  { type: "tool", label: "工具", icon: "⚙", color: "#fa8c16" },
  { type: "condition", label: "条件", icon: "?", color: "#722ed1" },
  { type: "code", label: "代码", icon: "›_", color: "#2f54eb" },
  { type: "http", label: "HTTP", icon: "⇄", color: "#eb2f96" },
  { type: "input", label: "输入", icon: "↓", color: "#16a34a" },
  { type: "output", label: "输出", icon: "↑", color: "#d97706" },
];

const TYPE_MAP = new Map<ReGraphNodeType, ReGraphNodeTypeDef>(
  DEFAULT_NODE_TYPES.map((t) => [t.type, t]),
);

/** 获取某类型的样式定义，未命中回退 default */
export function resolveNodeType(
  type?: ReGraphNodeType,
): ReGraphNodeTypeDef {
  if (type && TYPE_MAP.has(type)) {
    return TYPE_MAP.get(type)!;
  }
  return { type: "default", label: "节点", icon: "●", color: "#5b8ff9" };
}

/** 锚点名称集合（与 register.ts 中 ports 组名对应） */
export const PORT_GROUPS = ["top", "right", "bottom", "left"] as const;
export type PortGroup = (typeof PORT_GROUPS)[number];
