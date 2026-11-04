/**
 * ReFlowGraph 图引擎共享接口
 *
 * 内核是插拔式的：`internals/engine.ts` 是 X6 内核（默认），`internals/engine-logicflow.ts`
 * 是 LogicFlow 内核（用户标识为 `flyflow`）。两种内核都必须完整实现本文件里的协定——
 * 主题组件与宿主页面只写一份代码，不感知内核是哪家。
 *
 * 标准分为三层：
 *
 * 1. `FlowGraphEngine`：引擎对外暴露的全部能力。两种内核都叫 `FlowGraphEngine`，
 *    宿主用一份类型，`import type { FlowGraphEngine } from "@repo/ui/re-flow-graph"`
 *    的页面不需要因为换内核改一行代码。
 * 2. `FlowEngineGraph`：引擎的 `graph` 属性，即"图面"。X6 内核直接暴露自己的 `Graph`
 *    （与 `FlowEngineGraph` 交叉后实现），LogicFlow 内核暴露一份包装，
 *    两者的 `on`/`showGrid`/`hideGrid`/`disableHistory`/`enableHistory` 在行为与
 *    参数上必须一致。
 * 3. `FlowEngineOptions` / `FlowEngineHandlers` / `FlowInteractionPatch`：建图参数、
 *    事件回调与交互补丁，两种内核接受同一份结构。
 */
import type { Component } from "vue";
import type {
  FlowEdge,
  FlowEdgeKind,
  FlowGraphData,
  FlowMenuAction,
  FlowMenuItem,
  FlowNode,
  FlowNodeTypeDef,
  FlowSelection,
  FlowStructureIssue,
} from "./types";

/** 画布事件回调：两种内核传回的对象都作为 `any` 传递，注册方随意解构 */
export type FlowEngineHandler = (...args: any[]) => void;

/** `updateNode` 接受的业务参数 patch */
export interface FlowNodeUpdatePatch {
  label?: string;
  data?: Record<string, unknown>;
  color?: string;
  iconPath?: string;
  image?: string;
  strokeColor?: string;
  strokeWidth?: number;
  /** 卡片第二行状态文本（重播时显示「开始时间 · 耗时」）；空串清除 */
  stateText?: string;
  /** 是否「正在循环/当前执行」：卡片渲染蓝色虚线动画边框 */
  looping?: boolean;
}

/** `updateEdge` 接受的业务参数 patch */
export interface FlowEdgeUpdatePatch {
  kind?: FlowEdgeKind;
  label?: string;
  transfer?: boolean;
  data?: Record<string, unknown>;
}

/**
 * 图面
 *
 * 两种内核的 `graph` 属性必须同时满足本接口：
 * - X6 写龙江的图（`Graph`）按 X6 自己的 API 实现它，插件 augmentation 补齐
 *   `showGrid`/`hideGrid`/`disableHistory`/`enableHistory`/`cleanHistory`；
 * - LogicFlow 写逻辑模型，抽象出一个包装对象来承担这份接口的全部方法，
 *   血统上它是唯一应该有的那一份（见 `FlowEngineOptions` 的 `container`）。
 *
 * 顶层命名规则：X6 的事件名（`node:click` 等）是"原生"的；LogicFlow 的事件名
 * 来自 `node:drag`/`node:drop`/`node:properties-change` 等，由内核向上收敛到同一份
 * 协议事件（见 `on` 文档的协议名称列表）。
 */
export interface FlowEngineGraph {
  /**
   * 绑定画布事件。
   *
   * 支持任意事件名与参数——X6 与 LogicFlow 的事件名各自成体系，内核负责把
   * 逻辑琉璃事件收敛为协议事件抛给宿主。
   *
   * 宿主使用的协议事件清单（Irrespective of the kernel）：
   *
   * - `node:click` / `node:dblclick` / `node:contextmenu`：节点点击/双击/右键
   * - `node:moved`：节点移动完成（拖拽松手、`setPosition`、 شوند/纠正回录、
   *   重排）
   * - `node:change:position`（⚠ 逻辑琉璃内核必须合成）：节点位置发生变化时
   *   持续触发；参数为 `{ node, model, e, position, deltaX, deltaY }`，
   *   其中 `node` 是 `{ getData, id, getPosition, setPosition, getLabel }`
   *   的窄化版，`node.setPosition(x, y)` 会后触发（禁止重复调用）
   * - `edge:click` / `edge:contextmenu` / `edge:connected` / `edge:changed`
   * - `blank:click` / `blank:contextmenu`：画布空白处点击/右键
   * - `selection:changed`：选中态变化，参数 `{ selected }`
   * - `cell:added` / `cell:removed` / `cell:changed`：所有单元格变化
   * - `history:change`：撤销/重做栈变化，参数 `{ undos, redos, undoAble, redoAble }`
   *
   * @returns this，支持链式调用
   */
  on(name: string, handler: FlowEngineHandler): FlowEngineGraph;

  /**
   * 取消事件绑定。`handler` 缺省则取消该事件名上的全部注册。
   * LogicFlow 的 `off` 支持以逗号分隔多个事件名。
   * @returns this，支持链式调用
   */
  off(name?: string, handler?: FlowEngineHandler): FlowEngineGraph;

  /** 显示网格背景 */
  showGrid(): FlowEngineGraph;

  /** 隐藏网格背景 */
  hideGrid(): FlowEngineGraph;

  /** 禁止撤销/重做（会让后续操作不记录到撤销栈里） */
  disableHistory(): FlowEngineGraph;

  /** 启用撤销/重做 */
  enableHistory(): FlowEngineGraph;

  /** 清空撤销/重做栈 */
  cleanHistory(): FlowEngineGraph;
}

/** 两种内核都接受的建图参数（厚度） */
export interface FlowEngineOptions {
  /** 挂载画布的 DOM 节点 */
  container: HTMLElement;
  /** 小地图挂载节点；传 null 则不挂小地图 */
  minimapContainer?: HTMLElement | null;
  /** 调色板节点类型（通常由后端 /designer/metas 驱动） */
  nodeTypes?: FlowNodeTypeDef[];
  /** 只读（不插笔、不连线、不拖节点） */
  readonly?: boolean;
  /** 网格背景 */
  grid?: boolean;
  /** 画布平移，缺省 true */
  panning?: boolean;
  /** 滚轮缩放，缺省 true */
  zoom?: boolean;
  /**
   * 节点能否被拖动，缺省 true。
   *
   * 与 `readonly` 分开是因为真实需求里有「只读但允许挪位置看布局」这一档，
   * 而 `readonly` 是一刀切关掉节点拖动 / 边拖动 / 折点增删七项，粒度太粗。
   */
  nodeDraggable?: boolean;
  /**
   * 宿主自定义节点体组件；给了则所有节点用它渲染。
   *
   * ⚠ 只使用于 X6 内核（`@antv/x6-vue-shape`，框架节点体系）；LogicFlow 内核
   * 下它注册的 Preact 图形没有这个能力，届时内核会忽略并用内置卡片节点代替。
   */
  nodeComponent?: Component | null;
  /**
   * 走菱形的节点类型名单，缺省见 `shapes.ts` 里的 DEFAULT_DIAMOND_TYPES。
   * 宿主类型标识不叫 condition/branch/judge/decision 时用这个覆盖。
   */
  diamondTypes?: readonly string[];
  /** 事件回调 */
  handlers?: FlowEngineHandlers;
}

/** 两种内核都接受的回调 */
export interface FlowEngineHandlers {
  /** 画布建成、准备就绪 */
  onReady?: (engine: FlowGraphEngine) => void;
  /** 选中对象变化 */
  onSelect?: (selection: FlowSelection) => void;
  /** 图数据变化（`getData()` 的结果） */
  onChange?: (data: FlowGraphData) => void;
  /** 节点点击 */
  onNodeClick?: (node: FlowNode, e: MouseEvent) => void;
  /** 节点双击 */
  onNodeDblClick?: (node: FlowNode, e: MouseEvent) => void;
  /** 节点右键 */
  onNodeContextMenu?: (node: FlowNode, e: MouseEvent) => void;
  /** 连线点击 */
  onEdgeClick?: (edge: FlowEdge, e: MouseEvent) => void;
  /** 连线右键 */
  onEdgeContextMenu?: (edge: FlowEdge, e: MouseEvent) => void;
  /** 画布空白处右键 */
  onBlankContextMenu?: (e: MouseEvent) => void;
  /** 连线爬行完成（拖拽出新的连线松手时） */
  onEdgeConnected?: (edge: FlowEdge) => void;
  /** 撤销/重做态变化 */
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
}

/**
 * 交互开关的补丁，供运行时改 prop 用。
 *
 * 三种开关各有各的内核入口（逻辑琉璃的 `switch`/`zoom` 与 X6 的
 * `togglePanning`/`toggleMouseWheel`/`interacting` 不同），按实现落地。
 */
export interface FlowInteractionPatch {
  panning?: boolean;
  zoom?: boolean;
  nodeDraggable?: boolean;
}

/**
 * 图引擎协定
 *
 * “图面”由 `graph` 暴露，其余全部是图引擎式的调度操作。两种内核：
 * - X6 内核把 `this.graph` 拼上层 `FlowEngineGraph` 后使用
 * - LogicFlow 内核用 `FlowEngineGraph` 包装逻辑模型（`graphModel`）：
 *   节点坐标读 `Properties`、置标读 `Properties`、事件读 `eventCenter`、
 *   撤销读 `History`、网格读 `graphModel.grid`。
 *
 * 宿主（主题/页面）通过它使用两种内核。
 */
export interface FlowGraphEngine {
  /** 图面：`FlowEngineGraph` 是两种内核->core的同一层 */
  graph: FlowEngineGraph;

  /** 运行时改交互开关（`props` 变化时由主题调用） */
  applyInteraction(patch: FlowInteractionPatch): void;

  /** 置 \pe 只读/可编辑（内核会把整个交互状态换掉再恢复） */
  setReadonly(readonly: boolean): void;

  /** 用业务数据整体覆盖画布 */
  setData(data: FlowGraphData): void;

  /** 读当前图数据（与建图时灌入的 `data` 同口径） */
  getData(): FlowGraphData;

  /** 在画布中心添加一个节点（如果 x/y 缺省，自动落点） */
  addNode(type: string, x?: number, y?: number): FlowNode | null;

  /** 把 clientX/clientY 换算成画布（图面）坐标 */
  toLocalPoint(clientX: number, clientY: number): { x: number; y: number };

  /** 局部更新一个节点 */
  updateNode(id: string, patch: FlowNodeUpdatePatch): void;

  /** 局部更新一条连线 */
  updateEdge(id: string, patch: FlowEdgeUpdatePatch): void;

  /** 点亮/熄灭一条连线的执行轨迹 */
  setEdgeActive(id: string | null, active?: boolean): void;

  /** 按 ids 一次删节点，返回实际删除数 */
  removeNodes(ids: string[]): number;

  /** 按 ids 一次删连线，返回实际删除数 */
  removeEdges(ids: string[]): number;

  /** 一次删选区 */
  removeSelected(): number;

  /** 复制（cut=false）或剪切（cut=true）选区 */
  copySelected(cut: boolean): void;

  /** 粘贴剪贴板（如果没有内容则静默） */
  paste(): void;

  /** 选中一个节点 */
  selectNode(id: string): void;

  /** 缩放画布让节点居于视口中心 */
  focusNode(id: string): void;

  /** 节点在画布上的矩形（图面坐标，含缩放） */
  nodeClientRect(id: string): { left: number; top: number; width: number; height: number } | null;

  /** 显示一条连线的操作工具（编辑线/添折点/删除等） */
  showEdgeTools(id: string): void;

  /** 隐藏所有连线的工具 */
  clearEdgeTools(): void;

  /** 按 delta 缩放（正数放大，负数缩小） */
  zoomBy(delta: number): void;

  /** 缩放回 1 */
  resetZoom(): void;

  /** 当前缩放倍率 */
  getScale(): number;

  /** 最小缩放填充整个画布（加 padding） */
  fit(): void;

  /** 最后的缩放/平移，让所有单元格都落在视口内 */
  fitCenter(): void;

  /** 按拓扑分层重排节点；返回被重排的节点数 */
  tidy(): number;

  /** 结构自检：唯一开始、末端必须结束、无自环、无悬空/孤立节点 */
  checkStructure(startType?: string, endType?: string): FlowStructureIssue[];

  /** 撤销（栈空时静默返回） */
  undo(): void;

  /** 重做（栈空时静默返回） */
  redo(): void;

  /** 撤销栈是否可用 */
  canUndo(): boolean;

  /** 重做栈是否可用 */
  canRedo(): boolean;

  /** 导出 X6 原生 JSON（含图形名与 attrs，不是跨版本稳定的持久化格式） */
  toJSON(): Record<string, unknown>;

  /** 用 X6 原生 JSON 覆盖画布并清空撤销栈 */
  fromJSON(json: unknown): void;

  /** 导出 PNG 并触发下载 */
  exportPNG(filename?: string): void;

  /** 卸载画布：解绑快捷键并释放全部内部资源 */
  dispose(): void;
}
