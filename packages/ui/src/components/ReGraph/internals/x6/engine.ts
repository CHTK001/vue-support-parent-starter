/**
 * X6GraphEngine —— ReGraph 的 X6 内核
 *
 * 封装 @antv/x6 的 Graph 与若干官方插件（snapline / selection / keyboard /
 * clipboard / history / minimap / export / transform / stencil），向上层 Vue
 * 组件暴露无框架依赖的命令式 API：setData / addNode / addEdge / zoomToFit /
 * undo / redo / toJSON / fromJSON / highlight 等。
 *
 * 同时实现 agent-flow 风格的节点调色板（Stencil），支持从左侧拖拽生成节点。
 */
import { Graph, Shape, Node as X6Node, Edge as X6Edge } from "@antv/x6";
import { Snapline } from "@antv/x6-plugin-snapline";
import { Selection } from "@antv/x6-plugin-selection";
import { Keyboard } from "@antv/x6-plugin-keyboard";
import { Clipboard } from "@antv/x6-plugin-clipboard";
import { History } from "@antv/x6-plugin-history";
import { MiniMap } from "@antv/x6-plugin-minimap";
import { Export } from "@antv/x6-plugin-export";
import { Stencil } from "@antv/x6-plugin-stencil";
import { ensureRegistered, buildNodeMetadata, buildEdgeMetadata } from "./register";
import { computeLayout } from "./layout";
import { resolveNodeType, DEFAULT_NODE_TYPES } from "./nodeTypes";
import type { GraphPreset } from "./graphPresets";
import { ReGraphMode } from "./types";
import type {
  ReGraphData,
  ReGraphEdge,
  ReGraphNode,
  ReGraphNodeMenuAction,
  ReGraphNodeTypeDef,
  ReGraphSearchMode,
  ReGraphSerialized,
} from "./types";

/** 从 X6 事件参数中稳妥提取原生 MouseEvent */
function nativeEvent(e: unknown): MouseEvent {
  const anyE = e as { originalEvent?: MouseEvent; e?: MouseEvent };
  return ((anyE?.originalEvent ?? anyE?.e ?? anyE) as MouseEvent) || (new MouseEvent("click"));
}

export interface X6EngineHandlers {
  onReady?: (engine: X6GraphEngine) => void;
  onNodeClick?: (node: ReGraphNode, e: MouseEvent) => void;
  onNodeDblClick?: (node: ReGraphNode, e: MouseEvent) => void;
  onNodeContextMenu?: (node: ReGraphNode, e: MouseEvent) => void;
  onEdgeClick?: (edge: ReGraphEdge, e: MouseEvent) => void;
  onCellChanged?: () => void;
}

export interface X6EngineOptions {
  container: HTMLElement;
  minimapContainer?: HTMLElement | null;
  paletteContainer?: HTMLElement | null;
  paletteTypes?: ReGraphNodeTypeDef[];
  editable?: boolean;
  mode?: ReGraphMode;
  /** 全部边默认播放流动动画 */
  animated?: boolean;
  /** 边路由（由 preset 驱动） */
  edgeRouter?: string;
  /** 边连接器（由 preset 驱动） */
  edgeConnector?: string;
  handlers?: X6EngineHandlers;
}

/** 从 X6 cell 读取我们挂的业务数据 */
function readNode(cell: X6Node): ReGraphNode {
  const data = (cell.getData?.() ?? {}) as Record<string, unknown>;
  const pos = cell.getPosition();
  return {
    id: cell.id,
    text: (data.reText as string) ?? "",
    type: (data.reType as ReGraphNode["type"]) ?? "default",
    x: Math.round(pos.x),
    y: Math.round(pos.y),
    width: cell.getSize().width,
    height: cell.getSize().height,
    locked: (data.locked as boolean) ?? false,
    hidden: (data.hidden as boolean) ?? false,
    data: (data.reData as Record<string, unknown>) ?? {},
  };
}

function readEdge(cell: X6Edge): ReGraphEdge {
  const data = (cell.getData?.() ?? {}) as Record<string, unknown>;
  const source = cell.getSource() as { cell?: string; port?: string };
  const target = cell.getTarget() as { cell?: string; port?: string };
  const labels = cell.getLabels() as Array<{ attrs?: { label?: { text?: string } } }>;
  return {
    id: cell.id,
    from: source.cell ?? "",
    to: target.cell ?? "",
    fromPort: source.port,
    toPort: target.port,
    text: labels[0]?.attrs?.label?.text ?? "",
    data: (data.reData as Record<string, unknown>) ?? {},
  };
}

export class X6GraphEngine {
  graph: Graph;
  stencil: Stencil | null = null;
  private options: X6EngineOptions;
  private mode: ReGraphMode;
  private lastData: ReGraphData = { nodes: [], edges: [] };
  private animateAll = false;
  private animatedEdges = new Set<string>();
  private rafId = 0;
  private animOffset = 0;
  private edgeRouter = "manhattan";
  private edgeConnector = "rounded";

  constructor(options: X6EngineOptions) {
    ensureRegistered();
    this.options = options;
    this.mode = options.mode ?? ReGraphMode.FORCE;
    this.animateAll = options.animated ?? false;
    this.edgeRouter = options.edgeRouter ?? "manhattan";
    this.edgeConnector = options.edgeConnector ?? "rounded";

    this.graph = new Graph({
      container: options.container,
      autoResize: true,
      background: { color: "transparent" },
      grid: {
        visible: true,
        type: "dot",
        args: [{ color: "#e6e6e6", thickness: 1 }, { color: "#f2f2f2", thickness: 1, factor: 4 }],
      },
      mousewheel: {
        enabled: true,
        modifiers: ["ctrl", "meta"],
        minScale: 0.3,
        maxScale: 2.5,
      },
      panning: { enabled: true, modifiers: "space" },
      connecting: {
        router: { name: "manhattan" },
        connector: { name: "rounded" },
        anchor: "center",
        connectionPoint: "boundary",
        allowBlank: false,
        allowLoop: false,
        snap: { radius: 24 },
        createEdge() {
          return new Shape.Edge({ shape: "re-graph-edge" });
        },
        validateConnection({ sourceCell, targetCell }) {
          return !!sourceCell && !!targetCell && sourceCell !== targetCell;
        },
      },
      highlighting: {
        magnetAvailable: {
          name: "stroke",
          args: { padding: 2, attrs: { stroke: "#1677ff", strokeWidth: 2 } },
        },
        magnetAdsorbed: {
          name: "stroke",
          args: { padding: 2, attrs: { stroke: "#1677ff", strokeWidth: 2 } },
        },
      },
      interacting: {
        nodeMovable: (args) => {
          const data = (args.cell.getData?.() ?? {}) as { locked?: boolean };
          return !data.locked;
        },
      },
    });

    this.graph
      .use(new Snapline({ enabled: true }))
      .use(new Selection({ enabled: true, multiple: true, rubberband: true, showNodeSelectionBox: true }))
      .use(new Keyboard({ enabled: true }))
      .use(new Clipboard({ enabled: true }))
      .use(new History({ enabled: true }))
      .use(new Export());

    if (options.minimapContainer) {
      this.graph.use(
        new MiniMap({
          container: options.minimapContainer,
          width: 200,
          height: 140,
          padding: 10,
        }),
      );
    }

    if (options.paletteContainer && (options.editable || options.paletteTypes)) {
      this.initPalette(options.paletteContainer, options.paletteTypes ?? DEFAULT_NODE_TYPES);
    }

    this.bindEvents();
    options.handlers?.onReady?.(this);
  }

  /** 初始化 agent-flow 调色板 */
  private initPalette(container: HTMLElement, types: ReGraphNodeTypeDef[]) {
    this.stencil = new Stencil({
      target: this.graph,
      title: "节点",
      collapsable: false,
      stencilGraphWidth: container.clientWidth || 200,
      stencilGraphHeight: container.clientHeight || 600,
      groups: [{ name: "flow", title: "流程节点" }],
      layoutOptions: { columns: 1, columnWidth: 180, rowHeight: 52 },
    });
    container.appendChild(this.stencil.container);
    const templates = types.map((def) =>
      this.graph.createNode(
        buildNodeMetadata({
          id: `tpl-${def.type}`,
          type: def.type,
          text: def.label,
          width: 180,
          height: 44,
        }),
      ),
    );
    this.stencil.load(templates, "flow");
  }

  private bindEvents() {
    this.graph.on("node:click", ({ node, e }) => {
      this.options.handlers?.onNodeClick?.(readNode(node), nativeEvent(e));
    });
    this.graph.on("node:dblclick", ({ node, e }) => {
      this.options.handlers?.onNodeDblClick?.(readNode(node), nativeEvent(e));
    });
    this.graph.on("node:contextmenu", ({ node, e }) => {
      nativeEvent(e).preventDefault?.();
      this.options.handlers?.onNodeContextMenu?.(readNode(node), nativeEvent(e));
    });
    this.graph.on("edge:click", ({ edge, e }) => {
      this.options.handlers?.onEdgeClick?.(readEdge(edge), nativeEvent(e));
    });
    this.graph.on("cell:added", () => this.options.handlers?.onCellChanged?.());
    this.graph.on("cell:removed", () => this.options.handlers?.onCellChanged?.());
  }

  // ============================================================
  // 数据读写
  // ============================================================

  /** 写入完整图数据（按 mode 计算坐标后渲染） */
  setData(raw: ReGraphData & { lines?: ReGraphEdge[] }) {
    // 兼容旧数据：lines 作为 edges 的别名
    const data: ReGraphData = {
      rootId: raw.rootId,
      /*
       * 节点必须**复制**，不能沿用调用方的那批对象引用。
       *
       * 下面会按 mode 把算出的坐标写进 n.x / n.y；若写在调用方的对象上，
       * 改动会回灌到它的数据源 —— 而外层 X6Graph.vue 正用 `deep: true` 监听同一份数据
       * 并回调本方法，于是形成「写回 → watcher 触发 → setData → 再写回」的重入死循环。
       *
       * 为什么此前只有力导向页出问题：forceLayout 用 Math.random() 播种初始位置，
       * 每次重算坐标都不同 → deep watcher 每次都判定「变了」→ 回路永不收敛
       * （实测主线程被占死、页面外壳永不挂载；14 个节点的数据被渲染成 295 个 x6 节点）。
       * circle / center / tree / fixed 是确定性布局，两次算出的坐标相同 → watcher 不再触发
       * → 回路侥幸自终止，所以这些页面看起来一直是好的。
       *
       * 复制一份的代价极低，且顺带修掉「组件擅自修改调用方数据」这个副作用。
       */
      nodes: (raw.nodes ?? []).map((n) => ({ ...n })),
      edges: raw.edges ?? raw.lines ?? [],
    };
    this.lastData = data;
    this.graph.clearCells();
    const positions = computeLayout(this.mode, data, 800, 600);
    if (this.mode === ReGraphMode.FIXED) {
      data.nodes.forEach((n) => {
        if (typeof n.x !== "number" || typeof n.y !== "number") {
          const p = positions[n.id] ?? { x: 0, y: 0 };
          n.x = p.x;
          n.y = p.y;
        }
      });
    } else {
      data.nodes.forEach((n) => {
        const p = positions[n.id] ?? { x: 0, y: 0 };
        n.x = p.x;
        n.y = p.y;
      });
    }
    const nodes = data.nodes.map((n) => buildNodeMetadata(n));
    const edgeOpts = { router: this.edgeRouter, connector: this.edgeConnector };
    const edges = data.edges.map((e) => buildEdgeMetadata(e, edgeOpts));
    this.graph.addNodes(nodes);
    this.graph.addEdges(edges);
    this.syncAnimatedEdges();
    this.startAnimation();
  }

  /** 读取当前图数据为通用结构 */
  getData(): ReGraphData {
    return {
      nodes: this.graph.getNodes().map((c) => readNode(c)),
      edges: this.graph.getEdges().map((c) => readEdge(c)),
    };
  }

  /** 重新布局（沿用当前 mode） */
  relayout() {
    const data = this.lastData.nodes.length
      ? this.lastData
      : this.getData();
    this.lastData = data;
    const positions = computeLayout(this.mode, data, 800, 600);
    this.graph.getNodes().forEach((node) => {
      const p = positions[node.id];
      if (p) node.position(p.x, p.y, { deep: false });
    });
  }

  /** 追加节点 */
  addNode(node: ReGraphNode): import("@antv/x6").Cell {
    return this.graph.addNode(buildNodeMetadata(node));
  }

  /** 追加连线 */
  addEdge(edge: ReGraphEdge): import("@antv/x6").Cell {
    const cell = this.graph.addEdge(
      buildEdgeMetadata(edge, { router: this.edgeRouter, connector: this.edgeConnector }),
    );
    if (this.animateAll || edge.animated) {
      this.animatedEdges.add(cell.id);
      this.startAnimation();
    }
    return cell;
  }

  getNodeById(id: string): ReGraphNode | null {
    const cell = this.graph.getCellById(id);
    return cell ? readNode(cell as X6Node) : null;
  }

  removeNodeById(id: string) {
    const cell = this.graph.getCellById(id);
    if (cell) this.graph.removeCell(cell);
  }

  removeEdgeById(id: string) {
    const cell = this.graph.getCellById(id);
    if (cell) this.graph.removeCell(cell);
  }

  /** 更新节点业务数据 / 类型 / 文本 */
  updateNode(id: string, patch: Partial<ReGraphNode>) {
    const cell = this.graph.getCellById(id);
    if (!cell) return;
    const data = (cell.getData?.() ?? {}) as Record<string, unknown>;
    if (patch.text !== undefined) {
      data.reText = patch.text;
      cell.attr("label/text", patch.text);
    }
    if (patch.type !== undefined) {
      data.reType = patch.type;
      const def = resolveNodeType(patch.type);
      cell.attr("body/stroke", def.color);
      cell.attr("body/fill", `${def.color}14`);
      cell.attr("icon/fill", def.color);
      cell.attr("icon/text", def.icon);
    }
    if (patch.locked !== undefined) data.locked = patch.locked;
    if (patch.hidden !== undefined) data.hidden = patch.hidden;
    if (patch.data !== undefined) data.reData = patch.data;
    cell.setData(data);
  }

  /** 隐藏 / 显示节点（含相邻连线） */
  hideNode(id: string) {
    this.graph.getCellById(id)?.attr("body/opacity", 0.25);
    this.getRelatedEdges(id).forEach((e) => e.hide());
  }

  showNode(id: string) {
    this.graph.getCellById(id)?.attr("body/opacity", 1);
    this.getRelatedEdges(id).forEach((e) => e.show());
  }

  private getRelatedEdges(id: string): import("@antv/x6").Edge[] {
    return this.graph.getEdges().filter((e) => {
      const s = e.getSource() as { cell?: string };
      const t = e.getTarget() as { cell?: string };
      return s.cell === id || t.cell === id;
    });
  }

  focusNode(id: string) {
    const cell = this.graph.getCellById(id);
    if (cell) this.graph.centerCell(cell);
  }

  // ============================================================
  // 视图控制
  // ============================================================

  setMode(mode: ReGraphMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.relayout();
  }

  getMode(): ReGraphMode {
    return this.mode;
  }

  zoomBy(delta: number) {
    const scale = this.graph.zoom();
    this.graph.zoom(Math.max(0.3, Math.min(2.5, scale + delta / 100)), { maxScale: 2.5, minScale: 0.3 });
  }

  zoomToFit() {
    this.graph.zoomToFit({ padding: 24, maxScale: 1.5 });
  }

  centerContent() {
    this.graph.centerContent();
  }

  // ============================================================
  // 历史
  // ============================================================

  undo() {
    if (this.graph.canUndo()) this.graph.undo();
  }

  redo() {
    if (this.graph.canRedo()) this.graph.redo();
  }

  canUndo() {
    return this.graph.canUndo();
  }

  canRedo() {
    return this.graph.canRedo();
  }

  // ============================================================
  // 搜索高亮 / 路径
  // ============================================================

  private matchedIds = new Set<string>();

  highlight(keyword: string, mode: ReGraphSearchMode = "highlight"): string[] {
    const kw = keyword.trim().toLowerCase();
    const all = this.graph.getNodes().map((c) => readNode(c));
    if (!kw) {
      this.clearHighlight();
      return [];
    }
    const kws = kw.split(/[,， \n]+/).filter(Boolean);
    const matched = new Set<string>();
    all.forEach((n) => {
      if (kws.some((k) => String(n.text ?? "").toLowerCase().includes(k))) {
        matched.add(n.id);
      }
    });
    this.matchedIds = matched;

    if (mode === "path" && matched.size >= 2) {
      const pathIds = new Set<string>();
      const ids = [...matched];
      for (let i = 0; i < ids.length - 1; i++) {
        this.shortestPath(ids[i], ids[i + 1]).forEach((p) => pathIds.add(p));
      }
      this.applyDim(pathIds);
    } else {
      this.applyDim(matched);
    }
    return [...matched];
  }

  private applyDim(keep: Set<string>) {
    this.graph.getNodes().forEach((node) => {
      if (keep.has(node.id)) {
        node.attr("body/opacity", 1);
        node.attr("body/strokeWidth", 2.5);
      } else {
        node.attr("body/opacity", 0.15);
        node.attr("body/strokeWidth", 1.5);
      }
    });
    this.graph.getEdges().forEach((edge) => {
      const s = (edge.getSource() as { cell?: string }).cell;
      const t = (edge.getTarget() as { cell?: string }).cell;
      edge.attr("line/opacity", keep.has(s ?? "") && keep.has(t ?? "") ? 1 : 0.12);
    });
  }

  clearHighlight() {
    this.matchedIds = new Set();
    this.graph.getNodes().forEach((node) => {
      node.attr("body/opacity", 1);
      node.attr("body/strokeWidth", 1.5);
    });
    this.graph.getEdges().forEach((edge) => edge.attr("line/opacity", 1));
  }

  private shortestPath(from: string, to: string): string[] {
    const adj = new Map<string, string[]>();
    this.graph.getNodes().forEach((n) => adj.set(n.id, []));
    this.graph.getEdges().forEach((e) => {
      const s = (e.getSource() as { cell?: string }).cell;
      const t = (e.getTarget() as { cell?: string }).cell;
      if (s && t) {
        adj.get(s)?.push(t);
        adj.get(t)?.push(s);
      }
    });
    const prev = new Map<string, string | null>();
    const visited = new Set<string>();
    const queue = [from];
    prev.set(from, null);
    visited.add(from);
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur === to) break;
      for (const nxt of adj.get(cur) ?? []) {
        if (!visited.has(nxt)) {
          visited.add(nxt);
          prev.set(nxt, cur);
          queue.push(nxt);
        }
      }
    }
    if (!visited.has(to)) return [];
    const path: string[] = [];
    let cur: string | null = to;
    while (cur) {
      path.unshift(cur);
      cur = prev.get(cur) ?? null;
    }
    return path;
  }

  // ============================================================
  // 导入 / 导出
  // ============================================================

  toJSON(): ReGraphSerialized {
    return {
      version: "2.0",
      exportTime: new Date().toISOString(),
      mode: this.mode,
      cells: this.graph.toJSON().cells as unknown[],
    };
  }

  fromJSON(json: ReGraphSerialized) {
    this.graph.fromJSON({ cells: json.cells as never[] });
    if (json.mode) this.mode = json.mode as ReGraphMode;
  }

  /** 导出 PNG（依赖 Export 插件） */
  async exportPNG(name = "graph.png") {
    this.graph.toPNG(
      (uri: string) => {
        const a = document.createElement("a");
        a.href = uri;
        a.download = name;
        a.click();
      },
      { backgroundColor: "#ffffff", padding: 16 } as never,
    );
  }

  // ============================================================
  // 扩线（远程）
  // ============================================================

  async expand(
    nodeId: string,
    fetcher: (id: string) => Promise<{ nodes: ReGraphNode[]; edges: ReGraphEdge[] }>,
  ) {
    const payload = await fetcher(nodeId);
    payload.nodes.forEach((n) => {
      if (!this.graph.getCellById(n.id)) this.addNode(n);
    });
    payload.edges.forEach((e) => {
      if (e.from && e.to) this.addEdge(e);
    });
    this.updateNode(nodeId, { data: { ...(this.getNodeById(nodeId)?.data ?? {}), expanded: true } });
    return payload;
  }

  // ============================================================
  // 上下文菜单动作
  // ============================================================

  async handleMenuAction(action: ReGraphNodeMenuAction, node: ReGraphNode) {
    switch (action) {
      case "lock":
        this.updateNode(node.id, { locked: true });
        break;
      case "unlock":
        this.updateNode(node.id, { locked: false });
        break;
      case "hide":
        this.hideNode(node.id);
        break;
      case "show":
        this.showNode(node.id);
        break;
      case "focus":
        this.focusNode(node.id);
        break;
      case "remove":
        this.removeNodeById(node.id);
        break;
      default:
        break;
    }
  }

  dispose() {
    this.stopAnimation();
    this.stencil?.dispose();
    this.graph.dispose();
  }

  // ============================================================
  // 流动动画
  // ============================================================

  /** 同步需要动画的边集合（animateAll 或单条边 animated 标记） */
  private syncAnimatedEdges() {
    this.graph.getEdges().forEach((e) => {
      const d = (e.getData() ?? {}) as { animated?: boolean };
      if (this.animateAll || d.animated) this.animatedEdges.add(e.id);
    });
  }

  /** 开启全部边动画 */
  animateEdges(on: boolean) {
    this.animateAll = on;
    if (on) {
      this.graph.getEdges().forEach((e) => this.animatedEdges.add(e.id));
      this.startAnimation();
    } else {
      this.animatedEdges.clear();
      this.stopAnimation();
    }
  }

  /** 应用 preset 配置（由 config.mode 解析） */
  applyPreset(preset: GraphPreset) {
    this.edgeRouter = preset.edgeRouter;
    this.edgeConnector = preset.edgeConnector;
    this.graph.getEdges().forEach((e) => {
      e.setRouter(preset.edgeRouter);
      e.setConnector(preset.edgeConnector);
    });
  }

  /** 单独控制某条边的动画 */
  setEdgeAnimated(id: string, on: boolean) {
    if (on) {
      this.animatedEdges.add(id);
      this.startAnimation();
    } else {
      this.animatedEdges.delete(id);
      const c = this.graph.getCellById(id) as X6Edge | undefined;
      c?.attr("line/strokeDasharray", null);
      if (this.animatedEdges.size === 0) this.stopAnimation();
    }
  }

  private startAnimation() {
    if (this.rafId || typeof requestAnimationFrame === "undefined") return;
    if (this.animatedEdges.size === 0) return;
    this.animatedEdges.forEach((id) => {
      const c = this.graph.getCellById(id) as X6Edge | undefined;
      c?.attr("line/strokeDasharray", "5 5");
    });
    const tick = () => {
      this.animOffset = (this.animOffset - 0.4) % 1000;
      this.animatedEdges.forEach((id) => {
        const c = this.graph.getCellById(id) as X6Edge | undefined;
        c?.attr("line/strokeDashoffset", this.animOffset);
      });
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopAnimation() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }
}
