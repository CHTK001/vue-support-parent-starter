/**
 * useFlowEditor - 可视化编排编辑器 Composable
 *
 * 基于 @vue-flow/core 提供编辑器实例管理、节点操作、数据导入导出等功能。
 * 对外 API 保持与 Rete.js / mflows 版本一致，降低迁移成本。
 */
import { ref, shallowRef, watch, nextTick, type Ref } from "vue";
import { useVueFlow, type Node, type Edge } from "@vue-flow/core";
import {
  type EditorData,
  type EditorInstance,
  type NodeTypeName,
  type NodeShape,
} from "./types";

export interface UseFlowEditorOptions {
  readonly?: boolean;
  minimap?: boolean;
  contextMenu?: boolean;
  autoArrange?: boolean;
  fitViewOnInit?: boolean;
  zoom?: { min: number; max: number };
  initialData?: EditorData;
  onDataChange?: (data: EditorData) => void;
  onNodeSelect?: (node: any | null) => void;
  onPaneClick?: () => void;
}

export interface UseFlowEditorReturn {
  nodes: Ref<Node[]>;
  edges: Ref<Edge[]>;
  editorInstance: Ref<EditorInstance | null>;
  initialized: Ref<boolean>;
  loading: Ref<boolean>;
  selectedNode: Ref<any>;
  zoomLevel: Ref<number>;
  init: () => Promise<void>;
  destroy: () => void;
  addNode: (
    type: NodeTypeName,
    label?: string,
    position?: { x: number; y: number },
    shape?: NodeShape,
    extras?: { icon?: string; image?: string; controls?: Record<string, any> },
  ) => Promise<any>;
  removeNode: (nodeId: string) => Promise<boolean>;
  addConnection: (
    sourceId: string,
    sourceOutput: string,
    targetId: string,
    targetInput: string,
  ) => Promise<boolean>;
  removeConnection: (connectionId: string) => Promise<boolean>;
  getData: () => EditorData;
  loadData: (data: EditorData) => Promise<void>;
  clear: () => Promise<void>;
  arrange: () => Promise<void>;
  centerView: () => void;
  zoomToFit: () => void;
  setZoom: (zoom: number) => void;
  undo: () => void;
  redo: () => void;
  registerNode: (type: string, config: any) => void;
  switchTheme: (name: string) => void;
  onConnect: (connection: any) => void;
  onNodeClick: (event: any) => void;
}

const FLOW_ID = "sc-flow-editor";

let nodeIdCounter = 0;
function genId(): string {
  return `node_${Date.now()}_${++nodeIdCounter}`;
}

let edgeIdCounter = 0;
function genEdgeId(): string {
  return `edge_${Date.now()}_${++edgeIdCounter}`;
}

/** EditorData → Vue Flow Node[] */
function toVueFlowNodes(data: EditorData): Node[] {
  return data.nodes.map((n) => ({
    id: n.id,
    type: "spider",
    position: { ...n.position },
    data: {
      nodeType: n.type,
      label: n.label,
      shape: n.shape,
      icon: n.icon,
      image: n.image,
      controls: n.controls,
    },
  }));
}

/** EditorData → Vue Flow Edge[] */
function toVueFlowEdges(data: EditorData): Edge[] {
  return data.connections.map((c) => ({
    id: c.id || genEdgeId(),
    source: c.sourceId,
    target: c.targetId,
    sourceHandle: c.sourceOutput,
    targetHandle: c.targetInput,
    label: c.label,
    class: [
      c.visited ? "runtime-visited" : "",
      c.runtimeStatus ? `runtime-${String(c.runtimeStatus).toLowerCase()}` : "",
    ].filter(Boolean).join(" "),
    animated: c.runtimeStatus === "RUNNING",
  }));
}

/** Vue Flow Node[]/Edge[] → EditorData */
function fromVueFlowState(nodes: Node[], edges: Edge[]): EditorData {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: (n.data?.nodeType || n.type || "process") as NodeTypeName,
      label: n.data?.label || n.id,
      position: n.position || { x: 0, y: 0 },
      controls: n.data?.controls,
      shape: n.data?.shape as NodeShape | undefined,
      icon: n.data?.icon,
      image: n.data?.image,
    })),
    connections: edges.map((e) => ({
      id: e.id,
      sourceId: e.source,
      sourceOutput: e.sourceHandle || "output",
      targetId: e.target,
      targetInput: e.targetHandle || "input",
      label: typeof e.label === "string" ? e.label : undefined,
    })),
  };
}

export function useFlowEditor(
  options: UseFlowEditorOptions = {},
): UseFlowEditorReturn {
  // 创建/获取 Vue Flow store（通过 id 共享，无需在 <VueFlow> 内部调用）
  const vueFlow = useVueFlow({ id: FLOW_ID });

  // 响应式状态
  const nodes = ref<Node[]>([]);
  const edges = ref<Edge[]>([]);
  const editorInstance = shallowRef<EditorInstance | null>(null);
  const initialized = ref(false);
  const loading = ref(false);
  const selectedNode = ref<any>(null);
  const zoomLevel = ref(1);

  let isLoadingData = false;
  let changeFrame: ReturnType<typeof setTimeout> | null = null;
  let hasFitOnInit = false;
  let lastDataSignature = "";

  // 撤销/重做
  let historyStack: Array<{ nodes: Node[]; edges: Edge[] }> = [];
  let historyIndex = -1;
  const MAX_HISTORY = 50;

  function pushHistory() {
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push({
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
    });
    if (historyStack.length > MAX_HISTORY) historyStack.shift();
    historyIndex = historyStack.length - 1;
  }

  // 初始化
  async function init() {
    loading.value = true;
    try {
      initialized.value = true;
      if (options.initialData && options.initialData.nodes.length > 0) {
        await loadData(options.initialData);
      }
      if (options.fitViewOnInit !== false && !hasFitOnInit) {
        await nextTick();
        zoomToFit();
        hasFitOnInit = true;
      }
    } finally {
      loading.value = false;
    }
  }

  function destroy() {
    editorInstance.value = null;
    initialized.value = false;
  }

  // ---- 节点 CRUD ----
  async function addNode(
    type: NodeTypeName,
    label?: string,
    position?: { x: number; y: number },
    shape?: NodeShape,
    extras?: { icon?: string; image?: string; controls?: Record<string, any> },
  ): Promise<any> {
    const id = genId();
    const node: Node = {
      id,
      type: "spider",
      position: position || { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        nodeType: type,
        label: label || type,
        shape,
        icon: extras?.icon,
        image: extras?.image,
        controls: extras?.controls,
      },
    };
    nodes.value = [...nodes.value, node];
    pushHistory();
    return { id, ...node };
  }

  async function removeNode(nodeId: string): Promise<boolean> {
    const before = nodes.value.length;
    nodes.value = nodes.value.filter((n) => n.id !== nodeId);
    edges.value = edges.value.filter(
      (e) => e.source !== nodeId && e.target !== nodeId,
    );
    if (nodes.value.length < before) {
      pushHistory();
      return true;
    }
    return false;
  }

  // ---- 连线 CRUD ----
  async function addConnection(
    sourceId: string,
    sourceOutput: string,
    targetId: string,
    targetInput: string,
  ): Promise<boolean> {
    const exists = edges.value.some(
      (e) =>
        e.source === sourceId &&
        e.target === targetId &&
        e.sourceHandle === sourceOutput,
    );
    if (exists) return false;

    const edge: Edge = {
      id: genEdgeId(),
      source: sourceId,
      target: targetId,
      sourceHandle: sourceOutput,
      targetHandle: targetInput,
    };
    edges.value = [...edges.value, edge];
    pushHistory();
    return true;
  }

  async function removeConnection(connectionId: string): Promise<boolean> {
    const before = edges.value.length;
    edges.value = edges.value.filter((e) => e.id !== connectionId);
    if (edges.value.length < before) {
      pushHistory();
      return true;
    }
    return false;
  }

  // ---- 数据导入导出 ----
  function getData(): EditorData {
    return fromVueFlowState(nodes.value, edges.value);
  }

  async function loadData(data: EditorData): Promise<void> {
    isLoadingData = true;
    try {
      nodes.value = toVueFlowNodes(data);
      edges.value = toVueFlowEdges(data);
      await nextTick();
      lastDataSignature = JSON.stringify(data);
      pushHistory();
    } finally {
      isLoadingData = false;
    }
  }

  async function clear(): Promise<void> {
    nodes.value = [];
    edges.value = [];
    pushHistory();
  }

  // ---- 布局 ----
  async function arrange(): Promise<void> {
    try {
      const dagre = await import("dagre");
      const g = new dagre.graphlib.Graph();
      g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 80 });
      g.setDefaultEdgeLabel(() => ({}));

      for (const n of nodes.value) {
        g.setNode(n.id, {
          width: 160,
          height: n.data?.shape === "circle" ? 80 : 60,
        });
      }
      for (const e of edges.value) {
        g.setEdge(e.source, e.target);
      }
      dagre.layout(g);

      const updated = nodes.value.map((n) => {
        const dag = g.node(n.id);
      if (dag) {
          return {
            ...n,
            position: {
              x: dag.x - 160 / 2,
              y: dag.y - (dag.height || 60) / 2,
            },
          };
        }
        return n;
      });
      nodes.value = updated;
      pushHistory();
    } catch {
      // ignore auto layout failures
    }
  }

  function centerView(): void {
    try {
      vueFlow.fitView();
    } catch {
      /* ignore */
    }
  }

  function zoomToFit(): void {
    try {
      vueFlow.fitView();
    } catch {
      /* ignore */
    }
  }

  function setZoom(zoom: number): void {
    try {
      vueFlow.zoomTo(zoom);
    } catch {
      /* ignore */
    }
    zoomLevel.value = zoom;
  }

  // ---- 撤销/重做 ----
  function undo(): void {
    if (historyIndex <= 0) return;
    historyIndex--;
    const state = historyStack[historyIndex];
    if (state) {
      nodes.value = JSON.parse(JSON.stringify(state.nodes));
      edges.value = JSON.parse(JSON.stringify(state.edges));
    }
  }

  function redo(): void {
    if (historyIndex >= historyStack.length - 1) return;
    historyIndex++;
    const state = historyStack[historyIndex];
    if (state) {
      nodes.value = JSON.parse(JSON.stringify(state.nodes));
      edges.value = JSON.parse(JSON.stringify(state.edges));
    }
  }

  // ---- 注册节点类型（保留接口） ----
  function registerNode(_type: string, _config: any): void {
    // Vue Flow 使用 nodeTypes prop 注册，无需运行注册
  }

  function switchTheme(_name: string): void {
    // Vue Flow 无主题概念，由 scss 变量接管
  }

  // ---- 事件处理 ----
  function onConnect(connection: any) {
    if (!connection.source || !connection.target) return;
    addConnection(
      connection.source,
      connection.sourceHandle || "output",
      connection.target,
      connection.targetHandle || "input",
    );
  }

  function onPaneClick() {
    selectedNode.value = null;
    options.onNodeSelect?.(null);
    options.onPaneClick?.();
  }

  function onNodeClick(event: any) {
    const node = event?.node || event;
    if (node) {
      selectedNode.value = {
        id: node.id,
        label: node.data?.label || node.id,
        nodeType: node.data?.nodeType || "",
        data: node.data,
        position: node.position,
      };
      options.onNodeSelect?.(selectedNode.value);
    }
  }

  // ---- 监听变化 ----
  watch(
    [nodes, edges],
    () => {
      if (isLoadingData) return;
      if (changeFrame) {
        clearTimeout(changeFrame);
      }
      changeFrame = setTimeout(() => {
        const data = getData();
        const signature = JSON.stringify(data);
        if (signature !== lastDataSignature) {
          lastDataSignature = signature;
          options.onDataChange?.(data);
        }
        changeFrame = null;
      }, 16);
    },
    { deep: true },
  );

  editorInstance.value = { vueFlowRef: null };

  return {
    nodes,
    edges,
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
    registerNode,
    switchTheme,
    onConnect,
    onNodeClick,
    onPaneClick,
  };
}

export default useFlowEditor;

