/**
 * ReGraph 系列组件共享类型与默认值
 *
 * 每个 ReGraph* 子组件（Force / Mind / Tree / 3D 等）共用一套
 * 数据/事件接口，这里集中声明，避免重复。
 */
import type { JsonLine, JsonNode, RGJsonData, RGOptions } from "@relation-graph/vue3";

/** 通用 props：所有 ReGraph* 子组件都具备 */
export interface ReGraphBaseProps {
  /** 节点/连线数据 */
  data?: RGJsonData;
  /** 节点列表（与 data.nodes 二选一） */
  nodes?: JsonNode[];
  /** 连线列表（与 data.lines 二选一） */
  lines?: JsonLine[];
  /** 图配置（会与默认配置合并） */
  options?: RGOptions;
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

/** 合并数据：data 优先，否则组装 nodes/lines */
export function buildFinalData(
  data: RGJsonData | undefined,
  nodes: JsonNode[] | undefined,
  lines: JsonLine[] | undefined,
): RGJsonData {
  if (data) return data;
  return {
    rootId: "",
    nodes: nodes ?? [],
    lines: lines ?? [],
  } as RGJsonData;
}

/**
 * 按节点度数自动计算尺寸
 *
 * 用法：
 *   const sizedNodes = autoSizeByDegree(rawNodes, rawLines)
 *
 * 已设置 width/height 的节点会被跳过（混用动态+固定尺寸）。
 */
export function autoSizeByDegree(
  nodes: JsonNode[],
  lines: JsonLine[],
  base = 40,
  step = 18,
): JsonNode[] {
  const degree: Record<string, number> = {};
  lines.forEach((l) => {
    const s = l.from ?? (l as { source?: string }).source;
    const t = l.to ?? (l as { target?: string }).target;
    if (s) degree[s] = (degree[s] || 0) + 1;
    if (t) degree[t] = (degree[t] || 0) + 1;
  });
  return nodes.map((n) => {
    if (typeof n.width === "number" && typeof n.height === "number") return n;
    const deg = degree[n.id] || 0;
    const size = Math.round(base + Math.sqrt(deg) * step);
    return { ...n, width: size, height: size };
  });
}

/**
 * 模糊匹配节点：包含匹配 + 大小写不敏感
 */
export function fuzzyMatchNodes(
  nodes: JsonNode[],
  keyword: string,
): JsonNode[] {
  if (!keyword) return [];
  const k = keyword.toLowerCase();
  return nodes.filter((n) => String(n.text ?? "").toLowerCase().includes(k));
}

/**
 * 多关键词拆分（支持中英文逗号、空格、回车）
 */
export function splitKeywords(input: string): string[] {
  if (!input) return [];
  return input
    .split(/[,, \n，]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * BFS 找两点间最短路径（基于图拓扑）
 *
 * 返回路径上所有节点 id 与边 key。
 * 不连通时返回空对象。
 */
export function findShortestPath(
  nodeIds: string[],
  lines: JsonLine[],
  fromId: string,
  toId: string,
): { nodeIds: Set<string>; linkKeys: Set<string> } {
  const empty = { nodeIds: new Set<string>(), linkKeys: new Set<string>() };
  if (!fromId || !toId || fromId === toId) return empty;
  const idSet = new Set(nodeIds);
  if (!idSet.has(fromId) || !idSet.has(toId)) return empty;

  const adj = new Map<string, Array<{ to: string; key: string }>>();
  nodeIds.forEach((id) => adj.set(id, []));
  lines.forEach((l) => {
    const s = l.from ?? (l as { source?: string }).source;
    const t = l.to ?? (l as { target?: string }).target;
    if (!s || !t) return;
    const key = `${s}-${t}`;
    if (adj.has(s)) adj.get(s)!.push({ to: t, key });
    // 无向：反向边也算（让路径搜索兼容无箭头边）
    if (adj.has(t)) adj.get(t)!.push({ to: s, key: `${t}-${s}` });
  });

  const prev = new Map<string, string | null>();
  const visited = new Set<string>();
  const queue: string[] = [fromId];
  prev.set(fromId, null);
  visited.add(fromId);
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === toId) break;
    for (const edge of adj.get(cur) ?? []) {
      if (visited.has(edge.to)) continue;
      visited.add(edge.to);
      prev.set(edge.to, cur);
      queue.push(edge.to);
    }
  }
  if (!visited.has(toId)) return empty;

  // 回溯路径
  const pathIds: string[] = [];
  let cur: string | null | undefined = toId;
  while (cur) {
    pathIds.unshift(cur);
    cur = prev.get(cur) ?? null;
    if (cur === null) break;
  }
  if (pathIds[0] !== fromId) return empty;

  // 推算路径上的边
  const linkKeys = new Set<string>();
  const idSet2 = new Set(pathIds);
  lines.forEach((l) => {
    const s = l.from ?? (l as { source?: string }).source;
    const t = l.to ?? (l as { target?: string }).target;
    if (!s || !t) return;
    if (idSet2.has(s) && idSet2.has(t)) {
      linkKeys.add(`${s}-${t}`);
    }
  });

  return { nodeIds: idSet2, linkKeys };
}

/**
 * 收集一组节点的子节点 id（基于 lines 的指向关系）
 *
 * 用于折叠/展开时递归判断子节点。
 */
export function collectChildIds(
  lines: JsonLine[],
  rootIds: string[],
  maxDepth = 32,
): Set<string> {
  const childMap = new Map<string, string[]>();
  lines.forEach((l) => {
    const s = l.from ?? (l as { source?: string }).source;
    const t = l.to ?? (l as { target?: string }).target;
    if (!s || !t) return;
    if (!childMap.has(s)) childMap.set(s, []);
    childMap.get(s)!.push(t);
  });

  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = rootIds.map((id) => ({
    id,
    depth: 0,
  }));
  while (queue.length) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id) || depth > maxDepth) continue;
    visited.add(id);
    const children = childMap.get(id) ?? [];
    children.forEach((c) => queue.push({ id: c, depth: depth + 1 }));
  }
  rootIds.forEach((id) => visited.delete(id));
  return visited;
}
