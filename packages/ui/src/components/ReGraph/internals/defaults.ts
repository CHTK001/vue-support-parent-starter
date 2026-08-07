/**
 * ReGraph 系列组件共享事件与默认配置
 */
import type { RGLine, RGLink, RGNode, RGUserEvent } from "@relation-graph/vue3";
import type { JsonLine, JsonNode } from "@relation-graph/vue3";

export interface ReGraphBaseEmits {
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: RGNode, ev: RGUserEvent): void;
  (e: "line-click", line: RGLine, link: RGLink, ev: RGUserEvent): void;
}

/** 默认布局 */
export const LayoutDefaults = {
  force: {
    layoutName: "force",
    force_node_repulsion: 1000,
    force_line_elastic: 100,
    force_friction: 0.6,
    preventNodeOverlap: true,
    preventOverlapInnerPadding: 20,
  },
  mind: { layoutName: "mindmap" },
  tree: {
    layoutName: "tree",
    from: "top",
    distance_coefficient: 1.2,
  },
  circle: { layoutName: "circle" },
  center: { layoutName: "center" },
  fixed: { layoutName: "fixed" },
  relation: { layoutName: "center" },
} as const;

/** 历史快照：diff 模式记录每次图谱变更 */
export type HistoryAction =
  | "add-nodes"
  | "remove-nodes"
  | "add-links"
  | "remove-links"
  | "collapse"
  | "expand"
  | "lock"
  | "unlock"
  | "layout-change";

export interface HistorySnapshot {
  /** 时间戳 */
  timestamp: number;
  /** 变更类型 */
  action: HistoryAction;
  /** 新增节点 */
  addedNodes?: JsonNode[];
  /** 新增连线 */
  addedLinks?: JsonLine[];
  /** 移除节点 */
  removedNodes?: JsonNode[];
  /** 移除连线 */
  removedLinks?: JsonLine[];
  /** 节点状态变更（折叠/锁定等） */
  nodeStateChanges?: Array<{
    id: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  }>;
}

/** 搜索模式：高亮 vs 路径 */
export type SearchMode = "highlight" | "path";

/** 节点右键菜单项 */
export type NodeMenuAction =
  | "expand"
  | "collapse"
  | "lock"
  | "unlock"
  | "hide"
  | "show"
  | "focus"
  | "remove";

/** 远程扩线接口：调用方按需实现 */
export type ExpandFetcher = (nodeId: string) => Promise<{
  nodes: JsonNode[];
  links: JsonLine[];
}>;

/** 默认扩线实现：返回空集，由使用者通过 fetchExpand 注入 */
export const noopExpandFetcher: ExpandFetcher = async () => ({
  nodes: [],
  links: [],
});
