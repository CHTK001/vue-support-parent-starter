/**
 * 通用图可视化枚举类型
 *
 * 供 ReVGraph (React/VGraph)、ReGraph/ReX6 (Vue/X6) 共用
 */

// ─── 布局类型 ──────────────────────────────────────────────────

/**
 * ReVGraph (VisActor VGraph) 布局类型
 *
 * 对应 @visactor/vgraph LAYOUT_TYPES 取值
 */
export enum ReVGraphLayoutType {
  /** DAG 有向无环图 — 适用于工作流、Pipeline */
  DAG = 'dag',
  /** 紧凑树形 — 适用于树形结构紧凑展示 */
  COMPACT_BOX = 'compact-box',
  /** 层级树 — 适用于传统树形图 */
  DENDROGRAM = 'dendrogram',
  /** 缩进树 — 适用于文件目录式展示 */
  INDENTED = 'indented',
  /** 思维导图 — 适用于脑图式发散展示 */
  MIND_MAP = 'mindmap',
  /** 力导向 — 适用于关系网络 */
  FORCE = 'force',
}

/**
 * ReGraph / ReX6 (AntV X6) 布局模式
 *
 * 对应 X6GraphEngine.computeLayout() 支持的 mode 值
 */
export enum ReGraphMode {
  /** 力导向布局 */
  FORCE = 'force',
  /** 思维导图布局 (LR) */
  MIND = 'mind',
  /** 树形布局 (TB) */
  TREE = 'tree',
  /** 环形布局 */
  CIRCLE = 'circle',
  /** 中心辐射布局 */
  CENTER = 'center',
  /** 固定坐标 */
  FIXED = 'fixed',
  /** 关系图 (同 center) */
  RELATION = 'relation',
}

// ─── 方向 ──────────────────────────────────────────────────────

/**
 * 统一布局方向枚举
 *
 * TB = Top→Bottom, BT = Bottom→Top
 * LR = Left→Right, RL = Right→Left
 */
export enum GraphDirection {
  /** 从上到下 */
  TOP_TO_BOTTOM = 'TB',
  /** 从下到上 */
  BOTTOM_TO_TOP = 'BT',
  /** 从左到右 */
  LEFT_TO_RIGHT = 'LR',
  /** 从右到左 */
  RIGHT_TO_LEFT = 'RL',
}

// ─── 节点类型 (ReGraph/ReX6) ──────────────────────────────────

/**
 * ReGraph 节点类型枚举
 */
export enum ReGraphNodeType {
  DEFAULT = 'default',
  START = 'start',
  END = 'end',
  LLM = 'llm',
  KNOWLEDGE = 'knowledge',
  TOOL = 'tool',
  CONDITION = 'condition',
  CODE = 'code',
  HTTP = 'http',
  INPUT = 'input',
  OUTPUT = 'output',
}

// ─── 工具函数 ──────────────────────────────────────────────────

/**
 * 将 ReVGraphLayoutType 映射到 VGraph 字符串
 */
export const RE_VGRAPH_LAYOUT_VALUE: Record<ReVGraphLayoutType, string> = {
  [ReVGraphLayoutType.DAG]: 'dag',
  [ReVGraphLayoutType.COMPACT_BOX]: 'compactBox',
  [ReVGraphLayoutType.DENDROGRAM]: 'dendrogram',
  [ReVGraphLayoutType.INDENTED]: 'indented',
  [ReVGraphLayoutType.MIND_MAP]: 'mindMap',
  [ReVGraphLayoutType.FORCE]: 'force',
};

/**
 * 安全转换字符串为枚举（用于 prop 传入场景）
 */
export function parseReVGraphLayoutType(value: string | undefined): ReVGraphLayoutType {
  return (Object.values(ReVGraphLayoutType) as string[]).includes(value ?? '')
    ? (value as ReVGraphLayoutType)
    : ReVGraphLayoutType.DAG;
}

export function parseReGraphMode(value: string | undefined): ReGraphMode {
  return (Object.values(ReGraphMode) as string[]).includes(value ?? '')
    ? (value as ReGraphMode)
    : ReGraphMode.FORCE;
}

export function parseGraphDirection(value: string | undefined): GraphDirection {
  return (Object.values(GraphDirection) as string[]).includes(value ?? '')
    ? (value as GraphDirection)
    : GraphDirection.TOP_TO_BOTTOM;
}
