/**
 * ReGraph 系列组件共享事件与默认配置（X6 版）
 */
import type {
  ReGraphEdge,
  ReGraphExpandFetcher,
  ReGraphMode,
  ReGraphNode,
  ReGraphNodeMenuAction,
  ReGraphSearchMode,
} from "./x6/types";

export interface ReGraphBaseEmits {
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: ReGraphNode, ev: MouseEvent): void;
  (e: "node-dblclick", node: ReGraphNode, ev: MouseEvent): void;
  (e: "node-contextmenu", node: ReGraphNode, ev: MouseEvent): void;
  (e: "edge-click", edge: ReGraphEdge, ev: MouseEvent): void;
}

/** 各 mode 对应的默认展示配置（X6 版：仅用于语义提示与 future 扩展） */
export const LayoutDefaults: Record<ReGraphMode, { layoutName: ReGraphMode }> = {
  force: { layoutName: "force" },
  mind: { layoutName: "mind" },
  tree: { layoutName: "tree" },
  circle: { layoutName: "circle" },
  center: { layoutName: "center" },
  fixed: { layoutName: "fixed" },
  relation: { layoutName: "relation" },
};

/** 历史快照：记录每次图谱变更（X6 history 插件已内置 undo/redo，这里保留业务语义） */
export interface HistorySnapshot {
  timestamp: number;
  action: string;
  addedNodes?: ReGraphNode[];
  addedEdges?: ReGraphEdge[];
  removedNodes?: ReGraphNode[];
  removedEdges?: ReGraphEdge[];
}

export type SearchMode = ReGraphSearchMode;

export type NodeMenuAction = ReGraphNodeMenuAction;

/** 远程扩线接口类型（使用者通过 fetchExpand 注入） */
export type ExpandFetcher = ReGraphExpandFetcher;

/** 默认扩线实现：返回空集 */
export const noopExpandFetcher: ExpandFetcher = async () => ({
  nodes: [],
  edges: [],
});
