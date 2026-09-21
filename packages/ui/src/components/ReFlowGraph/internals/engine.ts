/**
 * FlowGraphEngine —— ReFlowGraph 的 X6 内核
 *
 * 面向"流程设计器"（不是图查看器）：小图标节点 + 正交彩色连线 + 四向磁吸 +
 * 拖拽入板 + 框选 + 辅助线 + 撤销重做 + 就地改名 + 结构自检。
 * 观感与交互对齐 spider-flow 的编辑器，全部业务差异走 attrs/data，不注册新图形。
 */
import { Graph, Shape, Node as X6Node, Edge as X6Edge, Cell } from "@antv/x6";
import { Snapline } from "@antv/x6-plugin-snapline";
import { Selection } from "@antv/x6-plugin-selection";
import { Keyboard } from "@antv/x6-plugin-keyboard";
import { Clipboard } from "@antv/x6-plugin-clipboard";
import { History } from "@antv/x6-plugin-history";
import { MiniMap } from "@antv/x6-plugin-minimap";
import { Export } from "@antv/x6-plugin-export";
import {
  FLOW_EDGE_SHAPE,
  FLOW_NODE_SHAPE,
  NODE_SIZE,
  buildFlowEdgeMetadata,
  buildFlowNodeMetadata,
  ensureFlowRegistered,
  flowEdgeAttrs,
  resolveFlowType,
} from "./shapes";
import type {
  FlowEdge,
  FlowEdgeKind,
  FlowGraphData,
  FlowNode,
  FlowNodeTypeDef,
  FlowSelection,
  FlowStructureIssue,
} from "./types";

/** 从 X6 事件参数里稳妥取原生 MouseEvent */
function nativeEvent(e: unknown): MouseEvent {
  const box = e as { originalEvent?: MouseEvent; e?: MouseEvent };
  return ((box?.originalEvent ?? box?.e) as MouseEvent) || (new MouseEvent("click"));
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function readFlowNode(cell: X6Node): FlowNode {
  const data = (cell.getData() ?? {}) as {
    flowType?: string;
    flowLabel?: string;
    flowData?: Record<string, unknown>;
  };
  const pos = cell.getPosition();
  return {
    id: cell.id,
    type: data.flowType ?? "default",
    label: data.flowLabel ?? "",
    x: Math.round(pos.x),
    y: Math.round(pos.y),
    data: data.flowData ?? {},
  };
}

function readFlowEdge(cell: X6Edge): FlowEdge {
  const data = (cell.getData() ?? {}) as {
    flowKind?: FlowEdgeKind;
    flowTransfer?: boolean;
    flowData?: Record<string, unknown>;
  };
  const source = cell.getSource() as { cell?: string; port?: string };
  const target = cell.getTarget() as { cell?: string; port?: string };
  const labels = cell.getLabels() as Array<{ attrs?: { label?: { text?: string } } }>;
  return {
    id: cell.id,
    from: source.cell ?? "",
    to: target.cell ?? "",
    fromPort: source.port,
    toPort: target.port,
    kind: data.flowKind ?? "normal",
    label: labels[0]?.attrs?.label?.text ?? "",
    transfer: data.flowTransfer !== false,
    data: data.flowData ?? {},
  };
}

export interface FlowEngineHandlers {
  onReady?: (engine: FlowGraphEngine) => void;
  onSelect?: (selection: FlowSelection) => void;
  onChange?: (data: FlowGraphData) => void;
  onNodeClick?: (node: FlowNode, e: MouseEvent) => void;
  onNodeDblClick?: (node: FlowNode, e: MouseEvent) => void;
  onNodeContextMenu?: (node: FlowNode, e: MouseEvent) => void;
  onEdgeClick?: (edge: FlowEdge, e: MouseEvent) => void;
  onEdgeConnected?: (edge: FlowEdge) => void;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
}

export interface FlowEngineOptions {
  container: HTMLElement;
  minimapContainer?: HTMLElement | null;
  nodeTypes?: FlowNodeTypeDef[];
  readonly?: boolean;
  /** 网格背景 */
  grid?: boolean;
  handlers?: FlowEngineHandlers;
}

export class FlowGraphEngine {
  graph: Graph;
  private opts: FlowEngineOptions;
  /** setData 期间抑制 change 事件，避免上层拿到半成品 */
  private loading = false;
  private types: FlowNodeTypeDef[];

  constructor(options: FlowEngineOptions) {
    ensureFlowRegistered();
    this.opts = options;
    this.types = options.nodeTypes ?? [];

    const readonly = !!options.readonly;
    this.graph = new Graph({
      container: options.container,
      autoResize: true,
      background: { color: "transparent" },
      grid: options.grid === false
        ? false
        : {
            visible: true,
            type: "dot",
            args: [
              { color: "#e9edf2", thickness: 1 },
              { color: "#f3f6fa", thickness: 1, factor: 4 },
            ],
          },
      mousewheel: { enabled: true, modifiers: ["ctrl", "meta"], minScale: 0.3, maxScale: 2.5 },
      panning: { enabled: true, modifiers: "space" },
      connecting: {
        router: { name: "orth", args: { padding: 28 } },
        connector: { name: "rounded", args: { radius: 8 } },
        anchor: "center",
        connectionPoint: "boundary",
        allowBlank: false,
        allowNode: true,
        allowEdge: false,
        allowLoop: false,
        allowMulti: false,
        highlight: true,
        snap: { radius: 24 },
        createEdge() {
          return this.createEdge({
            shape: FLOW_EDGE_SHAPE,
            attrs: flowEdgeAttrs("normal", true),
            data: { flowKind: "normal", flowTransfer: true, flowData: {} },
          });
        },
        validateConnection({ sourceCell, targetCell }) {
          return !!sourceCell && !!targetCell && sourceCell !== targetCell;
        },
      },
      highlighting: {
        magnetAvailable: {
          name: "stroke",
          args: { padding: 4, attrs: { strokeWidth: 1.5, stroke: "#4f7cff" } },
        },
        magnetAdsorbed: {
          name: "stroke",
          args: { padding: 4, attrs: { strokeWidth: 2, stroke: "#00b96b" } },
        },
        nodeAvailable: {
          name: "stroke",
          args: { padding: 4, attrs: { strokeWidth: 1.5, stroke: "#4f7cff" } },
        },
      },
      interacting: readonly
        ? {
            nodeMovable: false,
            edgeMovable: false,
            edgeLabelMovable: false,
            arrowheadMovable: false,
            vertexMovable: false,
            vertexAddable: false,
            vertexDeletable: false,
            magnetConnectable: false,
          }
        : {
            nodeMovable: true,
            edgeMovable: true,
            edgeLabelMovable: true,
            arrowheadMovable: true,
            vertexMovable: true,
            vertexAddable: true,
            vertexDeletable: true,
            magnetConnectable: true,
          },
    });

    this.graph
      .use(new Snapline({ enabled: true }))
      .use(
        new Selection({
          enabled: true,
          multiple: true,
          rubberband: true,
          showNodeSelectionBox: true,
          // 选中框盖在节点上，若吃指针事件就从端口拖不出线了
          pointerEvents: "none",
        }),
      )
      .use(new Keyboard({ enabled: true }))
      .use(new Clipboard({ enabled: true }))
      .use(new History({ enabled: true }))
      .use(new Export());

    if (options.minimapContainer) {
      this.graph.use(
        new MiniMap({ container: options.minimapContainer, width: 184, height: 124, padding: 8 }),
      );
    }

    this.bindEvents();
    if (!readonly) this.bindKeys();
    options.handlers?.onReady?.(this);
  }

  // ------------------------------------------------------------
  // 事件
  // ------------------------------------------------------------
  private bindEvents() {
    const h = this.opts.handlers ?? {};
    this.graph.on("node:click", ({ node, e }) => {
      h.onNodeClick?.(readFlowNode(node), nativeEvent(e));
    });
    this.graph.on("node:dblclick", ({ node, e }) => {
      h.onNodeDblClick?.(readFlowNode(node), nativeEvent(e));
    });
    this.graph.on("node:contextmenu", ({ node, e }) => {
      const ev = nativeEvent(e);
      ev.preventDefault?.();
      h.onNodeContextMenu?.(readFlowNode(node), ev);
    });
    this.graph.on("edge:click", ({ edge, e }) => {
      h.onEdgeClick?.(readFlowEdge(edge), nativeEvent(e));
      this.showEdgeTools(edge.id);
    });
    this.graph.on("blank:click", () => {
      this.graph.cleanSelection();
      this.clearEdgeTools();
    });
    this.graph.on("edge:connected", ({ edge, isNew }) => {
      if (!isNew) return;
      h.onEdgeConnected?.(readFlowEdge(edge));
      this.showEdgeTools(edge.id);
    });
    this.graph.on("selection:changed", ({ selected }) => {
      const first = selected[0];
      if (!first) {
        h.onSelect?.(null);
        return;
      }
      if (first.isNode()) h.onSelect?.({ kind: "node", node: readFlowNode(first as X6Node) });
      else h.onSelect?.({ kind: "edge", edge: readFlowEdge(first as X6Edge) });
    });
    const fire = () => {
      if (this.loading) return;
      h.onChange?.(this.getData());
      h.onHistoryChange?.({ canUndo: this.canUndo(), canRedo: this.canRedo() });
    };
    this.graph.on("cell:added", fire);
    this.graph.on("cell:removed", fire);
    this.graph.on("cell:changed", fire);
    this.graph.on("node:moved", fire);
  }

  private bindKeys() {
    this.graph.bindKey(["delete", "backspace"], () => this.removeSelected());
    this.graph.bindKey(["ctrl+z", "meta+z"], () => this.undo());
    this.graph.bindKey(["ctrl+shift+z", "meta+shift+z", "ctrl+y"], () => this.redo());
    this.graph.bindKey(["ctrl+c", "meta+c"], () => this.copySelected(false));
    this.graph.bindKey(["ctrl+x", "meta+x"], () => this.copySelected(true));
    this.graph.bindKey(["ctrl+v", "meta+v"], () => this.paste());
    this.graph.bindKey(["ctrl+a", "meta+a"], () => {
      this.graph.select(this.graph.getCells());
    });
    this.graph.bindKey("esc", () => {
      this.graph.cleanSelection();
      this.clearEdgeTools();
    });
  }

  // ------------------------------------------------------------
  // 数据
  // ------------------------------------------------------------
  setData(data: FlowGraphData) {
    this.loading = true;
    this.graph.disableHistory();
    this.graph.clearCells();
    (data.nodes ?? []).forEach((node) => {
      const def = resolveFlowType(this.types, node.type);
      this.graph.addNode(
        buildFlowNodeMetadata({
          id: node.id,
          type: node.type,
          label: node.label || def.label,
          x: node.x ?? 0,
          y: node.y ?? 0,
          color: def.color ?? "#4f7cff",
          iconPath: def.path,
          data: node.data,
        }),
      );
    });
    (data.edges ?? []).forEach((edge) => {
      this.graph.addEdge(
        buildFlowEdgeMetadata({
          id: edge.id,
          from: edge.from,
          to: edge.to,
          fromPort: edge.fromPort,
          toPort: edge.toPort,
          kind: edge.kind,
          label: edge.label,
          transfer: edge.transfer,
          data: edge.data,
        }),
      );
    });
    this.graph.cleanHistory();
    this.graph.enableHistory();
    this.loading = false;
    this.opts.handlers?.onChange?.(this.getData());
  }

  getData(): FlowGraphData {
    return {
      nodes: this.graph.getNodes().map(readFlowNode),
      edges: this.graph.getEdges().map(readFlowEdge),
    };
  }

  /** 调色板落点：拖拽或点击新增一个节点 */
  addNode(type: string, x?: number, y?: number): FlowNode | null {
    if (this.opts.readonly) return null;
    const def = resolveFlowType(this.types, type);
    const same = this.graph.getNodes().filter((n) => (n.getData() as { flowType?: string })?.flowType === type).length;
    const at = x == null || y == null ? this.cascadeSpot() : { x, y };
    const node = this.graph.addNode(
      buildFlowNodeMetadata({
        id: uid("node"),
        type,
        label: same > 0 ? `${def.label} ${same + 1}` : def.label,
        x: Math.round(at.x - NODE_SIZE / 2),
        y: Math.round(at.y - NODE_SIZE / 2),
        color: def.color ?? "#4f7cff",
        iconPath: def.path,
        data: {},
      }),
    );
    this.selectNode(node.id);
    return readFlowNode(node);
  }

  /** 浏览器 client 坐标 → 画布局部坐标（调色板拖拽落点用） */
  toLocalPoint(clientX: number, clientY: number): { x: number; y: number } {
    const p = this.graph.clientToLocal(clientX, clientY);
    return { x: p.x, y: p.y };
  }

  /** 视口中心（新增节点的默认落位） */
  private blankCenter(): { x: number; y: number } {
    const area = this.graph.getGraphArea();
    return { x: area.x + area.width / 2, y: area.y + area.height / 2 };
  }

  /** 从视口中心向外一圈圈找空位，连续点击调色板时节点不会叠成一堆 */
  private cascadeSpot(): { x: number; y: number } {
    const base = this.blankCenter();
    const taken = this.graph.getNodes().map(node => node.getBBox().center);
    const fits = (p: { x: number; y: number }) =>
      !taken.some(q => Math.abs(q.x - p.x) < 170 && Math.abs(q.y - p.y) < 120);
    for (let ring = 0; ring < 8; ring += 1) {
      const spots = ring === 0
        ? [base]
        : Array.from({ length: 8 }, (_, k) => {
            const angle = (Math.PI / 4) * k;
            return {
              x: base.x + Math.cos(angle) * 180 * ring,
              y: base.y + Math.sin(angle) * 120 * ring,
            };
          });
      const free = spots.find(fits);
      if (free) return free;
    }
    return base;
  }

  updateNode(id: string, patch: { label?: string; data?: Record<string, unknown>; color?: string; iconPath?: string }) {
    const cell = this.graph.getCellById(id);
    if (!cell?.isNode()) return;
    const node = cell as X6Node;
    const data = (node.getData() ?? {}) as { flowType?: string; flowLabel?: string; flowData?: Record<string, unknown> };
    const attrs: Record<string, Record<string, unknown>> = {};
    if (patch.label != null) {
      attrs.label = { text: patch.label };
      node.setData({ ...data, flowLabel: patch.label });
    }
    if (patch.color) attrs.badge = { fill: patch.color };
    if (patch.iconPath) attrs.icon = { d: patch.iconPath };
    if (Object.keys(attrs).length) node.setAttrs(attrs as never);
    if (patch.data) node.setData({ ...node.getData(), flowData: patch.data });
  }

  updateEdge(id: string, patch: { kind?: FlowEdgeKind; label?: string; transfer?: boolean; data?: Record<string, unknown> }) {
    const cell = this.graph.getCellById(id);
    if (!cell?.isEdge()) return;
    const edge = cell as X6Edge;
    const data = (edge.getData() ?? {}) as { flowKind?: FlowEdgeKind; flowTransfer?: boolean; flowData?: Record<string, unknown> };
    const kind = patch.kind ?? data.flowKind ?? "normal";
    const transfer = patch.transfer ?? data.flowTransfer ?? true;
    edge.setAttrs(flowEdgeAttrs(kind, transfer));
    edge.setLabels(
      patch.label ? [{ position: 0.5, attrs: { label: { text: patch.label } } }] : [],
    );
    edge.setData({
      flowKind: kind,
      flowTransfer: transfer,
      flowData: patch.data ?? data.flowData ?? {},
    });
  }

  /** 删除一组节点（连带其出入边），fixed 类型受保护 */
  removeNodes(ids: string[]): number {
    const cells: Cell[] = [];
    ids.forEach((id) => {
      const cell = this.graph.getCellById(id);
      if (!cell?.isNode()) return;
      const node = cell as X6Node;
      const type = (node.getData() as { flowType?: string })?.flowType;
      if (resolveFlowType(this.types, type).fixed) return;
      cells.push(node, ...this.graph.getConnectedEdges(node));
    });
    if (!cells.length) return 0;
    this.graph.removeCells(cells);
    return ids.filter((id) => !this.graph.getCellById(id)).length;
  }

  removeEdges(ids: string[]): number {
    ids.forEach((id) => this.graph.removeCell(id));
    return ids.filter((id) => !this.graph.getCellById(id)).length;
  }

  removeSelected(): number {
    const selected = this.graph.getSelectedCells();
    const nodeIds = selected.filter((c) => c.isNode()).map((c) => c.id);
    const edgeIds = selected.filter((c) => c.isEdge()).map((c) => c.id);
    return this.removeNodes(nodeIds) + this.removeEdges(edgeIds);
  }

  copySelected(cut: boolean) {
    const cells = this.graph.getSelectedCells();
    if (!cells.length) return;
    const all: Cell[] = [];
    cells.forEach((cell) => {
      all.push(cell);
      if (cell.isNode()) all.push(...this.graph.getConnectedEdges(cell));
    });
    if (cut) this.graph.cut(all);
    else this.graph.copy(all);
  }

  paste() {
    if (this.graph.isClipboardEmpty()) return;
    const cells = this.graph.paste({ offset: 24 });
    this.graph.cleanSelection();
    this.graph.select(cells);
  }

  // ------------------------------------------------------------
  // 选中 / 定位
  // ------------------------------------------------------------
  selectNode(id: string) {
    const cell = this.graph.getCellById(id);
    if (!cell) return;
    this.graph.cleanSelection();
    this.graph.select(cell);
  }

  focusNode(id: string) {
    const cell = this.graph.getCellById(id);
    if (!cell) return;
    this.graph.centerCell(cell);
    this.selectNode(id);
  }

  /** 选中节点在屏幕上的矩形，供就地改名浮层定位 */
  nodeClientRect(id: string): { left: number; top: number; width: number; height: number } | null {
    const cell = this.graph.getCellById(id);
    if (!cell?.isNode()) return null;
    const rect = this.graph.coord.localToClientRect((cell as X6Node).getBBox());
    return { left: rect.x, top: rect.y, width: rect.width, height: rect.height };
  }

  showEdgeTools(id: string) {
    this.clearEdgeTools();
    const cell = this.graph.getCellById(id);
    if (!cell?.isEdge() || this.opts.readonly) return;
    cell.addTools([
      { name: "vertices" },
      { name: "source-arrowhead", args: { attrs: { fill: "#4f7cff", stroke: "#ffffff", strokeWidth: 1.5 } } },
      { name: "target-arrowhead", args: { attrs: { fill: "#4f7cff", stroke: "#ffffff", strokeWidth: 1.5 } } },
    ]);
  }

  clearEdgeTools() {
    this.graph.getEdges().forEach((edge) => edge.removeTools());
  }

  // ------------------------------------------------------------
  // 视图
  // ------------------------------------------------------------
  zoomBy(delta: number) {
    this.graph.zoom(delta);
  }

  resetZoom() {
    this.graph.zoomTo(1);
  }

  getScale(): number {
    return this.graph.transform.getZoom();
  }

  fit() {
    this.graph.zoomToFit({ padding: 48, maxScale: 1.2 });
  }

  fitCenter() {
    if (!this.graph.getCells().length) return;
    this.fit();
    this.graph.centerContent();
  }

  undo() {
    if (this.graph.canUndo()) this.graph.undo();
  }

  redo() {
    if (this.graph.canRedo()) this.graph.redo();
  }

  canUndo(): boolean {
    return this.graph.canUndo();
  }

  canRedo(): boolean {
    return this.graph.canRedo();
  }

  toJSON(): Record<string, unknown> {
    return this.graph.toJSON() as Record<string, unknown>;
  }

  fromJSON(json: unknown) {
    this.loading = true;
    this.graph.fromJSON(json as Parameters<Graph["fromJSON"]>[0]);
    this.graph.cleanHistory();
    this.loading = false;
    this.opts.handlers?.onChange?.(this.getData());
  }

  exportPNG(filename = "flow.png") {
    this.graph.toPNG(
      (uri) => {
        const a = document.createElement("a");
        a.href = uri;
        a.download = filename;
        a.click();
      },
      { backgroundColor: "#ffffff", padding: 24 },
    );
  }

  // ------------------------------------------------------------
  // 结构自检（前端预检，后端仍是最终裁判）
  // ------------------------------------------------------------
  checkStructure(startType = "start", endType = "end"): FlowStructureIssue[] {
    const issues: FlowStructureIssue[] = [];
    const { nodes, edges } = this.getData();
    if (!nodes.length) {
      issues.push({ level: "error", code: "NO_START", message: "流程为空，请至少添加开始与结束节点" });
      return issues;
    }
    const starts = nodes.filter((n) => n.type === startType);
    const ends = nodes.filter((n) => n.type === endType);
    if (starts.length === 0) issues.push({ level: "error", code: "NO_START", message: "缺少开始节点" });
    if (starts.length > 1) {
      issues.push({ level: "error", code: "MULTI_START", message: `只能有一个开始节点，当前 ${starts.length} 个`, cellId: starts[1].id });
    }
    if (ends.length === 0) issues.push({ level: "error", code: "NO_END", message: "缺少结束节点，流程必须结束在「结束」节点" });
    if (ends.length > 1) {
      issues.push({ level: "warning", code: "MULTI_END", message: `存在 ${ends.length} 个结束节点` });
    }

    const outgoing = new Map<string, number>();
    const incoming = new Map<string, number>();
    edges.forEach((e) => {
      outgoing.set(e.from, (outgoing.get(e.from) ?? 0) + 1);
      incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
      if (e.from === e.to) issues.push({ level: "error", code: "SELF_LOOP", message: `节点「${e.from}」存在自环连线`, cellId: e.from });
    });
    nodes.forEach((n) => {
      if (!outgoing.get(n.id) && n.type !== endType) {
        issues.push({ level: "error", code: "DANGLING", message: `「${n.label}」没有出边，每条分支都必须收到「结束」节点`, cellId: n.id });
      }
      if (!incoming.get(n.id) && n.type !== startType && starts.length > 0) {
        issues.push({ level: "error", code: "ISOLATED", message: `「${n.label}」没有入边，永远不会被执行`, cellId: n.id });
      }
    });
    return issues;
  }

  dispose() {
    this.graph.clearKeys?.();
    this.graph.dispose();
  }
}
