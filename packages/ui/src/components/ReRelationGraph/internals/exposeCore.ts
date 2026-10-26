/**
 * 主题层转发核心实例能力的清单。
 *
 * <p>主题层（default / koi）只挂主题类名，能力全在核心 {@code G6Graph} 上；
 * 之前是手写 expose 逐个转发，每加一个 API 就要改两处、极易漏。
 * 这里集中成清单 + {@link forwardCore} 一把转发，主题层不再关心具体方法。</p>
 */

/** 以 getter 形式暴露的只读状态 */
export const CORE_GETTERS = [
  "graph",
  "layout",
  "layoutOptions",
  "groupType",
  "groupVisible",
  "groupAutoHidden",
  "clickSelect",
  "brushSelect",
  "highlight",
  "minimap",
  "combo",
  "tooltip",
  "nodeTooltip",
  "edgeTooltip",
  "contextMenu",
  "pathInfo",
  "pathActive",
  "pathFrom",
  "pathTo",
  "canUndo",
  "canRedo",
  "history",
  "shortcuts",
] as const;

/** 需要转发的命令式方法 */
export const CORE_METHODS = [
  // 布局 / 分组 / 视口
  "setLayout",
  "setGroupType",
  "setGroupVisible",
  "fitView",
  "focus",
  // 交互开关
  "setClickSelect",
  "setBrushSelect",
  "setHighlight",
  "setMinimap",
  "setCombo",
  "setTooltip",
  "setNodeTooltip",
  "setEdgeTooltip",
  // 右键菜单
  "closeContextMenu",
  // 选择 / 状态 / 算法
  "select",
  "getSelection",
  "clearSelection",
  "clearStates",
  "highlightElements",
  "centerOn",
  "shortestPath",
  "shortestPathFromSelection",
  "clearPath",
  "setPathEndpoint",
  "countEdgeCrossings",
  // 分组折叠
  "collapseGroup",
  "expandGroup",
  "toggleGroupCollapsed",
  "getCollapsedGroups",
  "isGroupCollapsed",
  // 数据 CRUD
  "getNodes",
  "getEdges",
  "getNode",
  "setNodes",
  "setEdges",
  "setData",
  "addNode",
  "addNodes",
  "removeNode",
  "removeNodes",
  "updateNode",
  "addEdge",
  "addEdges",
  "removeEdge",
  "removeEdges",
  "updateEdge",
  "clear",
  // 编辑历史（撤销 / 重做）
  "undo",
  "redo",
  "clearHistory",
  "deleteSelection",
  "selectAll",
] as const;

/** 核心实例句柄（结构极简，避免主题层与核心互相 import 类型） */
export interface CoreHandle {
  [key: string]: any;
}

/**
 * 生成主题层的 expose 对象：getter 直读核心、方法直转发。
 * 核心尚未挂载时读状态返回 undefined、调方法返回 undefined，不会抛错。
 */
export const forwardCore = (core: { value: CoreHandle | null }): Record<string, unknown> => {
  const exposed: Record<string, unknown> = {};
  for (const key of CORE_GETTERS) {
    Object.defineProperty(exposed, key, {
      get: () => core.value?.[key],
      enumerable: true,
      configurable: true,
    });
  }
  for (const method of CORE_METHODS) {
    exposed[method] = (...args: unknown[]) => core.value?.[method]?.(...args);
  }
  return exposed;
};
