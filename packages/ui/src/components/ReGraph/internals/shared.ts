/**
 * ReGraph 系列组件共享类型与默认值
 *
 * 基于 X6 内核的通用数据/事件接口，所有 ReGraph* 子组件共用，集中声明避免重复。
 * 数据契约见 ./x6/types。
 */
import type { ReGraphData, ReGraphEdge, ReGraphNode } from "./x6/types";

/** 通用 props：所有 ReGraph* 子组件都具备 */
export interface ReGraphBaseProps {
  /** 节点/连线数据（与 nodes/edges 二选一） */
  data?: ReGraphData;
  /** 节点列表（与 data.nodes 二选一） */
  nodes?: ReGraphNode[];
  /** 连线列表（与 data.edges 二选一） */
  edges?: ReGraphEdge[];
  /** 容器高度 */
  height?: string | number;
  /** 容器宽度 */
  width?: string | number;
  /** 是否显示调试信息 */
  debug?: boolean;
  /** 是否启用编辑模式 */
  editable?: boolean;
}

/** 默认值 */
export const ReGraphDefaults = {
  height: "100%",
  width: "100%",
  debug: false,
  editable: false,
} as const;

/** 容器样式计算 */
export function buildContainerStyle(
  width: string | number,
  height: string | number,
): Record<string, string> {
  return {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };
}

/** 合并数据：data 优先，否则组装 nodes/edges */
export function buildFinalData(
  data: ReGraphData | undefined,
  nodes: ReGraphNode[] | undefined,
  edges: ReGraphEdge[] | undefined,
): ReGraphData {
  if (data) return data;
  return {
    rootId: "",
    nodes: nodes ?? [],
    edges: edges ?? [],
  };
}

/** 按节点文本模糊匹配：包含匹配 + 大小写不敏感 */
export function fuzzyMatchNodes<T extends { id: string; text?: string | null }>(
  nodes: T[],
  keyword: string,
): T[] {
  if (!keyword) return [];
  const k = keyword.toLowerCase();
  return nodes.filter((n) => String(n.text ?? "").toLowerCase().includes(k));
}

/** 多关键词拆分（支持中英文逗号、空格、回车） */
export function splitKeywords(input: string): string[] {
  if (!input) return [];
  return input
    .split(/[,， \n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 收集一组节点的子节点 id（基于 edges 的指向关系） */
export function collectChildIds(
  edges: ReGraphEdge[],
  rootIds: string[],
  maxDepth = 32,
): Set<string> {
  const childMap = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!e.from || !e.to) return;
    if (!childMap.has(e.from)) childMap.set(e.from, []);
    childMap.get(e.from)!.push(e.to);
  });
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = rootIds.map((id) => ({ id, depth: 0 }));
  while (queue.length) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id) || depth > maxDepth) continue;
    visited.add(id);
    (childMap.get(id) ?? []).forEach((c) => queue.push({ id: c, depth: depth + 1 }));
  }
  rootIds.forEach((id) => visited.delete(id));
  return visited;
}
