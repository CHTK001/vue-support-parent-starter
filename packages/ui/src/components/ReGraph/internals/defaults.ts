/**
 * ReGraph 系列组件公共定义 & 默认配置（X6 侧）
 */
import { ReGraphMode } from "./x6/types";
import type {
  ReGraphEdge,
  ReGraphExpandFetcher,
  ReGraphMode as ReGraphModeType,
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
  (e: "layout-change", name: string): void;
  (e: "search-change", keyword: string, matched: ReGraphNode[]): void;
  (e: "expand", node: ReGraphNode, payload: { nodes: ReGraphNode[]; edges: ReGraphEdge[] }): void;
  (e: "node-menu", action: ReGraphNodeMenuAction, node: ReGraphNode): void;
}

/** 按 mode 对应的默认展示配置（X6 侧：工具栏图标等，future 扩展） */
export const LayoutDefaults: Record<ReGraphMode, { layoutName: ReGraphMode }> = {
  [ReGraphMode.FORCE]: { layoutName: ReGraphMode.FORCE },
  [ReGraphMode.MIND]: { layoutName: ReGraphMode.MIND },
  [ReGraphMode.TREE]: { layoutName: ReGraphMode.TREE },
  [ReGraphMode.CIRCLE]: { layoutName: ReGraphMode.CIRCLE },
  [ReGraphMode.CENTER]: { layoutName: ReGraphMode.CENTER },
  [ReGraphMode.FIXED]: { layoutName: ReGraphMode.FIXED },
  [ReGraphMode.RELATION]: { layoutName: ReGraphMode.RELATION },
};

/** 历史记录集合：记录每次图状态快照（X6 history 插件驱动，undo/redo 等） */
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

/** 远程数据接口：使用通用 fetchExpand 注册加载 */
export type ExpandFetcher = ReGraphExpandFetcher;

/** 默认空实现：直接返回空节点列表 */
export const noopExpandFetcher: ExpandFetcher = async () => ({
  nodes: [],
  edges: [],
});
