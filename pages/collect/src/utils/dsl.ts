/**
 * 流程图 DSL 的构造与读写工具。
 *
 * DSL 形状与后端 CollectDslDTO 逐字段对齐：params 是数组而非 map，
 * 可重复参数组用 "组名:键名" 前缀表达（header:User-Agent、cell:title、set:token）。
 */
import type { CollectDsl, CollectEdge, CollectNode, CollectParam, CollectShapeMeta } from "../types/collect";

/** 空白流程图 */
export function emptyDsl(name?: string): CollectDsl {
  return {
    name: name ?? null,
    threadCount: null,
    headers: [],
    cookies: [],
    variables: [],
    nodes: [],
    edges: [],
  };
}

/** 深拷贝，避免画布编辑污染列表数据 */
export function cloneDsl(dsl: CollectDsl | null | undefined): CollectDsl {
  if (!dsl) {
    return emptyDsl();
  }
  return {
    name: dsl.name ?? null,
    threadCount: dsl.threadCount ?? null,
    headers: (dsl.headers ?? []).map(p => ({ ...p })),
    cookies: (dsl.cookies ?? []).map(p => ({ ...p })),
    variables: (dsl.variables ?? []).map(p => ({ ...p })),
    nodes: (dsl.nodes ?? []).map(n => ({
      ...n,
      params: (n.params ?? []).map(p => ({ ...p })),
      fields: (n.fields ?? []).map(f => ({ ...f })),
    })),
    edges: (dsl.edges ?? []).map(e => ({ ...e })),
  };
}

/** 按 shape 建立元数据索引；metas 返回顺序不保证稳定，不能按下标取 */
export function indexMetas(metas: CollectShapeMeta[]): Record<string, CollectShapeMeta> {
  const map: Record<string, CollectShapeMeta> = {};
  metas.forEach(meta => {
    map[meta.shape] = meta;
  });
  return map;
}

/** 取参数名冒号前的组名（header:User-Agent → header） */
export function pairPrefix(name: string): string {
  const cut = name.indexOf(":");
  return cut < 0 ? name : name.slice(0, cut);
}

/** 取参数名冒号后的占位提示（header:名称 → 名称） */
export function pairPlaceholder(name: string): string {
  const cut = name.indexOf(":");
  return cut < 0 ? "" : name.slice(cut + 1);
}

/** 读单个参数值，缺失时返回空串 */
export function paramValue(node: CollectNode, name: string): string {
  const hit = (node.params ?? []).find(p => p.name === name);
  return hit?.value ?? "";
}

/** 写单个参数值，顺带补上 description（后端用它承载显示名） */
export function setParamValue(node: CollectNode, name: string, value: string, description?: string): void {
  if (!Array.isArray(node.params)) {
    node.params = [];
  }
  let hit = node.params.find(p => p.name === name);
  if (!hit) {
    hit = { name, value: "", description: description ?? null };
    node.params.push(hit);
  }
  hit.value = value;
  if (description && !hit.description) {
    hit.description = description;
  }
}

/** 可重复参数组的一对取值 */
export interface ParamPair {
  key: string;
  value: string;
}

/** 读出 "组名:键名" 参数组（保序、允许重复键） */
export function pairsOf(owner: { params?: CollectParam[] }, prefix: string): ParamPair[] {
  const out: ParamPair[] = [];
  (owner.params ?? []).forEach(p => {
    if (p.name && p.name.startsWith(`${prefix}:`)) {
      out.push({ key: p.name.slice(prefix.length + 1), value: p.value ?? "" });
    }
  });
  return out;
}

/** 用编辑后的键值对整体替换某个参数组，保留组外的其他参数 */
export function replacePairs(
  owner: { params?: CollectParam[] },
  prefix: string,
  pairs: ParamPair[],
  description?: string,
): void {
  const kept = (owner.params ?? []).filter(p => !p.name || !p.name.startsWith(`${prefix}:`));
  const restored = (owner.params ?? []).filter(p => p.name && p.name.startsWith(`${prefix}:`));
  const label = restored[0]?.description ?? description ?? null;
  const written: CollectParam[] = pairs
    .filter(p => p.key.trim() !== "")
    .map(p => ({ name: `${prefix}:${p.key.trim()}`, value: p.value ?? "", description: label }));
  owner.params = [...kept, ...written];
}

/** 图内唯一节点 ID */
export function nextNodeId(nodes: CollectNode[]): string {
  let max = 0;
  nodes.forEach(n => {
    const matched = /^n(\d+)$/.exec(n.id ?? "");
    if (matched) {
      max = Math.max(max, Number(matched[1]));
    }
  });
  return `n${max + 1}`;
}

/** 图内唯一连线 ID */
export function nextEdgeId(edges: CollectEdge[]): string {
  let max = 0;
  edges.forEach(e => {
    const matched = /^e(\d+)$/.exec(e.id ?? "");
    if (matched) {
      max = Math.max(max, Number(matched[1]));
    }
  });
  return `e${max + 1}`;
}

/**
 * 按元数据新建节点：参数用 defaultValue 初始化，pairs 组留一条空行便于填写。
 */
export function createNode(meta: CollectShapeMeta, id: string, x: number, y: number): CollectNode {
  const node: CollectNode = { id, shape: meta.shape, name: meta.label, x, y, params: [], fields: [] };
  (meta.params ?? []).forEach(param => {
    if (param.type === "pairs") {
      return;
    }
    setParamValue(node, param.name, param.defaultValue ?? "", param.label);
  });
  if (meta.fieldEditor) {
    node.fields = [{ name: "", parserType: "CSS", expression: "", attribute: "text", attrName: "", group: 1, defaultValue: "" }];
  }
  return node;
}

/** 是否存在环路：DFS 染色，后端同样禁止环路，编辑期先挡住 */
export function hasCycle(nodes: CollectNode[], edges: CollectEdge[]): string[] | null {
  const adjacency: Record<string, string[]> = {};
  edges.forEach(e => {
    (adjacency[e.from] ??= []).push(e.to);
  });
  const visited: Record<string, number> = {};
  const stack: string[] = [];
  const walk = (id: string): string[] | null => {
    visited[id] = 1;
    stack.push(id);
    for (const next of adjacency[id] ?? []) {
      if (visited[next] === 1) {
        return [...stack.slice(stack.indexOf(next)), next];
      }
      if (!visited[next]) {
        const found = walk(next);
        if (found) {
          return found;
        }
      }
    }
    stack.pop();
    visited[id] = 2;
    return null;
  };
  for (const node of nodes) {
    if (!visited[node.id]) {
      const cycle = walk(node.id);
      if (cycle) {
        return cycle;
      }
    }
  }
  return null;
}
