/**
 * ScReteEditor 类型定义
 * 
 * 本模块提供 Rete.js 可视化节点编辑器的类型定义，包括：
 * - Socket（连接点）定义
 * - Node（节点）基类和预定义节点
 * - Connection（连接）定义
 * - 编辑器配置和数据格式
 * 
 * @example 基础使用示例
 * ```typescript
 * import { 
 *   InputNode, 
 *   OutputNode, 
 *   ProcessNode,
 *   type EditorData,
 *   type NodeTypeName 
 * } from '@repo/components';
 * 
 * // 创建节点实例
 * const input = new InputNode('数据输入');
 * const process = new ProcessNode('数据处理');
 * const output = new OutputNode('数据输出');
 * 
 * // 定义编辑器数据
 * const data: EditorData = {
 *   nodes: [
 *     { id: 'node1', type: 'input', label: '输入', position: { x: 100, y: 100 } },
 *     { id: 'node2', type: 'output', label: '输出', position: { x: 400, y: 100 } }
 *   ],
 *   connections: [
 *     { sourceId: 'node1', sourceOutput: 'output', targetId: 'node2', targetInput: 'input' }
 *   ]
 * };
 * ```
 * 
 * @author CH
 * @since 2025-12-24
 */
import { ClassicPreset, GetSchemes, NodeEditor } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import { VuePlugin, VueArea2D } from "rete-vue-plugin";
import { ConnectionPlugin } from "rete-connection-plugin";
import { ContextMenuPlugin } from "rete-context-menu-plugin";
import { MinimapPlugin } from "rete-minimap-plugin";
import { AutoArrangePlugin } from "rete-auto-arrange-plugin";
import type { Component, DefineComponent } from "vue";

/**
 * 基础 Socket（连接点）定义
 * 
 * Socket 是节点之间连接的端点，用于定义节点的输入/输出类型。
 * 只有相同类型的 Socket 才能相互连接。
 * 
 * @example
 * ```typescript
 * // 创建自定义 Socket
 * const mySocket = new BaseSocket('自定义类型');
 * 
 * // 在节点中使用
 * class MyNode extends BaseNode {
 *   constructor() {
 *     super('我的节点');
 *     this.addInput('in', new ClassicPreset.Input(mySocket, '输入'));
 *     this.addOutput('out', new ClassicPreset.Output(mySocket, '输出'));
 *   }
 * }
 * ```
 */
export class BaseSocket extends ClassicPreset.Socket {
  constructor(name: string) {
    super(name);
  }
}

/**
 * 预定义的 Socket 类型
 * 
 * 提供常用的数据类型 Socket，可直接在节点定义中使用。
 * 
 * @example
 * ```typescript
 * import { Sockets } from '@repo/components';
 * 
 * // 使用预定义 Socket
 * this.addInput('data', new ClassicPreset.Input(Sockets.data, '数据输入'));
 * this.addOutput('result', new ClassicPreset.Output(Sockets.any, '结果输出'));
 * 
 * // 可用的 Socket 类型：
 * // - Sockets.any      任意类型，可与所有类型连接
 * // - Sockets.string   字符串类型
 * // - Sockets.number   数字类型
 * // - Sockets.boolean  布尔类型
 * // - Sockets.object   对象类型
 * // - Sockets.array    数组类型
 * // - Sockets.data     通用数据类型
 * // - Sockets.trigger  触发器类型（用于流程控制）
 * ```
 */
export const Sockets = {
  /** 任意类型，可与所有类型连接 */
  any: new BaseSocket("任意"),
  /** 字符串类型 */
  string: new BaseSocket("字符串"),
  /** 数字类型 */
  number: new BaseSocket("数字"),
  /** 布尔类型 */
  boolean: new BaseSocket("布尔"),
  /** 对象类型 */
  object: new BaseSocket("对象"),
  /** 数组类型 */
  array: new BaseSocket("数组"),
  /** 通用数据类型 */
  data: new BaseSocket("数据"),
  /** 触发器类型，用于流程控制 */
  trigger: new BaseSocket("触发器"),
} as const;

/**
 * Socket 类型名称
 * @example 'any' | 'string' | 'number' | 'boolean' | 'object' | 'array' | 'data' | 'trigger'
 */
export type SocketType = keyof typeof Sockets;

/**
 * 基础节点类
 * 
 * 所有自定义节点的基类，提供节点的基本属性和方法。
 * 
 * @property {number} width - 节点宽度（像素），默认 200
 * @property {number} height - 节点高度（像素），默认 140
 * @property {string} nodeType - 节点类型标识
 * @property {string} nodeIcon - 节点图标（Iconify 格式）
 * @property {string} nodeColor - 节点主题色（HEX 格式）
 * 
 * @example 创建自定义节点
 * ```typescript
 * class MyCustomNode extends BaseNode {
 *   nodeType = 'custom';
 *   nodeIcon = 'ri:star-line';
 *   nodeColor = '#ff6b6b';
 *   width = 220;
 *   height = 160;
 *   
 *   constructor(label: string = '自定义节点') {
 *     super(label);
 *     // 添加输入端口
 *     this.addInput('input', new ClassicPreset.Input(Sockets.any, '输入'));
 *     // 添加输出端口
 *     this.addOutput('output', new ClassicPreset.Output(Sockets.any, '输出'));
 *     // 添加控件
 *     this.addControl('value', new ClassicPreset.InputControl('text', { initial: '' }));
 *   }
 * }
 * ```
 */
export class BaseNode extends ClassicPreset.Node {
  /** 节点宽度（像素） */
  width = 200;
  /** 节点高度（像素） */
  height = 140;
  /** 节点类型标识 */
  nodeType: string = "base";
  /** 节点图标（Iconify 格式，如 'ri:star-line'） */
  nodeIcon?: string;
  /** 节点主题色（HEX 格式，如 '#10b981'） */
  nodeColor?: string;
  
  constructor(label: string) {
    super(label);
  }
}

/**
 * 输入节点 - 数据流的起点
 * 
 * 特点：
 * - 只有输出端口，无输入端口
 * - 包含一个文本输入控件
 * - 绿色主题（#10b981）
 * 
 * @example
 * ```typescript
 * const inputNode = new InputNode('MySQL 数据源');
 * await editor.addNode(inputNode);
 * ```
 */
export class InputNode extends BaseNode {
  nodeType = "input";
  nodeIcon = "ri:login-box-line";
  nodeColor = "#10b981";
  
  constructor(label: string = "输入") {
    super(label);
    this.addOutput("output", new ClassicPreset.Output(Sockets.any, "输出"));
    this.addControl(
      "value",
      new ClassicPreset.InputControl("text", { initial: "" })
    );
  }
}

/**
 * 输出节点 - 数据流的终点
 * 
 * 特点：
 * - 只有输入端口，无输出端口
 * - 橙色主题（#f59e0b）
 * 
 * @example
 * ```typescript
 * const outputNode = new OutputNode('Redis 缓存');
 * await editor.addNode(outputNode);
 * ```
 */
export class OutputNode extends BaseNode {
  nodeType = "output";
  nodeIcon = "ri:logout-box-line";
  nodeColor = "#f59e0b";
  
  constructor(label: string = "输出") {
    super(label);
    this.addInput("input", new ClassicPreset.Input(Sockets.any, "输入"));
  }
}

/**
 * 处理节点 - 数据转换/处理
 * 
 * 特点：
 * - 同时拥有输入和输出端口
 * - 紫色主题（#6366f1）
 * 
 * @example
 * ```typescript
 * const processNode = new ProcessNode('数据过滤');
 * await editor.addNode(processNode);
 * ```
 */
export class ProcessNode extends BaseNode {
  nodeType = "process";
  nodeIcon = "ri:settings-3-line";
  nodeColor = "#6366f1";
  
  constructor(label: string = "处理") {
    super(label);
    this.addInput("input", new ClassicPreset.Input(Sockets.any, "输入"));
    this.addOutput("output", new ClassicPreset.Output(Sockets.any, "输出"));
  }
}

/**
 * 条件节点 - 分支逻辑控制
 * 
 * 特点：
 * - 一个输入端口，两个输出端口（真/假）
 * - 包含条件表达式输入控件
 * - 深紫色主题（#8b5cf6）
 * 
 * @example
 * ```typescript
 * const conditionNode = new ConditionNode('数据校验');
 * await editor.addNode(conditionNode);
 * ```
 */
export class ConditionNode extends BaseNode {
  nodeType = "condition";
  nodeIcon = "ri:git-branch-line";
  nodeColor = "#8b5cf6";
  height = 180;
  
  constructor(label: string = "条件") {
    super(label);
    this.addInput("input", new ClassicPreset.Input(Sockets.any, "输入"));
    this.addOutput("true", new ClassicPreset.Output(Sockets.any, "真"));
    this.addOutput("false", new ClassicPreset.Output(Sockets.any, "假"));
    this.addControl(
      "condition",
      new ClassicPreset.InputControl("text", { initial: "" })
    );
  }
}

/**
 * 合并节点 - 多路数据合并
 * 
 * 特点：
 * - 两个输入端口，一个输出端口
 * - 粉色主题（#ec4899）
 * 
 * @example
 * ```typescript
 * const mergeNode = new MergeNode('数据合并');
 * await editor.addNode(mergeNode);
 * ```
 */
export class MergeNode extends BaseNode {
  nodeType = "merge";
  nodeIcon = "ri:git-merge-line";
  nodeColor = "#ec4899";
  height = 160;
  
  constructor(label: string = "合并") {
    super(label);
    this.addInput("input1", new ClassicPreset.Input(Sockets.any, "输入1"));
    this.addInput("input2", new ClassicPreset.Input(Sockets.any, "输入2"));
    this.addOutput("output", new ClassicPreset.Output(Sockets.any, "输出"));
  }
}

/**
 * 延迟节点 - 延时处理
 * 
 * 特点：
 * - 同时拥有输入和输出端口
 * - 包含延迟时间输入控件（毫秒）
 * - 青色主题（#14b8a6）
 * 
 * @example
 * ```typescript
 * const delayNode = new DelayNode('延时 5 秒');
 * await editor.addNode(delayNode);
 * ```
 */
export class DelayNode extends BaseNode {
  nodeType = "delay";
  nodeIcon = "ri:time-line";
  nodeColor = "#14b8a6";
  
  constructor(label: string = "延迟") {
    super(label);
    this.addInput("input", new ClassicPreset.Input(Sockets.any, "输入"));
    this.addOutput("output", new ClassicPreset.Output(Sockets.any, "输出"));
    this.addControl(
      "delay",
      new ClassicPreset.InputControl("number", { initial: 1000 })
    );
  }
}

/**
 * 节点连接类
 * 
 * 表示两个节点之间的连接关系。
 * 
 * @template A - 源节点类型
 * @template B - 目标节点类型
 * 
 * @example
 * ```typescript
 * const conn = new Connection(sourceNode, 'output', targetNode, 'input');
 * await editor.addConnection(conn);
 * ```
 */
export class Connection<
  A extends BaseNode,
  B extends BaseNode
> extends ClassicPreset.Connection<A, B> {}

/**
 * Rete.js Schemes 类型定义
 * 内部使用，定义编辑器的节点和连接类型
 */
export type Schemes = GetSchemes<BaseNode, Connection<BaseNode, BaseNode>>;

/**
 * Area 插件额外类型
 * 内部使用，定义 Vue 渲染插件的类型
 */
export type AreaExtra = VueArea2D<Schemes>;

/**
 * 预定义节点类型映射
 * 
 * 将节点类型名称映射到对应的节点类。
 * 
 * @example
 * ```typescript
 * import { NodeTypes, type NodeTypeName } from '@repo/components';
 * 
 * // 根据类型名创建节点
 * const typeName: NodeTypeName = 'process';
 * const NodeClass = NodeTypes[typeName];
 * const node = new NodeClass('我的处理节点');
 * ```
 */
export const NodeTypes = {
  /** 输入节点 */
  input: InputNode,
  /** 输出节点 */
  output: OutputNode,
  /** 处理节点 */
  process: ProcessNode,
  /** 条件节点 */
  condition: ConditionNode,
  /** 合并节点 */
  merge: MergeNode,
  /** 延迟节点 */
  delay: DelayNode,
} as const;

/**
 * 节点类型名称
 * @example 'input' | 'output' | 'process' | 'condition' | 'merge' | 'delay'
 */
export type NodeTypeName = keyof typeof NodeTypes;

/**
 * 节点配置对象
 * 
 * 用于创建或配置节点时的参数对象。
 * 
 * @example
 * ```typescript
 * const nodeConfig: NodeConfig = {
 *   type: 'process',
 *   label: '数据转换',
 *   position: { x: 200, y: 150 },
 *   data: { transform: 'uppercase' }
 * };
 * ```
 */
export interface NodeConfig {
  /** 节点类型 */
  type: NodeTypeName;
  /** 节点标签/名称 */
  label?: string;
  /** 节点在画布上的位置 */
  position?: { x: number; y: number };
  /** 节点自定义数据 */
  data?: Record<string, any>;
}

/**
 * 连接配置对象
 * 
 * 用于定义两个节点之间的连接关系。
 * 
 * @example
 * ```typescript
 * const connectionConfig: ConnectionConfig = {
 *   sourceId: 'node_1',       // 源节点 ID
 *   sourceOutput: 'output',   // 源节点输出端口名
 *   targetId: 'node_2',       // 目标节点 ID
 *   targetInput: 'input'      // 目标节点输入端口名
 * };
 * ```
 */
export interface ConnectionConfig {
  /** 源节点 ID */
  sourceId: string;
  /** 源节点输出端口名称（如 'output', 'true', 'false'） */
  sourceOutput: string;
  /** 目标节点 ID */
  targetId: string;
  /** 目标节点输入端口名称（如 'input', 'input1', 'input2'） */
  targetInput: string;
}

/**
 * 编辑器数据格式
 * 
 * 用于保存/加载编辑器状态的数据结构。
 * 可通过 v-model 或 getData()/loadData() 方法使用。
 * 
 * @example 完整的编辑器数据示例
 * ```typescript
 * const editorData: EditorData = {
 *   // 节点列表
 *   nodes: [
 *     {
 *       id: 'node_1',
 *       type: 'input',
 *       label: 'MySQL 数据源',
 *       position: { x: 100, y: 100 },
 *       controls: { value: 'SELECT * FROM users' }
 *     },
 *     {
 *       id: 'node_2', 
 *       type: 'process',
 *       label: '数据过滤',
 *       position: { x: 350, y: 100 },
 *       controls: {}
 *     },
 *     {
 *       id: 'node_3',
 *       type: 'output',
 *       label: 'Redis 缓存',
 *       position: { x: 600, y: 100 },
 *       controls: {}
 *     }
 *   ],
 *   // 连接列表
 *   connections: [
 *     {
 *       sourceId: 'node_1',
 *       sourceOutput: 'output',
 *       targetId: 'node_2',
 *       targetInput: 'input'
 *     },
 *     {
 *       sourceId: 'node_2',
 *       sourceOutput: 'output', 
 *       targetId: 'node_3',
 *       targetInput: 'input'
 *     }
 *   ]
 * };
 * ```
 */
export interface EditorData {
  /** 
   * 节点列表
   * 
   * 每个节点包含：
   * - id: 唯一标识
   * - type: 节点类型
   * - label: 显示名称
   * - position: 位置坐标
   * - controls: 控件值（可选）
   */
  nodes: Array<{
    /** 节点唯一标识 */
    id: string;
    /** 节点类型 */
    type: NodeTypeName;
    /** 节点显示名称 */
    label: string;
    /** 节点在画布上的位置坐标 */
    position: { x: number; y: number };
    /** 节点控件的值，key 为控件名称 */
    controls?: Record<string, any>;
  }>;
  /** 
   * 连接列表
   * 
   * 定义节点之间的连接关系
   */
  connections: ConnectionConfig[];
}

/**
 * 编辑器配置选项
 * 
 * 用于配置编辑器的行为和外观。
 * 
 * @example 基础配置示例
 * ```typescript
 * const config: EditorConfig = {
 *   readonly: false,           // 可编辑
 *   minimap: true,             // 显示小地图
 *   contextMenu: true,         // 启用右键菜单
 *   autoArrange: true,         // 启用自动排列
 *   background: 'dots',        // 点阵背景
 *   zoom: { min: 0.2, max: 2 } // 缩放范围 20%-200%
 * };
 * ```
 * 
 * @example 自定义节点类型示例
 * ```typescript
 * class MyNode extends BaseNode {
 *   nodeType = 'custom';
 *   // ...
 * }
 * 
 * const config: EditorConfig = {
 *   customNodeTypes: {
 *     custom: MyNode
 *   },
 *   nodeMenuItems: [
 *     { label: '输入', type: 'input', icon: 'ri:login-box-line' },
 *     { label: '自定义', type: 'custom' as any, icon: 'ri:star-line' }
 *   ]
 * };
 * ```
 */
export interface EditorConfig {
  /** 
   * 是否只读模式
   * 
   * 启用后禁止拖拽、连接、删除等操作
   * @default false
   */
  readonly?: boolean;
  /** 
   * 是否显示小地图
   * 
   * 小地图显示在右下角，方便概览和导航
   * @default false
   */
  minimap?: boolean;
  /** 
   * 是否启用右键菜单
   * 
   * 启用后可通过右键添加节点
   * @default true
   */
  contextMenu?: boolean;
  /** 
   * 是否启用自动排列功能
   * 
   * 启用后可使用 arrange() 方法自动布局节点
   * @default true
   */
  autoArrange?: boolean;
  /** 
   * 是否启用连接线重路由
   * 
   * 启用后可在连接线上添加转点
   * @default false
   */
  reroute?: boolean;
  /** 
   * 背景类型
   * 
   * - 'dots': 点阵背景（默认）
   * - 'lines': 网格线背景
   * - 'none': 无背景
   * @default 'dots'
   */
  background?: "dots" | "lines" | "none";
  /** 
   * 缩放范围限制
   * 
   * @example { min: 0.2, max: 2 } 表示 20%-200%
   * @default { min: 0.2, max: 2 }
   */
  zoom?: { min: number; max: number };
  /** 
   * 自定义节点渲染组件
   * 
   * 用于完全自定义节点的外观
   */
  customNodeComponent?: Component | DefineComponent;
  /** 
   * 自定义节点类型映射
   * 
   * 扩展预定义的节点类型
   * @example { myType: MyNodeClass }
   */
  customNodeTypes?: Record<string, typeof BaseNode>;
  /** 
   * 节点菜单项配置
   * 
   * 配置左侧节点面板和右键菜单中显示的节点类型
   * @example
   * ```typescript
   * [
   *   { label: '输入', type: 'input', icon: 'ri:login-box-line' },
   *   { label: '输出', type: 'output', icon: 'ri:logout-box-line' }
   * ]
   * ```
   */
  nodeMenuItems?: Array<{
    /** 显示标签 */
    label: string;
    /** 节点类型 */
    type: NodeTypeName;
    /** 图标（Iconify 格式） */
    icon?: string;
  }>;
}

/**
 * 编辑器实例对象
 * 
 * 包含编辑器核心和各插件实例，用于高级操作。
 * 可通过组件的 editorInstance 属性获取。
 * 
 * @example
 * ```typescript
 * // 获取编辑器实例
 * const editorRef = ref<InstanceType<typeof ScReteEditor>>();
 * const instance = editorRef.value?.editorInstance;
 * 
 * // 访问底层 API
 * if (instance) {
 *   const nodes = instance.editor.getNodes();
 *   const connections = instance.editor.getConnections();
 * }
 * ```
 */
export interface EditorInstance {
  /** Rete.js 节点编辑器核心 */
  editor: NodeEditor<Schemes>;
  /** 区域插件，管理画布和视图 */
  area: AreaPlugin<Schemes, AreaExtra>;
  /** 连接插件，管理节点连接 */
  connection: ConnectionPlugin<Schemes, AreaExtra>;
  /** Vue 渲染插件 */
  vue: VuePlugin<Schemes, AreaExtra>;
  /** 右键菜单插件（可选） */
  contextMenu?: ContextMenuPlugin<Schemes>;
  /** 小地图插件（可选） */
  minimap?: MinimapPlugin<Schemes>;
  /** 自动排列插件（可选） */
  arrange?: AutoArrangePlugin<Schemes>;
}

/**
 * 编辑器事件类型定义
 * 
 * 定义组件触发的事件及其回调参数。
 * 
 * @example
 * ```vue
 * <ScReteEditor
 *   @node-created="(node) => console.log('创建节点:', node.label)"
 *   @node-removed="(node) => console.log('删除节点:', node.id)"
 *   @node-selected="(node) => selectedNode = node"
 *   @data-changed="(data) => console.log('数据变化:', data)"
 *   @zoom-changed="(zoom) => console.log('缩放:', zoom)"
 * />
 * ```
 */
export interface EditorEvents {
  /** 节点创建事件 */
  "node-created": (node: BaseNode) => void;
  /** 节点删除事件 */
  "node-removed": (node: BaseNode) => void;
  /** 节点选中事件 */
  "node-selected": (node: BaseNode) => void;
  /** 连接创建事件 */
  "connection-created": (connection: Connection<BaseNode, BaseNode>) => void;
  /** 连接删除事件 */
  "connection-removed": (connection: Connection<BaseNode, BaseNode>) => void;
  /** 数据变化事件 */
  "data-changed": (data: EditorData) => void;
  /** 缩放变化事件 */
  "zoom-changed": (zoom: number) => void;
}
