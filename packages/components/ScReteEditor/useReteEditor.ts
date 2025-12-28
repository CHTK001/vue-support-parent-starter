/**
 * Rete Editor Composable
 * 
 * 提供 Rete.js 编辑器的初始化和管理功能的组合式函数。
 * 包含编辑器生命周期、节点操作、连接管理、视图控制等功能。
 * 
 * @example 基础使用示例
 * ```typescript
 * import { useReteEditor } from '@repo/components';
 * 
 * // 在 setup 中使用
 * const {
 *   containerRef,
 *   initialized,
 *   addNode,
 *   getData,
 *   loadData,
 *   init
 * } = useReteEditor({
 *   minimap: true,
 *   contextMenu: true,
 *   autoArrange: true,
 *   onDataChange: (data) => {
 *     console.log('数据变化:', data);
 *   }
 * });
 * 
 * // 将 containerRef 绑定到模板
 * // <div ref="containerRef" style="width: 100%; height: 500px;"></div>
 * 
 * // 初始化
 * onMounted(() => {
 *   init();
 * });
 * 
 * // 添加节点
 * const handleAddNode = async () => {
 *   await addNode('process', '数据处理', { x: 200, y: 100 });
 * };
 * 
 * // 获取数据
 * const handleSave = () => {
 *   const data = getData();
 *   console.log('保存数据:', data);
 * };
 * ```
 * 
 * @example 加载已有数据
 * ```typescript
 * const { loadData, init } = useReteEditor({
 *   initialData: {
 *     nodes: [
 *       { id: 'n1', type: 'input', label: '输入', position: { x: 100, y: 100 } },
 *       { id: 'n2', type: 'output', label: '输出', position: { x: 400, y: 100 } }
 *     ],
 *     connections: [
 *       { sourceId: 'n1', sourceOutput: 'output', targetId: 'n2', targetInput: 'input' }
 *     ]
 *   }
 * });
 * ```
 * 
 * @author CH
 * @since 2025-12-24
 */
import { ref, shallowRef, onUnmounted, type Ref } from "vue";
import { NodeEditor } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import { ConnectionPlugin, Presets as ConnectionPresets } from "rete-connection-plugin";
import { VuePlugin, Presets as VuePresets } from "rete-vue-plugin";
import { ContextMenuPlugin, Presets as ContextMenuPresets } from "rete-context-menu-plugin";
import { MinimapPlugin } from "rete-minimap-plugin";
import { AutoArrangePlugin, Presets as ArrangePresets } from "rete-auto-arrange-plugin";
import { 
  type Schemes, 
  type AreaExtra,
  type EditorConfig,
  type EditorData,
  type EditorInstance,
  type NodeTypeName,
  BaseNode,
  Connection,
  NodeTypes,
  InputNode,
  OutputNode,
  ProcessNode,
  ConditionNode,
  MergeNode,
  DelayNode,
} from "./types";

/**
 * useReteEditor 配置选项
 * 
 * 继承自 EditorConfig，并添加初始数据和回调函数配置。
 * 
 * @example
 * ```typescript
 * const options: UseReteEditorOptions = {
 *   // 基础配置
 *   readonly: false,
 *   minimap: true,
 *   contextMenu: true,
 *   autoArrange: true,
 *   background: 'dots',
 *   zoom: { min: 0.2, max: 2 },
 *   
 *   // 初始数据
 *   initialData: {
 *     nodes: [...],
 *     connections: [...]
 *   },
 *   
 *   // 回调函数
 *   onDataChange: (data) => console.log('数据变化:', data),
 *   onNodeSelect: (node) => console.log('选中节点:', node?.label)
 * };
 * ```
 */
export interface UseReteEditorOptions extends EditorConfig {
  /** 
   * 初始数据
   * 
   * 编辑器初始化后自动加载的数据
   * @example
   * ```typescript
   * initialData: {
   *   nodes: [
   *     { id: 'node1', type: 'input', label: '输入', position: { x: 100, y: 100 } }
   *   ],
   *   connections: []
   * }
   * ```
   */
  initialData?: EditorData;
  /** 
   * 数据变化回调
   * 
   * 当节点/连接发生变化时触发
   * @param data - 最新的编辑器数据
   */
  onDataChange?: (data: EditorData) => void;
  /** 
   * 节点选中回调
   * 
   * 当用户选中节点时触发
   * @param node - 选中的节点，取消选中时为 null
   */
  onNodeSelect?: (node: BaseNode | null) => void;
}

/**
 * useReteEditor 返回值类型
 * 
 * 包含编辑器的状态、引用和操作方法。
 */
export interface UseReteEditorReturn {
  /** 
   * 容器元素引用
   * 
   * 需要绑定到模板中的 DOM 元素
   * @example <div ref="containerRef" style="height: 500px"></div>
   */
  containerRef: Ref<HTMLElement | undefined>;
  /** 
   * 编辑器实例
   * 
   * 包含 Rete.js 核心和各插件实例，用于高级操作
   */
  editorInstance: Ref<EditorInstance | null>;
  /** 是否已初始化 */
  initialized: Ref<boolean>;
  /** 是否正在加载 */
  loading: Ref<boolean>;
  /** 当前选中的节点 */
  selectedNode: Ref<BaseNode | null>;
  /** 当前缩放级别 (0.2-2) */
  zoomLevel: Ref<number>;
  
  // 生命周期方法
  /** 初始化编辑器，需要在 onMounted 中调用 */
  init: () => Promise<void>;
  /** 销毁编辑器，组件卸载时自动调用 */
  destroy: () => void;
  
  // 节点操作
  /** 
   * 添加节点
   * @param type - 节点类型: 'input' | 'output' | 'process' | 'condition' | 'merge' | 'delay'
   * @param label - 节点标签（可选）
   * @param position - 位置坐标（可选，默认随机位置）
   * @returns 创建的节点实例
   * @example await addNode('process', '数据处理', { x: 200, y: 100 })
   */
  addNode: (type: NodeTypeName, label?: string, position?: { x: number; y: number }) => Promise<BaseNode | null>;
  /** 
   * 删除节点
   * @param nodeId - 节点 ID
   * @returns 是否删除成功
   */
  removeNode: (nodeId: string) => Promise<boolean>;
  
  // 连接操作
  /** 
   * 添加连接
   * @param sourceId - 源节点 ID
   * @param sourceOutput - 源输出端口名（如 'output', 'true', 'false'）
   * @param targetId - 目标节点 ID
   * @param targetInput - 目标输入端口名（如 'input', 'input1'）
   * @returns 是否连接成功
   * @example await addConnection('node1', 'output', 'node2', 'input')
   */
  addConnection: (sourceId: string, sourceOutput: string, targetId: string, targetInput: string) => Promise<boolean>;
  /** 
   * 删除连接
   * @param connectionId - 连接 ID
   * @returns 是否删除成功
   */
  removeConnection: (connectionId: string) => Promise<boolean>;
  
  // 数据操作
  /** 
   * 获取编辑器数据
   * @returns EditorData 格式的数据
   * @example const data = getData(); JSON.stringify(data);
   */
  getData: () => EditorData;
  /** 
   * 加载数据
   * @param data - EditorData 格式的数据
   * @example await loadData({ nodes: [...], connections: [...] })
   */
  loadData: (data: EditorData) => Promise<void>;
  /** 清空编辑器，删除所有节点和连接 */
  clear: () => Promise<void>;
  
  // 视图控制
  /** 自动排列节点（需启用 autoArrange 配置） */
  arrange: () => Promise<void>;
  /** 居中视图，显示所有节点 */
  centerView: () => void;
  /** 缩放至适应画布 */
  zoomToFit: () => void;
  /** 
   * 设置缩放级别
   * @param zoom - 缩放值 (0.2-2)
   * @example setZoom(1.5) // 放大到 150%
   */
  setZoom: (zoom: number) => void;
  
  // 撤销/重做（占位）
  /** 撤销（未实现） */
  undo: () => void;
  /** 重做（未实现） */
  redo: () => void;
}

export function useReteEditor(options: UseReteEditorOptions = {}): UseReteEditorReturn {
  const containerRef = ref<HTMLElement>();
  const editorInstance = shallowRef<EditorInstance | null>(null);
  const initialized = ref(false);
  const loading = ref(false);
  const selectedNode = ref<BaseNode | null>(null);
  const zoomLevel = ref(1);
  
  // 标记是否正在加载数据，避免在加载过程中触发 onDataChange
  let isLoadingData = false;

  // 合并自定义节点类型
  const allNodeTypes: Record<string, typeof BaseNode> = {
    ...NodeTypes,
    ...(options.customNodeTypes || {}),
  };

  // 创建节点
  function createNode(type: NodeTypeName, label?: string): BaseNode | null {
    const NodeClass = allNodeTypes[type];
    if (!NodeClass) {
      console.warn(`Unknown node type: ${type}`);
      return null;
    }
    return new NodeClass(label);
  }

  // 初始化编辑器
  async function init() {
    if (!containerRef.value || initialized.value) return;
    
    loading.value = true;
    
    try {
      // 创建编辑器
      const editor = new NodeEditor<Schemes>();
      
      // 创建 Area 插件
      const area = new AreaPlugin<Schemes, AreaExtra>(containerRef.value);
      
      // 创建连接插件
      const connection = new ConnectionPlugin<Schemes, AreaExtra>();
      connection.addPreset(ConnectionPresets.classic.setup());
      
      // 创建 Vue 渲染插件
      const vue = new VuePlugin<Schemes, AreaExtra>();
      vue.addPreset(VuePresets.classic.setup());
      
      // 创建实例对象
      const instance: EditorInstance = {
        editor,
        area,
        connection,
        vue,
      };
      
      // 先将 area 挂载到 editor，这必须在 area.use() 之前
      await editor.use(area);
      
      // 右键菜单
      if (options.contextMenu !== false) {
        const contextMenu = new ContextMenuPlugin<Schemes>({
          items: ContextMenuPresets.classic.setup([
            ["输入节点", () => addNode("input")],
            ["输出节点", () => addNode("output")],
            ["处理节点", () => addNode("process")],
            ["条件节点", () => addNode("condition")],
            ["合并节点", () => addNode("merge")],
            ["延迟节点", () => addNode("delay")],
          ]),
        });
        area.use(contextMenu);
        instance.contextMenu = contextMenu;
      }
      
      // 小地图
      if (options.minimap) {
        const minimap = new MinimapPlugin<Schemes>({
          boundViewport: true,
        });
        area.use(minimap);
        instance.minimap = minimap;
      }
      
      // 自动排列
      if (options.autoArrange) {
        const arrange = new AutoArrangePlugin<Schemes>();
        arrange.addPreset(ArrangePresets.classic.setup());
        area.use(arrange);
        instance.arrange = arrange;
      }
      
      // 使用插件
      area.use(connection);
      area.use(vue);
      
      // 设置选择扩展
      AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
        accumulating: AreaExtensions.accumulateOnCtrl(),
      });
      
      // 限制视口
      if (options.zoom) {
        AreaExtensions.restrictor(area, {
          scaling: () => ({ min: options.zoom!.min, max: options.zoom!.max }),
        });
      }
      
      // 监听事件
      editor.addPipe((context) => {
        // 在加载数据过程中不触发 onDataChange，避免无限循环
        if (isLoadingData) {
          return context;
        }
        if (context.type === "nodecreated") {
          options.onDataChange?.(getData());
        }
        if (context.type === "noderemoved") {
          options.onDataChange?.(getData());
        }
        if (context.type === "connectioncreated") {
          options.onDataChange?.(getData());
        }
        if (context.type === "connectionremoved") {
          options.onDataChange?.(getData());
        }
        return context;
      });
      
      area.addPipe((context) => {
        if (context.type === "zoom") {
          zoomLevel.value = context.data.zoom;
        }
        if (context.type === "nodepicked") {
          const node = editor.getNode(context.data.id);
          selectedNode.value = node || null;
          options.onNodeSelect?.(node || null);
        }
        return context;
      });
      
      editorInstance.value = instance;
      initialized.value = true;
      
      // 加载初始数据
      if (options.initialData) {
        await loadData(options.initialData);
      }
      
      // 居中视图
      setTimeout(() => {
        zoomToFit();
      }, 100);
      
    } catch (error) {
      console.error("Failed to initialize Rete editor:", error);
    } finally {
      loading.value = false;
    }
  }

  // 销毁编辑器
  function destroy() {
    if (editorInstance.value) {
      editorInstance.value.area.destroy();
      editorInstance.value = null;
      initialized.value = false;
    }
  }

  // 添加节点
  async function addNode(
    type: NodeTypeName, 
    label?: string, 
    position?: { x: number; y: number }
  ): Promise<BaseNode | null> {
    if (!editorInstance.value) return null;
    
    const node = createNode(type, label);
    if (!node) return null;
    
    await editorInstance.value.editor.addNode(node);
    
    // 设置位置
    const pos = position || { x: Math.random() * 400, y: Math.random() * 400 };
    await editorInstance.value.area.translate(node.id, pos);
    
    return node;
  }

  // 删除节点
  async function removeNode(nodeId: string): Promise<boolean> {
    if (!editorInstance.value) return false;
    
    try {
      // 先删除相关连接
      const connections = editorInstance.value.editor.getConnections();
      for (const conn of connections) {
        if (conn.source === nodeId || conn.target === nodeId) {
          await editorInstance.value.editor.removeConnection(conn.id);
        }
      }
      
      // 删除节点
      await editorInstance.value.editor.removeNode(nodeId);
      return true;
    } catch (error) {
      console.error("Failed to remove node:", error);
      return false;
    }
  }

  // 添加连接
  async function addConnection(
    sourceId: string, 
    sourceOutput: string, 
    targetId: string, 
    targetInput: string
  ): Promise<boolean> {
    if (!editorInstance.value) return false;
    
    try {
      const sourceNode = editorInstance.value.editor.getNode(sourceId);
      const targetNode = editorInstance.value.editor.getNode(targetId);
      
      if (!sourceNode || !targetNode) return false;
      
      const conn = new Connection(sourceNode, sourceOutput, targetNode, targetInput);
      await editorInstance.value.editor.addConnection(conn);
      return true;
    } catch (error) {
      console.error("Failed to add connection:", error);
      return false;
    }
  }

  // 删除连接
  async function removeConnection(connectionId: string): Promise<boolean> {
    if (!editorInstance.value) return false;
    
    try {
      await editorInstance.value.editor.removeConnection(connectionId);
      return true;
    } catch (error) {
      console.error("Failed to remove connection:", error);
      return false;
    }
  }

  // 获取编辑器数据
  function getData(): EditorData {
    if (!editorInstance.value) {
      return { nodes: [], connections: [] };
    }
    
    const editor = editorInstance.value.editor;
    const area = editorInstance.value.area;
    
    const nodes = editor.getNodes().map((node) => {
      const view = area.nodeViews.get(node.id);
      const controls: Record<string, any> = {};
      
      // 收集控件值
      Object.entries(node.controls).forEach(([key, control]) => {
        if (control && "value" in control) {
          controls[key] = (control as any).value;
        }
      });
      
      return {
        id: node.id,
        type: (node as BaseNode).nodeType as NodeTypeName,
        label: node.label,
        position: view ? { x: view.position.x, y: view.position.y } : { x: 0, y: 0 },
        controls,
      };
    });
    
    const connections = editor.getConnections().map((conn) => ({
      sourceId: conn.source,
      sourceOutput: conn.sourceOutput,
      targetId: conn.target,
      targetInput: conn.targetInput,
    }));
    
    return { nodes, connections };
  }

  // 加载数据
  async function loadData(data: EditorData): Promise<void> {
    if (!editorInstance.value) return;
    
    // 标记正在加载数据，避免触发 onDataChange
    isLoadingData = true;
    
    try {
    // 清空现有数据
    await clear();
    
    // 创建节点映射
    const nodeMap = new Map<string, BaseNode>();
    
    // 添加节点
    for (const nodeData of data.nodes) {
      const node = createNode(nodeData.type, nodeData.label);
      if (node) {
        // 恢复控件值
        if (nodeData.controls) {
          Object.entries(nodeData.controls).forEach(([key, value]) => {
            const control = node.controls[key];
            if (control && "value" in control) {
              (control as any).value = value;
            }
          });
        }
        
        await editorInstance.value!.editor.addNode(node);
        await editorInstance.value!.area.translate(node.id, nodeData.position);
        nodeMap.set(nodeData.id, node);
      }
    }
    
    // 添加连接
    for (const connData of data.connections) {
      const sourceNode = nodeMap.get(connData.sourceId);
      const targetNode = nodeMap.get(connData.targetId);
      
      if (sourceNode && targetNode) {
        const conn = new Connection(
          sourceNode,
          connData.sourceOutput,
          targetNode,
          connData.targetInput
        );
        await editorInstance.value!.editor.addConnection(conn);
      }
    }
    } finally {
      // 加载完成，恢复标记
      isLoadingData = false;
    }
  }

  // 清空编辑器
  async function clear(): Promise<void> {
    if (!editorInstance.value) return;
    
    const editor = editorInstance.value.editor;
    
    // 删除所有连接
    const connections = [...editor.getConnections()];
    for (const conn of connections) {
      try {
        await editor.removeConnection(conn.id);
      } catch (e) {
        // 连接可能已被删除
      }
    }
    
    // 删除所有节点
    const nodes = [...editor.getNodes()];
    for (const node of nodes) {
      try {
        // 检查节点是否仍存在
        if (editor.getNode(node.id)) {
          await editor.removeNode(node.id);
        }
      } catch (e) {
        // 节点可能已被删除
      }
    }
  }

  // 自动排列节点
  async function arrange(): Promise<void> {
    if (!editorInstance.value?.arrange) return;
    await editorInstance.value.arrange.layout();
  }

  // 居中视图
  function centerView(): void {
    if (!editorInstance.value) return;
    AreaExtensions.zoomAt(editorInstance.value.area, editorInstance.value.editor.getNodes());
  }

  // 缩放到适应
  function zoomToFit(): void {
    if (!editorInstance.value) return;
    AreaExtensions.zoomAt(editorInstance.value.area, editorInstance.value.editor.getNodes());
  }

  // 设置缩放
  function setZoom(zoom: number): void {
    if (!editorInstance.value) return;
    editorInstance.value.area.area.zoom(zoom);
  }

  // 撤销（占位）
  function undo(): void {
    console.warn("Undo is not implemented yet");
  }

  // 重做（占位）
  function redo(): void {
    console.warn("Redo is not implemented yet");
  }

  // 组件卸载时销毁编辑器
  onUnmounted(() => {
    destroy();
  });

  return {
    containerRef,
    editorInstance,
    initialized,
    loading,
    selectedNode,
    zoomLevel,
    init,
    destroy,
    addNode,
    removeNode,
    addConnection,
    removeConnection,
    getData,
    loadData,
    clear,
    arrange,
    centerView,
    zoomToFit,
    setZoom,
    undo,
    redo,
  };
}

export default useReteEditor;
