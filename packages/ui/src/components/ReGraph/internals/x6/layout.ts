/**
 * 布局算法
 *
 * 与原 ReGraph 的 mode 对齐：force / tree / mind / circle / center / fixed / relation。
 * force 使用 d3-force（已为项目依赖）；其余为确定性几何布局，避免额外依赖与异步不确定性。
 */
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from "d3-force";
import type { ReGraphData, ReGraphMode, ReGraphNode } from "./types";

interface Position {
  x: number;
  y: number;
}

const NODE_W = 180;
const NODE_H = 44;

/** 构建有向父子关系（from → to 视为父 → 子） */
function buildChildren(
  nodes: ReGraphNode[],
  edges: ReGraphData["edges"],
): Map<string, string[]> {
  const children = new Map<string, string[]>();
  nodes.forEach((n) => children.set(n.id, []));
  edges.forEach((e) => {
    if (!children.has(e.from)) children.set(e.from, []);
    if (children.has(e.to)) children.get(e.from)!.push(e.to);
  });
  return children;
}

/** 找根节点：优先 rootId，否则入度为 0 的首个，否则首个节点 */
function findRoot(data: ReGraphData): string | undefined {
  if (data.rootId && data.nodes.some((n) => n.id === data.rootId)) {
    return data.rootId;
  }
  const hasIncoming = new Set(data.edges.map((e) => e.to));
  const root = data.nodes.find((n) => !hasIncoming.has(n.id));
  return root?.id;
}

/** 力导向布局（d3-force，同步跑满 tick） */
export function forceLayout(
  data: ReGraphData,
  width = 800,
  height = 600,
): Record<string, Position> {
  const simNodes = data.nodes.map((n) => ({
    id: n.id,
    x: n.x ?? Math.random() * width,
    y: n.y ?? Math.random() * height,
  }));
  const simLinks = data.edges
    .filter((e) => e.from && e.to)
    .map((e) => ({ source: e.from, target: e.to }));
  const sim = forceSimulation(simNodes as never[])
    .force(
      "link",
      forceLink(simLinks as never[])
        .id((d) => (d as { id: string }).id)
        .distance(140)
        .strength(0.5),
    )
    .force("charge", forceManyBody().strength(-400))
    .force("center", forceCenter(width / 2, height / 2))
    .force("collide", forceCollide(80))
    .stop();
  for (let i = 0; i < 300; i++) sim.tick();
  const pos: Record<string, Position> = {};
  simNodes.forEach((n) => {
    pos[n.id] = {
      x: Math.round((n.x as number) - NODE_W / 2),
      y: Math.round((n.y as number) - NODE_H / 2),
    };
  });
  return pos;
}

/** 层级树布局（自上而下） */
export function treeLayout(data: ReGraphData): Record<string, Position> {
  return layeredLayout(data, "TB");
}

/** 思维导图布局（自左向右，双分支） */
export function mindLayout(data: ReGraphData): Record<string, Position> {
  return layeredLayout(data, "LR");
}

function layeredLayout(
  data: ReGraphData,
  dir: "TB" | "LR",
): Record<string, Position> {
  const children = buildChildren(data.nodes, data.edges);
  const root = findRoot(data);
  const pos: Record<string, Position> = {};
  const levelGap = dir === "TB" ? 110 : 240;
  const nodeGap = dir === "TB" ? 70 : 56;

  // 计算每个节点的深度
  const depth = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; d: number }> = root
    ? [{ id: root, d: 0 }]
    : [];
  while (queue.length) {
    const { id, d } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    depth.set(id, d);
    (children.get(id) ?? []).forEach((c) => queue.push({ id: c, d: d + 1 }));
  }
  // 未访问节点（孤立点）追加到最末层
  let maxDepth = 0;
  depth.forEach((d) => (maxDepth = Math.max(maxDepth, d)));
  data.nodes.forEach((n) => {
    if (!depth.has(n.id)) {
      maxDepth += 1;
      depth.set(n.id, maxDepth);
    }
  });

  // 按层聚合，居中排布
  const byLevel = new Map<number, string[]>();
  depth.forEach((d, id) => {
    if (!byLevel.has(d)) byLevel.set(d, []);
    byLevel.get(d)!.push(id);
  });
  byLevel.forEach((ids, d) => {
    const total = (ids.length - 1) * nodeGap;
    ids.forEach((id, i) => {
      const offset = -total / 2 + i * nodeGap;
      pos[id] =
        dir === "TB"
          ? { x: Math.round(offset), y: Math.round(d * levelGap) }
          : { x: Math.round(d * levelGap), y: Math.round(offset) };
    });
  });
  return pos;
}

/** 环形布局 */
export function circleLayout(data: ReGraphData): Record<string, Position> {
  const n = data.nodes.length || 1;
  const radius = Math.max(160, n * 28);
  const pos: Record<string, Position> = {};
  data.nodes.forEach((node, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    pos[node.id] = {
      x: Math.round(radius * Math.cos(angle)),
      y: Math.round(radius * Math.sin(angle)),
    };
  });
  return pos;
}

/** 中心放射布局（root 居中，其余按 BFS 距离成环） */
export function centerLayout(data: ReGraphData): Record<string, Position> {
  const root = findRoot(data);
  const children = buildChildren(data.nodes, data.edges);
  const pos: Record<string, Position> = {};
  if (root) pos[root] = { x: 0, y: 0 };
  const rings: string[][] = [];
  const visited = new Set<string>(root ? [root] : []);
  let frontier = root ? [root] : [];
  while (frontier.length) {
    const next: string[] = [];
    frontier.forEach((id) =>
      (children.get(id) ?? []).forEach((c) => {
        if (!visited.has(c)) {
          visited.add(c);
          next.push(c);
        }
      }),
    );
    if (next.length) rings.push(next);
    frontier = next;
  }
  // 孤立点补到最外环
  const orphans = data.nodes
    .map((n) => n.id)
    .filter((id) => !visited.has(id));
  if (orphans.length) rings.push(orphans);

  rings.forEach((ring, r) => {
    const radius = (r + 1) * 170;
    ring.forEach((id, i) => {
      const angle = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
      pos[id] = {
        x: Math.round(radius * Math.cos(angle)),
        y: Math.round(radius * Math.sin(angle)),
      };
    });
  });
  return pos;
}

/** 固定布局（使用节点自带 x/y，缺省随机散布） */
export function fixedLayout(data: ReGraphData): Record<string, Position> {
  const pos: Record<string, Position> = {};
  data.nodes.forEach((n, i) => {
    pos[n.id] = {
      x: n.x ?? ((i % 6) - 3) * 220,
      y: n.y ?? (Math.floor(i / 6) - 3) * 120,
    };
  });
  return pos;
}

/** 按 mode 计算全部节点坐标 */
export function computeLayout(
  mode: ReGraphMode,
  data: ReGraphData,
  width?: number,
  height?: number,
): Record<string, Position> {
  switch (mode) {
    case "force":
      return forceLayout(data, width, height);
    case "mind":
      return mindLayout(data);
    case "tree":
      return treeLayout(data);
    case "circle":
      return circleLayout(data);
    case "center":
    case "relation":
      return centerLayout(data);
    case "fixed":
    default:
      return fixedLayout(data);
  }
}
