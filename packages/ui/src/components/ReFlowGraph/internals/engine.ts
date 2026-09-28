/**
 * FlowGraphEngine —— ReFlowGraph 的 X6 内核
 *
 * 面向"流程设计器"（不是图查看器）：横向卡片节点 + 正交彩色连线 + 四向磁吸 +
 * 拖拽入板 + 框选 + 辅助线 + 撤销重做 + 就地改名 + 结构自检。
 * 观感与交互对齐 X6 官方 DAG 示例，业务差异全部走 data，不注册新图形。
 *
 * 节点体是 Vue 组件（见 shapes.ts 与 FlowNodeCard.vue），连线仍是自绘 SVG 图形。
 * 因此**节点的一切变化都必须落在 data 上**：attrs 里写 `label` / `badge` / `icon`
 * 在卡片节点上不会报错也不会生效（没有这几个选择器），是最难查的静默失效。
 *
 * 画布的连接/框选/高亮/缩放/节点五项配置对齐 X6 官方 DAG 示例
 * （https://x6.antv.antgroup.com/examples/showcase/practices/#dag ，源码
 * site/examples/showcase/practices/demo/dag.tsx）。有意偏离官方的三处，理由如下：
 *
 * 1. 官方 `connecting.validateMagnet` 写作 `port-group !== 'top'`，本组件**不照抄**。
 *    官方之所以能禁掉 top，是因为它用 `anchor:'center'` + `connectionPoint:'anchor'`，
 *    连线端点落在节点中心锚上、**根本不走端口**（端口只参与高亮）；而本组件走
 *    `bottom → top` 端口连线，照抄会直接禁掉正常流程的落点，主交互被打断。
 *    改在 `validateConnection` 上落地同一语义：`top` 只作入边、`bottom` 只作出边
 *    —— 该回调带 `sourcePort`/`targetPort`，能真正区分方向（`validateMagnet` 的
 *    签名只有 `{cell, view, magnet, e}`，拿不到方向，物理上表达不了这条规则）。
 *    规则本体抽在 dagRules.ts（零 X6 依赖的纯函数），此处只做接线。
 * 2. 官方 `panning.eventTypes:['leftMouseDown']`，本组件保留 `modifiers:'space'`。
 *    左键已被框选占用，改成左键平移会与 Selection 插件的橡皮筋直接冲突。
 * 3. 官方 `Selection` 的 `rubberband` 配 `modifiers:'shift'`，本组件不加修饰键。
 *    画布左键唯一职责就是框选（平移走空格），再加一层 shift 等于让"框选"变成
 *    用户必须先记住的隐藏手势，对国内流程工具的上手成本不划算。
 */
import { Graph, Shape, Node as X6Node, Edge as X6Edge, Cell } from "@antv/x6";
import { Snapline } from "@antv/x6-plugin-snapline";
import { Selection } from "@antv/x6-plugin-selection";
import { Keyboard } from "@antv/x6-plugin-keyboard";
import { Clipboard } from "@antv/x6-plugin-clipboard";
import { History } from "@antv/x6-plugin-history";
import { MiniMap } from "@antv/x6-plugin-minimap";
import { Export } from "@antv/x6-plugin-export";
import type { Component } from "vue";
import { isDagTerminalAllowed } from "./dagRules";
import {
  DEFAULT_NODE_COLOR,
  FLOW_EDGE_SHAPE,
  FLOW_NODE_SHAPE,
  NODE_HEIGHT,
  NODE_WIDTH,
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

/**
 * 从 X6 事件参数里稳妥取原生 MouseEvent。
 *
 * X6 各处传的事件包装不一致（有 `originalEvent`、有 `e`），这里统一兜住；
 * 兜底构造一个空 MouseEvent 而不是抛错，让上层 `preventDefault?.()` 这类可选调用安全。
 *
 * @param e X6 事件参数
 * @returns 原生 MouseEvent；取不到时返回空事件对象
 */
function nativeEvent(e: unknown): MouseEvent {
  const box = e as { originalEvent?: MouseEvent; e?: MouseEvent };
  return ((box?.originalEvent ?? box?.e) as MouseEvent) || new MouseEvent("click");
}

/**
 * 生成带时间戳的短 id。
 *
 * @param prefix id 前缀（如 `node` / `edge`）
 * @returns 形如 `node-m0abc-x7f2q` 的唯一 id
 */
function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * X6 节点 → 业务 `FlowNode`。
 *
 * @param cell 画布上的节点
 * @returns 业务节点；坐标取整、data 里的显示字段（颜色/图标）不外泄
 */
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
  /** 画布平移（空格 + 拖），缺省 true */
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
  /** 宿主自定义节点体组件；给了则所有节点用它渲染 */
  nodeComponent?: Component | null;
  handlers?: FlowEngineHandlers;
}

/** 交互开关的补丁，供运行时改 prop 用 */
export interface FlowInteractionPatch {
  panning?: boolean;
  zoom?: boolean;
  nodeDraggable?: boolean;
}

export class FlowGraphEngine {
  graph: Graph;
  private opts: FlowEngineOptions;
  /** setData 期间抑制 change 事件，避免上层拿到半成品 */
  private loading = false;
  private types: FlowNodeTypeDef[];
  /**
   * 本实例建节点用的形状名。
   *
   * 存成实例字段而不是全局变量：同一页面可以同时开「内置卡片」和「自定义组件」
   * 两个画布，全局状态会让后建的把先建的形状一起换掉（实测会串）。
   */
  private nodeShape: string;

  constructor(options: FlowEngineOptions) {
    this.nodeShape = ensureFlowRegistered(options.nodeComponent);
    this.opts = options;
    this.types = options.nodeTypes ?? [];

    const readonly = !!options.readonly;
    // nodeDraggable 缺省 true；readonly 仍然一票否决（只读视图不该能拖）
    const nodeDraggable = !readonly && options.nodeDraggable !== false;
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
      // factor 1.1 / 缩放区间取自官方 DAG 示例；modifiers 放宽到 meta 以兼容 mac
      mousewheel: {
        enabled: options.zoom !== false,
        modifiers: ["ctrl", "meta"],
        factor: 1.1,
        minScale: 0.5,
        maxScale: 1.5,
      },
      // 左键留给框选，平移走空格（官方是 leftMouseDown，理由见文件头）
      panning: { enabled: options.panning !== false, modifiers: "space" },
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
        // 官方 DAG 同款：拖拽中的预览线走虚线并压到节点下层，松手前不遮挡节点
        createEdge() {
          return this.createEdge({
            shape: FLOW_EDGE_SHAPE,
            zIndex: -1,
            attrs: {
              line: {
                ...flowEdgeAttrs("normal", true).line,
                strokeDasharray: "5 5",
                targetMarker: null,
              },
            },
            data: { flowKind: "normal", flowTransfer: true, flowData: {} },
          });
        },
        // DAG 方向约束：top 是入边锚、bottom 是出边锚。此处而非 validateMagnet，
        // 因为只有本回调能拿到 sourcePort/targetPort（理由见文件头）
        validateConnection({ sourceCell, targetCell, sourcePort, targetPort }) {
          if (!sourceCell || !targetCell || sourceCell === targetCell) {
            return false;
          }
          return isDagTerminalAllowed(sourcePort, targetPort);
        },
      },
      highlighting: {
        magnetAvailable: {
          name: "stroke",
          args: { padding: 4, attrs: { strokeWidth: 1.5, stroke: "#4f7cff" } },
        },
        // 磁吸命中态：官方 DAG 用青色 + 4px 描边并补 fill，未命中时锚点会"实心塌陷"
        magnetAdsorbed: {
          name: "stroke",
          args: { padding: 4, attrs: { fill: "#ffffff", strokeWidth: 4, stroke: "#31d0c6" } },
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
            // nodeMovable 受 nodeDraggable 单独控制（见 FlowEngineOptions 的说明）
            nodeMovable: nodeDraggable,
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
          // 官方 DAG 同款：框选时把节点/连线一起纳入选区
          rubberNode: true,
          rubberEdge: true,
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
    if (!readonly) {
      this.bindKeys();
    }
    options.handlers?.onReady?.(this);
  }

  // ------------------------------------------------------------
  // 事件
  // ------------------------------------------------------------

  /**
   * 挂载画布事件到 handlers 回调。
   *
   * `fire` 同时驱动 `change` 与 `history-change`：两者都从「当前图 + 当前撤销栈」派生，
   * 分成两个监听器会因事件到达顺序不同而短暂不同步。
   */
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
      // 官方 DAG 在此把预览虚线抹掉。本组件不能直接清 strokeDasharray ——
      // 虚线在本组件有第二重语义：「不传递变量」的连线本来就该虚线（见 flowEdgeAttrs），
      // 无脑清会把它们误改成实线。故按语义整体重绘，顺带把预览期的 zIndex:-1 复位。
      // 注意必须靠 flowEdgeAttrs 返回空串来清，不能返回 undefined：X6 的 setAttrs 是深合并，
      // undefined 的键删不掉已有的 "5 5"，实测每条新连的线都残留一段预览虚线。
      // 该陷阱与修法记在 shapes.ts 的 flowEdgeAttrs 上，回归断言见 pw-dag-practice.mjs 第 3 节。
      const data = (edge.getData() ?? {}) as { flowKind?: FlowEdgeKind; flowTransfer?: boolean };
      edge.setAttrs(flowEdgeAttrs(data.flowKind, data.flowTransfer));
      edge.setZIndex(0);
      if (!isNew) {
        return;
      }
      h.onEdgeConnected?.(readFlowEdge(edge));
      this.showEdgeTools(edge.id);
    });
    this.graph.on("selection:changed", ({ selected }) => {
      const first = selected[0];
      if (!first) {
        h.onSelect?.(null);
        return;
      }
      if (first.isNode()) {
        h.onSelect?.({ kind: "node", node: readFlowNode(first as X6Node) });
      } else {
        h.onSelect?.({ kind: "edge", edge: readFlowEdge(first as X6Edge) });
      }
    });
    const fire = () => {
      if (this.loading) {
        return;
      }
      h.onChange?.(this.getData());
      h.onHistoryChange?.({ canUndo: this.canUndo(), canRedo: this.canRedo() });
    };
    this.graph.on("cell:added", fire);
    this.graph.on("cell:removed", fire);
    this.graph.on("cell:changed", fire);
    this.graph.on("node:moved", fire);
  }

  /**
   * 绑定画布级快捷键。
   *
   * 只读模式下不绑（构造时已判过），避免只读画布也能被删改。
   * 键位同时给 ctrl 与 meta 两套，兼容 Windows 与 macOS。
   */
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

  /**
   * 运行时改交互开关，prop 变化时由组件调用。
   *
   * 三个开关各有各的官方入口，不能一律改 `options`：
   * - 平移 / 滚轮：走 `togglePanning` / `toggleMouseWheel`，它们直接切插件的
   *   disabled 标志；改 `options` 不生效（`panning.enabled` 只在构造时读一次）。
   * - 节点拖动：`CellView.can('nodeMovable')` **每次**都实时读
   *   `graph.options.interacting`，所以直接改这个对象即可（已在 x6 源码
   *   `src/view/cell.ts` 的 `can()` 里核对过，不是猜的）。
   *
   * 只读模式下一律按「关」处理：prop 改成 true 也不能把只读视图变成可拖的。
   *
   * @param patch 待改开关；缺省的键保持原值
   */
  applyInteraction(patch: FlowInteractionPatch): void {
    if (this.opts.readonly) {
      return;
    }
    if (patch.panning != null) {
      this.graph.togglePanning(patch.panning);
    }
    if (patch.zoom != null) {
      this.graph.toggleMouseWheel(patch.zoom);
    }
    if (patch.nodeDraggable != null) {
      const interacting = this.graph.options.interacting;
      if (interacting && typeof interacting === "object") {
        interacting.nodeMovable = patch.nodeDraggable;
      }
    }
  }

  /**
   * 用业务数据整体覆盖画布。
   *
   * 先关历史再灌图，避免「载入一次」塞满撤销栈；期间 `loading` 抑制逐 cell 的
   * `change`，只在末尾统一抛一次，避免上层拿到半成品图。
   *
   * @param data 整图数据；`nodes` / `edges` 缺省按空数组处理
   */
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
          typeLabel: def.label,
          x: node.x ?? 0,
          y: node.y ?? 0,
          color: def.color ?? DEFAULT_NODE_COLOR,
          iconPath: def.path,
          image: def.image,
          shape: this.nodeShape,
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

  /**
   * 读出当前整图的业务数据。
   *
   * @returns 与 {@link setData} 对称的 `FlowGraphData`（坐标取整、不含 X6 内部字段）
   */
  getData(): FlowGraphData {
    return {
      nodes: this.graph.getNodes().map(readFlowNode),
      edges: this.graph.getEdges().map(readFlowEdge),
    };
  }

  /**
   * 调色板落点：拖拽或点击新增一个节点。
   *
   * @param type 节点类型标识，须能在 `nodeTypes` 里查到
   * @param x 可选的画布局部横坐标；缺省时自动找空位
   * @param y 可选的画布局部纵坐标；缺省时自动找空位
   * @returns 新节点的业务数据；只读模式或命中固定类型时返回 null
   */
  addNode(type: string, x?: number, y?: number): FlowNode | null {
    if (this.opts.readonly) {
      return null;
    }
    const def = resolveFlowType(this.types, type);
    const same = this.graph
      .getNodes()
      .filter((n) => (n.getData() as { flowType?: string })?.flowType === type).length;
    // 落点由鼠标给出时按卡片中心对齐，X6 的 x/y 是左上角，180×36 的卡片不居中的话
    // 光标会明显偏在左上（原来 40×40 时偏差看不出来）
    const at = x == null || y == null ? this.cascadeSpot() : { x, y };
    const node = this.graph.addNode(
      buildFlowNodeMetadata({
        id: uid("node"),
        type,
        label: same > 0 ? `${def.label} ${same + 1}` : def.label,
        typeLabel: def.label,
        x: Math.round(at.x - NODE_WIDTH / 2),
        y: Math.round(at.y - NODE_HEIGHT / 2),
        color: def.color ?? DEFAULT_NODE_COLOR,
        iconPath: def.path,
        image: def.image,
        shape: this.nodeShape,
        data: {},
      }),
    );
    this.selectNode(node.id);
    return readFlowNode(node);
  }

  /**
   * 浏览器 client 坐标 → 画布局部坐标。
   *
   * 调色板的 HTML5 `dragover/drop` 给的是 client 坐标，必须过这一层换算；
   * 注意此时画布可能带平移与缩放，不能直接减容器 offset。
   *
   * @param clientX 浏览器 client 横坐标
   * @param clientY 浏览器 client 纵坐标
   * @returns 对应的画布局部坐标（画布左上角为原点）
   */
  toLocalPoint(clientX: number, clientY: number): { x: number; y: number } {
    const p = this.graph.clientToLocal(clientX, clientY);
    return { x: p.x, y: p.y };
  }

  /** 视口中心（新增节点的默认落位） */
  private blankCenter(): { x: number; y: number } {
    const area = this.graph.getGraphArea();
    return { x: area.x + area.width / 2, y: area.y + area.height / 2 };
  }

  /**
   * 从视口中心向外一圈圈找空位，连续点击调色板时节点不会叠成一堆。
   *
   * 环形步长与重叠判据都跟着卡片尺寸走：节点从 40×40 变成 180×36 之后，
   * 沿用原来的 180/120 步长会让同环的卡片横向压在一起（180 宽的卡片配 180 步长，
   * 相邻两张刚好首尾相接，看起来像连成一条），而 170/120 的重叠判据对 180 宽的卡片
   * 形同虚设。所以这里按 NODE_WIDTH / NODE_HEIGHT 推导，不再写死魔法数。
   *
   * @returns 一个不与现有节点重叠的画布局部坐标；8 圈都找不到时退回视口中心
   */
  private cascadeSpot(): { x: number; y: number } {
    const base = this.blankCenter();
    const taken = this.graph.getNodes().map((node) => node.getBBox().center);
    const fits = (p: { x: number; y: number }) =>
      !taken.some((q) => Math.abs(q.x - p.x) < NODE_WIDTH + 24 && Math.abs(q.y - p.y) < NODE_HEIGHT + 24);
    const stepX = NODE_WIDTH + 60;
    const stepY = NODE_HEIGHT + 70;
    for (let ring = 0; ring < 8; ring += 1) {
      const spots = ring === 0
        ? [base]
        : Array.from({ length: 8 }, (_, k) => {
            const angle = (Math.PI / 4) * k;
            return {
              x: base.x + Math.cos(angle) * stepX * ring,
              y: base.y + Math.sin(angle) * stepY * ring,
            };
          });
      const free = spots.find(fits);
      if (free) {
        return free;
      }
    }
    return base;
  }

  /**
   * 局部更新一个节点。
   *
   * 全部字段都写 **data** 而非 attrs：节点体是 Vue 组件（`FlowNodeCard`），
   * 只认 data 里的 flowLabel / flowColor / flowIcon。旧实现往 `attrs.badge.fill`、
   * `attrs.icon.d` 上写，那是自绘 SVG 徽章时代的残留 —— 卡片节点既没有 `badge` 也没有
   * `icon` 选择器，写了不报错也不生效，是最难查的一类静默失效。
   *
   * @param id 节点 id
   * @param patch 待改字段；`label` 改显示名，`color` / `iconPath` 改类型外观，
   *              `image` 传空串表示去掉图片回到 SVG 图标，
   *              `data` 整体替换业务参数
   */
  updateNode(
    id: string,
    patch: {
      label?: string;
      data?: Record<string, unknown>;
      color?: string;
      iconPath?: string;
      image?: string;
    },
  ) {
    const cell = this.graph.getCellById(id);
    if (!cell?.isNode()) {
      return;
    }
    const node = cell as X6Node;
    const data = (node.getData() ?? {}) as {
      flowType?: string;
      flowLabel?: string;
      flowTypeLabel?: string;
      flowColor?: string;
      flowIcon?: string;
      flowImage?: string;
      flowData?: Record<string, unknown>;
    };
    // 一次 setData 收齐所有字段：卡片组件订阅的是 change:data，
    // 分多次 setData 会触发多次重渲，改名 + 换色时肉眼可见闪一下
    const next = { ...data };
    if (patch.label != null) {
      next.flowLabel = patch.label;
    }
    if (patch.color) {
      next.flowColor = patch.color;
    }
    if (patch.iconPath) {
      next.flowIcon = patch.iconPath;
    }
    // 用 != null 而不是真值判断：空串是「显式去掉图片」的合法意图
    if (patch.image != null) {
      next.flowImage = patch.image;
    }
    if (patch.data) {
      next.flowData = patch.data;
    }
    node.setData(next);
  }

  /**
   * 局部更新一条连线：改语义色、标签、虚实（是否传递变量）与业务参数。
   *
   * @param id 连线 id
   * @param patch 待改字段；未给的字段沿用线上的既有值
   */
  updateEdge(
    id: string,
    patch: { kind?: FlowEdgeKind; label?: string; transfer?: boolean; data?: Record<string, unknown> },
  ) {
    const cell = this.graph.getCellById(id);
    if (!cell?.isEdge()) {
      return;
    }
    const edge = cell as X6Edge;
    const data = (edge.getData() ?? {}) as {
      flowKind?: FlowEdgeKind;
      flowTransfer?: boolean;
      flowData?: Record<string, unknown>;
    };
    const kind = patch.kind ?? data.flowKind ?? "normal";
    const transfer = patch.transfer ?? data.flowTransfer ?? true;
    // attrs 与 data 必须一次同步改完：虚实语义住在 attrs 里，flowTransfer 住在 data 里，
    // 分开写会出现「线已经是虚的但 data 还记着传递变量」，下次读回来就被覆盖成实线
    edge.setAttrs(flowEdgeAttrs(kind, transfer));
    edge.setLabels(patch.label ? [{ position: 0.5, attrs: { label: { text: patch.label } } }] : []);
    edge.setData({
      flowKind: kind,
      flowTransfer: transfer,
      flowData: patch.data ?? data.flowData ?? {},
    });
  }

  /**
   * 删除一组节点，连带其出入边；调色板里标了 `fixed` 的类型（如开始节点）受保护。
   *
   * @param ids 待删节点 id 列表
   * @returns 实际从画布上消失的节点数（受保护或本来就不存在的 id 不计入）
   */
  removeNodes(ids: string[]): number {
    const cells: Cell[] = [];
    ids.forEach((id) => {
      const cell = this.graph.getCellById(id);
      if (!cell?.isNode()) {
        return;
      }
      const node = cell as X6Node;
      const type = (node.getData() as { flowType?: string })?.flowType;
      if (resolveFlowType(this.types, type).fixed) {
        return;
      }
      cells.push(node, ...this.graph.getConnectedEdges(node));
    });
    if (!cells.length) {
      return 0;
    }
    this.graph.removeCells(cells);
    return ids.filter((id) => !this.graph.getCellById(id)).length;
  }

  /**
   * 删除一组连线。
   *
   * @param ids 待删连线 id 列表
   * @returns 实际从画布上消失的连线数
   */
  removeEdges(ids: string[]): number {
    ids.forEach((id) => this.graph.removeCell(id));
    return ids.filter((id) => !this.graph.getCellById(id)).length;
  }

  /**
   * 删除当前选中的节点与连线。
   *
   * @returns 实际删除的节点数 + 连线数
   */
  removeSelected(): number {
    const selected = this.graph.getSelectedCells();
    const nodeIds = selected.filter((c) => c.isNode()).map((c) => c.id);
    const edgeIds = selected.filter((c) => c.isEdge()).map((c) => c.id);
    return this.removeNodes(nodeIds) + this.removeEdges(edgeIds);
  }

  /**
   * 复制（或剪切）选中项，节点连同其出入边一起带走。
   *
   * 只带节点不带边的话，粘出来的流程会丢连接关系，属性面板里看到的连线也就对不上。
   *
   * @param cut true 剪切（从画布移除），false 复制
   */
  copySelected(cut: boolean) {
    const cells = this.graph.getSelectedCells();
    if (!cells.length) {
      return;
    }
    const all: Cell[] = [];
    cells.forEach((cell) => {
      all.push(cell);
      if (cell.isNode()) {
        all.push(...this.graph.getConnectedEdges(cell));
      }
    });
    if (cut) {
      this.graph.cut(all);
    } else {
      this.graph.copy(all);
    }
  }

  /** 把剪贴板内容粘到画布上并选中；剪贴板为空时什么都不做 */
  paste() {
    if (this.graph.isClipboardEmpty()) {
      return;
    }
    const cells = this.graph.paste({ offset: 24 });
    this.graph.cleanSelection();
    this.graph.select(cells);
  }

  // ------------------------------------------------------------
  // 选中 / 定位
  // ------------------------------------------------------------

  /**
   * 独占选中一个节点。
   *
   * @param id 节点 id；查不到时静默返回
   */
  selectNode(id: string) {
    const cell = this.graph.getCellById(id);
    if (!cell) {
      return;
    }
    this.graph.cleanSelection();
    this.graph.select(cell);
  }

  /**
   * 把画布平移到某个节点居中，并顺带选中它。
   *
   * @param id 节点 id；查不到时静默返回
   */
  focusNode(id: string) {
    const cell = this.graph.getCellById(id);
    if (!cell) {
      return;
    }
    this.graph.centerCell(cell);
    this.selectNode(id);
  }

  /**
   * 取节点在屏幕上的矩形，供页面里的就地改名浮层定位。
   *
   * @param id 节点 id
   * @returns 屏幕坐标矩形；不是节点或查不到时返回 null
   */
  nodeClientRect(id: string): { left: number; top: number; width: number; height: number } | null {
    const cell = this.graph.getCellById(id);
    if (!cell?.isNode()) {
      return null;
    }
    const rect = this.graph.coord.localToClientRect((cell as X6Node).getBBox());
    return { left: rect.x, top: rect.y, width: rect.width, height: rect.height };
  }

  /**
   * 给一条连线挂上顶点与两端箭头工具（拖端点改走向、双击加折点）。
   *
   * @param id 连线 id；只读模式或不是连线时不挂
   */
  showEdgeTools(id: string) {
    this.clearEdgeTools();
    const cell = this.graph.getCellById(id);
    if (!cell?.isEdge() || this.opts.readonly) {
      return;
    }
    cell.addTools([
      { name: "vertices" },
      { name: "source-arrowhead", args: { attrs: { fill: "#4f7cff", stroke: "#ffffff", strokeWidth: 1.5 } } },
      { name: "target-arrowhead", args: { attrs: { fill: "#4f7cff", stroke: "#ffffff", strokeWidth: 1.5 } } },
    ]);
  }

  /** 清掉所有连线上的工具（任何新的选中都会先调它，保证同一时刻只有一条线带工具） */
  clearEdgeTools() {
    this.graph.getEdges().forEach((edge) => edge.removeTools());
  }

  // ------------------------------------------------------------
  // 视图
  // ------------------------------------------------------------

  /**
   * 按比例缩放画布。
   *
   * 注意走的是 `graph.zoom()`，**不受 `mousewheel.minScale/maxScale` 约束** ——
   * 那两个只管滚轮。工具栏按钮要限幅得自己夹。
   *
   * @param delta 缩放增量，正数放大、负数缩小
   */
  zoomBy(delta: number) {
    this.graph.zoom(delta);
  }

  /** 缩放回 1:1 */
  resetZoom() {
    this.graph.zoomTo(1);
  }

  /**
   * 当前缩放比。
   *
   * @returns 画布缩放倍数，1 表示 100%
   */
  getScale(): number {
    return this.graph.transform.getZoom();
  }

  /** 缩放到刚好装下全部内容（留 48px 边距，最大放大到 1.2 倍） */
  fit() {
    this.graph.zoomToFit({ padding: 48, maxScale: 1.2 });
  }

  /** 装下全部内容并居中；空图时不动，避免整张画布被拉到最大倍率 */
  fitCenter() {
    if (!this.graph.getCells().length) {
      return;
    }
    this.fit();
    this.graph.centerContent();
  }

  /** 撤销一步；栈空时静默返回 */
  undo() {
    if (this.graph.canUndo()) {
      this.graph.undo();
    }
  }

  /** 重做一步；栈空时静默返回 */
  redo() {
    if (this.graph.canRedo()) {
      this.graph.redo();
    }
  }

  /**
   * 撤销栈是否可用。
   *
   * @returns 可撤销时为 true
   */
  canUndo(): boolean {
    return this.graph.canUndo();
  }

  /**
   * 重做栈是否可用。
   *
   * @returns 可重做时为 true
   */
  canRedo(): boolean {
    return this.graph.canRedo();
  }

  /**
   * 导出 X6 原生 JSON。
   *
   * 含图形名与 attrs，**不是跨版本稳定的持久化格式**（节点 shape 名会随重构变化，
   * 例如 `flow-node` 改成 `flow-card`）。业务持久化请用 {@link getData}。
   *
   * @returns X6 `graph.toJSON()` 的结果
   */
  toJSON(): Record<string, unknown> {
    return this.graph.toJSON() as Record<string, unknown>;
  }

  /**
   * 用 X6 原生 JSON 覆盖画布并清空撤销栈。
   *
   * 与 {@link setData} 一样会回抛一次 `change`，同样受 `loading` 抑制，
   * 页面层用内容签名区分「程序灌图」与「用户编辑」。
   *
   * @param json 之前 {@link toJSON} 产出的对象
   */
  fromJSON(json: unknown) {
    this.loading = true;
    this.graph.fromJSON(json as Parameters<Graph["fromJSON"]>[0]);
    this.graph.cleanHistory();
    this.loading = false;
    this.opts.handlers?.onChange?.(this.getData());
  }

  /**
   * 导出 PNG 并触发下载。
   *
   * 节点体在 `<foreignObject>` 里（`x6-vue-shape`），能否光栅化取决于浏览器 ——
   * 本项目验证的 Chromium 能正常画出节点卡片，但历史版本的 Firefox 在把 SVG 当图片
   * 加载时不渲染 `foreignObject`，那种环境下导出的 PNG 会有连线而无节点体。
   *
   * @param filename 下载文件名，默认 `flow.png`
   */
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

  /**
   * 结构自检：唯一开始、末端必须结束、无自环、无悬空/孤立节点。
   *
   * 只给提示、不阻断编辑；**保存与执行前必须以后端 `CollectGraph` 的校验结果为准**。
   *
   * @param startType 开始节点的 type，默认 `start`
   * @param endType 结束节点的 type，默认 `end`
   * @returns 问题列表；空数组表示前端口径上通过
   */
  checkStructure(startType = "start", endType = "end"): FlowStructureIssue[] {
    const issues: FlowStructureIssue[] = [];
    const { nodes, edges } = this.getData();
    if (!nodes.length) {
      issues.push({ level: "error", code: "NO_START", message: "流程为空，请至少添加开始与结束节点" });
      return issues;
    }
    const starts = nodes.filter((n) => n.type === startType);
    const ends = nodes.filter((n) => n.type === endType);
    if (starts.length === 0) {
      issues.push({ level: "error", code: "NO_START", message: "缺少开始节点" });
    }
    if (starts.length > 1) {
      issues.push({ level: "error", code: "MULTI_START", message: `只能有一个开始节点，当前 ${starts.length} 个`, cellId: starts[1].id });
    }
    if (ends.length === 0) {
      issues.push({ level: "error", code: "NO_END", message: "缺少结束节点，流程必须结束在「结束」节点" });
    }
    if (ends.length > 1) {
      issues.push({ level: "warning", code: "MULTI_END", message: `存在 ${ends.length} 个结束节点` });
    }

    const outgoing = new Map<string, number>();
    const incoming = new Map<string, number>();
    edges.forEach((e) => {
      outgoing.set(e.from, (outgoing.get(e.from) ?? 0) + 1);
      incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
      if (e.from === e.to) {
        issues.push({ level: "error", code: "SELF_LOOP", message: `节点「${e.from}」存在自环连线`, cellId: e.from });
      }
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

  /** 卸载画布：解绑快捷键并释放 X6 全部内部资源 */
  dispose() {
    this.graph.clearKeys?.();
    this.graph.dispose();
  }
}
