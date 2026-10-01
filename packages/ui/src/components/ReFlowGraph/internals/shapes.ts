/**
 * ReFlowGraph 图形注册
 *
 * 节点按 X6 官方 DAG 示例（https://x6.antv.antgroup.com/examples/showcase/practices/#dag ，
 * 源码 site/examples/showcase/practices/demo/dag.tsx）的做法，**节点体交给框架组件渲染**：
 * 官方用 `@antv/x6-react-shape` 的 `register()`，本组件用 Vue 侧对应物
 * `@antv/x6-vue-shape` 的 `register()`，注册一个 180×36 的横向卡片节点。
 *
 * 连线仍是自绘 SVG 图形：连线的语义色、虚实、箭头都由 attrs 决定，与节点体无关，
 * 交给框架组件反而要额外维护一份 diff 逻辑，收益为负。
 *
 * 业务差异全部落在 data（flowType / flowLabel / flowColor / flowIcon / flowData）上，
 * **新增节点类型无需注册新图形**。
 */
import { Graph } from "@antv/x6";
import { register } from "@antv/x6-vue-shape";
import type { Component } from "vue";
import { resolveFlowIcon } from "./icons";
import FlowNodeCard from "./FlowNodeCard.vue";
import type { FlowEdgeKind, FlowNodeTypeDef } from "./types";

/** 卡片节点图形名（vue-shape 注册出来的 shape） */
export const FLOW_NODE_SHAPE = "flow-card";

/** 连线图形名 */
export const FLOW_EDGE_SHAPE = "flow-edge";

/**
 * 卡片宽度，取自官方 DAG 的 180。
 *
 * 官方这个尺寸是给「图标 + 104px 标签 + 状态位」排的；本组件去掉了状态位、给类型标签
 * 让出空间，180 仍能容下约 14 个汉字。
 */
export const NODE_WIDTH = 180;

/** 卡片高度，取自官方 DAG 的 36 */
export const NODE_HEIGHT = 36;

/** 缺省主色，节点类型未给 color 时兜底 */
export const DEFAULT_NODE_COLOR = "#4f7cff";

/** 连线语义色 */
export const FLOW_EDGE_COLORS: Record<FlowEdgeKind, string> = {
  normal: "#00b96b",
  exception: "#e5484d",
  condition: "#4f7cff",
  else: "#a8b3c0",
};

/**
 * 四向磁吸锚点。
 *
 * 官方 DAG 只注册了 top / bottom 两个组，本组件保留四向：持久化数据里
 * `FlowEdge.fromPort` / `toPort` 可能是 left / right（见 types.ts），砍掉这两个组会让
 * 已存流程的连线端点落空。四向与「自上而下」的主流程不冲突 —— dagRules 只禁止
 * `top` 作源、`bottom` 作目标，left / right 仍然放行。
 */
export function flowPortGroups() {
  const circle = {
    r: 4,
    magnet: true,
    stroke: "#4f7cff",
    strokeWidth: 1.5,
    fill: "#ffffff",
  };
  return {
    top: { position: "top", attrs: { circle } },
    right: { position: "right", attrs: { circle } },
    bottom: { position: "bottom", attrs: { circle } },
    left: { position: "left", attrs: { circle } },
  } as const;
}

/**
 * 四个端口实例。
 *
 * @returns 与 {@link flowPortGroups} 一一对应的端口项，id 与组名同名，
 *          这样 `data-cell-id` 上的 `port-group` 才能被 dagRules 直接读成方向名
 */
export function flowPortItems() {
  return (["top", "right", "bottom", "left"] as const).map((g) => ({ group: g, id: g }));
}

/**
 * 判断节点（分支）图形名：一入两出的真菱形，不用卡片矩形冒充。
 *
 * 刻意标注成 {@link string} 而不是保留字面量类型：X6 的 `registerNode` 有一个
 * `<K extends string>(name: K, entity: never[K])` 重载，名字是字面量时 TS 会优先撞上它
 * 并报「参数类型不兼容 never」。
 */
export const FLOW_DIAMOND_SHAPE: string = "flow-diamond";

/** 菱形边长。方形才放得下两行字（节点名 + 类型小字），也符合流程图里判断框的惯例 */
export const DIAMOND_SIZE = 96;

/**
 * 默认走菱形的节点类型。
 *
 * <p>判断类节点在多数流程工具里都是菱形，这个组件此前对所有类型一律用 180×36 卡片，
 * 判断节点看起来和「抓取」一样，靠外形分不出「这里要选一条路走」。
 * 宿主可用引擎选项 `diamondTypes` 覆盖这份名单。</p>
 */
export const DEFAULT_DIAMOND_TYPES: readonly string[] = ["condition", "branch", "judge", "decision"];

/** 菱形实际提供的端口：入 = top，出 = right（真）/ bottom（假）。刻意不给 left */
export const DIAMOND_PORTS: readonly string[] = ["top", "right", "bottom"];

/** 卡片实际提供的端口：四向 */
export const CARD_PORTS: readonly string[] = ["top", "right", "bottom", "left"];

/**
 * 判断某类型是否该走菱形。
 *
 * @param type 节点类型标识
 * @param diamondTypes 覆盖名单，缺省用 {@link DEFAULT_DIAMOND_TYPES}
 * @returns 命中名单返回 {@code true}
 */
export function isDiamondType(type: string | undefined, diamondTypes: readonly string[] = DEFAULT_DIAMOND_TYPES): boolean {
  return !!type && diamondTypes.includes(type);
}

/**
 * 某类型节点该用的图形与尺寸。
 *
 * <p>引擎每个建节点入口都要过这里，避免「载入存量节点」和「新建节点」两处各写一份
 * 判断而漂移 —— 之前单一 `this.nodeShape` 就是这么漂移出问题的。</p>
 *
 * @param type 节点类型标识
 * @param cardShape 卡片图形名（宿主自定义组件形状或内置卡片）
 * @param diamondTypes 覆盖名单，缺省用 {@link DEFAULT_DIAMOND_TYPES}
 * @returns 图形名、宽高，以及是否菱形（决定要不要走 label 型 attrs）
 */
export function flowNodeShapeSpec(
  type: string | undefined,
  cardShape: string,
  diamondTypes: readonly string[] = DEFAULT_DIAMOND_TYPES,
): { shape: string; width: number; height: number; diamond: boolean } {
  if (isDiamondType(type, diamondTypes)) {
    return { shape: FLOW_DIAMOND_SHAPE, width: DIAMOND_SIZE, height: DIAMOND_SIZE, diamond: true };
  }
  return { shape: cardShape, width: NODE_WIDTH, height: NODE_HEIGHT, diamond: false };
}

/**
 * 菱形的外框路径。
 *
 * <p>内缩 1px：路径正好压在节点盒边界上时，描边有一半会被视口裁掉。</p>
 *
 * @param size 边长
 * @returns SVG path 的 d 属性
 */
function diamondPath(size: number): string {
  const half = size / 2;
  return `M ${half} 1 L ${size - 1} ${half} L ${half} ${size - 1} L 1 ${half} Z`;
}

/** 菱形的端口组：只有 top / right / bottom 三个锚点 */
function flowDiamondPortGroups() {
  const circle = {
    r: 4,
    magnet: true,
    stroke: "#4f7cff",
    strokeWidth: 1.5,
    fill: "#ffffff",
  };
  return {
    top: { position: "top", attrs: { circle } },
    right: { position: "right", attrs: { circle } },
    bottom: { position: "bottom", attrs: { circle } },
  } as const;
}

/** 菱形的端口实例，id 与组名同名（dagRules 靠这个读方向名） */
function flowDiamondPortItems() {
  return DIAMOND_PORTS.map((g) => ({ group: g, id: g }));
}

/**
 * 菱形的文字 attrs。
 *
 * <p>菱形不走 vue-shape 的 foreignObject：卡片那套「图标块 + 单行标签 + 右侧类型角标」
 * 塞进菱形必然溢出（上下两角是空的、左右两角是尖的）。改成 SVG text 两行居中，
 * 字色字号沿用卡片同一套（FlowNodeCard 的 #4e5969 / #a4abb5），两类节点看上去是一套东西。</p>
 *
 * @param label 节点名
 * @param typeLabel 类型中文名，可为空
 * @param color 节点主色，用作描边
 * @returns 可直接喂给 `graph.addNode` 的 attrs
 */
export function flowDiamondAttrs(label: string, typeLabel: string, color: string) {
  const half = DIAMOND_SIZE / 2;
  // 类型名为空、或与节点名重复时只画一行，避免出现「判断  判断」这种噪声
  const twoLines = !!typeLabel && typeLabel !== label;
  return {
    body: {
      d: diamondPath(DIAMOND_SIZE),
      fill: "#ffffff",
      stroke: color || DEFAULT_NODE_COLOR,
      strokeWidth: 1.5,
      strokeLinejoin: "round",
    },
    label: {
      x: half,
      y: twoLines ? half - 8 : half,
      text: label,
      textAnchor: "middle",
      textVerticalAnchor: "middle",
      fontSize: 13,
      fill: "#4e5969",
    },
    typeLabel: {
      x: half,
      y: half + 10,
      text: twoLines ? typeLabel : "",
      textAnchor: "middle",
      textVerticalAnchor: "middle",
      fontSize: 11,
      fill: "#a4abb5",
    },
  };
}

let registered = false;

/** 自定义节点体形状名的前缀，后面跟序号 */
export const FLOW_CUSTOM_NODE_SHAPE = "flow-card-custom";

/**
 * 组件 → 已注册的形状名。
 *
 * 用 WeakMap 而不是模块级变量存「当前的自定义组件」：选形是**每个引擎实例**的事
 * （同一页面可以开两个画布，一个用内置卡片、一个用自定义组件），
 * 而 X6 的 `Graph.registerNode` 是全局的、同一 shape 名会被后注册的组件顶掉。
 * 所以每个组件拿到自己的形状名，谁也不会覆盖谁。
 *
 * WeakMap 而非 Map：组件被 GC 后条目自动消失，不用手工清。
 */
const customShapes = new WeakMap<Component, string>();

/** 形状名序号 */
let customSeq = 0;

/**
 * 拿到（必要时注册）某组件对应的节点形状名。
 *
 * 注册走 `x6-vue-shape` 的 `register`：它内部 `Graph.registerNode(shape, { inherit: 'vue-shape' })`
 * 并把 component 记进 `shapeMaps`，节点体挂进 `<foreignObject>`。
 * 同一组件重复调用只注册一次（WeakMap 命中即返回），换组件才新增一个形状。
 *
 * @param component 自定义节点体组件
 * @returns 该组件独占的形状名
 */
export function ensureCustomShape(component: Component): string {
  const hit = customShapes.get(component);
  if (hit) {
    return hit;
  }
  customSeq += 1;
  const shape = `${FLOW_CUSTOM_NODE_SHAPE}-${customSeq}`;
  customShapes.set(component, shape);
  register({
    shape,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    component,
    ports: {
      groups: flowPortGroups(),
      items: flowPortItems(),
    },
  });
  return shape;
}

/**
 * 注册内置卡片节点与连线图形，幂等。
 *
 * 内置形状只注册一次，且**永不替换** —— 别的引擎实例可能正用着它，
 * 就地改会互相污染（同页两个画布的经典故障）。
 *
 * @param nodeShape 自定义组件对应的形状名；给了则本次建图的节点都用它
 * @returns 节点该用的形状名
 */
export function ensureFlowRegistered(nodeComponent?: Component | null): string {
  const nodeShape = nodeComponent ? ensureCustomShape(nodeComponent) : FLOW_NODE_SHAPE;
  if (registered) {
    return nodeShape;
  }
  registered = true;

  register({
    shape: FLOW_NODE_SHAPE,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    component: FlowNodeCard,
    ports: {
      groups: flowPortGroups(),
      items: flowPortItems(),
    },
  });

  // 判断节点：真菱形，一入两出（入 = top，出 = right 真 / bottom 假）。
  // 用原生节点而不是 vue-shape —— 菱形里塞 foreignObject 必然溢出，见 flowDiamondAttrs 的说明。
  Graph.registerNode(
    FLOW_DIAMOND_SHAPE,
    {
      width: DIAMOND_SIZE,
      height: DIAMOND_SIZE,
      markup: [
        // 字段名是 tagName 不是 tag（X6 的 Markup.JSONMarkup）：写错会被静默忽略、
        // 回退成默认矩形 markup，label / typeLabel 两个 selector 不存在、字也不显示。
        { tagName: "path", selector: "body" },
        { tagName: "text", selector: "label" },
        { tagName: "text", selector: "typeLabel" },
      ],
      ports: {
        groups: flowDiamondPortGroups(),
        items: flowDiamondPortItems(),
      },
    },
    true,
  );

  Graph.registerEdge(
    FLOW_EDGE_SHAPE,
    {
      inherit: "edge",
      zIndex: 0,
      attrs: {
        line: {
          stroke: FLOW_EDGE_COLORS.normal,
          strokeWidth: 1.8,
          strokeLinecap: "round",
          targetMarker: { name: "block", width: 9, height: 7 },
        },
        label: { fontSize: 11, fill: "#86909c" },
      },
      // 刻意不跟官方一样用自定义贝塞尔连接器（官方 algo-connector）：本组件是
      // 业务流程编排，正交折线才是这类工具的通行观感（对齐 spider-flow / 宜搭 / 云效），
      // 换成曲线在多分支时会明显更难读。详见 README 的「与官方实践的差异」一节。
      //
      // padding 是「连线离节点多远处开始拐弯」。原先 28 是按自上而下的主流程调的，
      // 但横向布局（内置 GitHub 示例：卡片 180 宽、最小间距只有 20）里 28 > 间隙，
      // 路由器装不下就绕路 —— 实测连线会从右端口向左、翻过卡片顶、再折回左端口，
      // 画布上一串「拱门」。8 时最小间隙那条仍会留一个小台阶（20 - 2×8 只剩 4px 直行段），
      // 4 才能让 20px 间隙也走成直线。
      router: { name: "orth", args: { padding: 4 } },
      connector: { name: "rounded", args: { radius: 8 } },
    },
    true,
  );
  return nodeShape;
}

/**
 * 节点 metadata：业务数据挂 data，卡片组件只读 data。
 *
 * 这里**不再**设 attrs —— 节点体是 Vue 组件，颜色/图标/文字都从 data 取，
 * 写了 attrs 也不会被渲染。
 *
 * @param input 节点的业务输入
 * @returns 可直接交给 `graph.addNode` 的节点配置
 */
export function buildFlowNodeMetadata(input: {
  id: string;
  type: string;
  label: string;
  typeLabel?: string;
  x: number;
  y: number;
  color: string;
  iconPath?: string;
  /** 节点图片 URL；有值时卡片渲染 <img>，优先于 iconPath */
  image?: string;
  /** 图形名，缺省内置卡片；自定义节点体由引擎把自己的形状名传进来 */
  shape?: string;
  /** 节点宽高，缺省 180×36；菱形由引擎按 96×96 传 */
  width?: number;
  height?: number;
  /** 是否菱形：决定要不要给 SVG text 两行标签（卡片走 Vue 组件，不吃 attrs） */
  diamond?: boolean;
  data?: Record<string, unknown>;
}) {
  const label = input.label;
  const typeLabel = input.typeLabel ?? "";
  const color = input.color || DEFAULT_NODE_COLOR;
  return {
    id: input.id,
    shape: input.shape ?? FLOW_NODE_SHAPE,
    x: input.x,
    y: input.y,
    width: input.width ?? NODE_WIDTH,
    height: input.height ?? NODE_HEIGHT,
    // 卡片形状不设 attrs（节点体是 Vue 组件，attrs 不会被渲染）；菱形必须给
    ...(input.diamond ? { attrs: flowDiamondAttrs(label, typeLabel, color) } : {}),
    data: {
      flowType: input.type,
      flowLabel: label,
      flowTypeLabel: typeLabel,
      flowColor: color,
      flowIcon: input.iconPath || resolveFlowIcon(input.type),
      flowImage: input.image || "",
      flowData: input.data ?? {},
    },
  };
}

/**
 * 按两节点的相对位置挑默认端口。
 *
 * <p>端口默认写死「下→上」是给<b>自上而下</b>的流程图用的。但持久化数据里存在
 * <b>横向一排</b>的布局（内置的 GitHub 示例就是 x=60..910、y 全为 180）。
 * 横向布局配下→上端口时，连线会从左边卡片「底部」出发、贴着右边卡片的下沿走一段、
 * 再拐进它的「顶部」—— 画布上表现为一条贯穿所有卡片底边的绿线，看着像装饰线而不是连接。
 * 实测连线 path 为 {@code M 154.75 216 L 342 216 C ... L 350 186.55}，
 * 其中 {@code y=216} 正是卡片底边、横线覆盖 x=260..440 整段目标卡片。</p>
 *
 * <p>所以按几何自动选向：横向为主走 右→左，纵向为主走 下→上。
 * 数据里显式写了端口的仍以数据为准 —— 用户手绘的连线端口是 X6 给的，不能被这里覆盖。</p>
 *
 * @param from   源节点左上角坐标
 * @param to     目标节点左上角坐标
 * @param fromPort 数据里显式指定的源端口，未指定则为空
 * @param toPort   数据里显式指定的目标端口，未指定则为空
 * @returns 实际要用的源/目标端口
 */
export function pickFlowPorts(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromPort?: string | null,
  toPort?: string | null,
  options?: FlowPortPickOptions,
): { fromPort: string; toPort: string } {
  const diamondTypes = options?.diamondTypes ?? DEFAULT_DIAMOND_TYPES;
  // 两端各自「实际有哪些端口」：菱形没有 left，横向落进菱形时首选的 left 会落空
  const fromPorts = isDiamondType(options?.fromType, diamondTypes) ? DIAMOND_PORTS : CARD_PORTS;
  const toPorts = isDiamondType(options?.toType, diamondTypes) ? DIAMOND_PORTS : CARD_PORTS;
  const fw = options?.fromSize?.width ?? NODE_WIDTH;
  const fh = options?.fromSize?.height ?? NODE_HEIGHT;
  const tw = options?.toSize?.width ?? NODE_WIDTH;
  const th = options?.toSize?.height ?? NODE_HEIGHT;
  // 用节点中心而不是左上角比较：左上角在纵向布局里会把同列的节点算成「横向」
  const dx = to.x + tw / 2 - (from.x + fw / 2);
  const dy = to.y + th / 2 - (from.y + fh / 2);
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  /**
   * 显式端口若该端根本没有，不能照搬。
   *
   * <p>X6 接受任意 port 名，连线照样连上，但锚点落在节点盒子外 —— 表现为
   * 「线接上了却没有连接点」或绕一大圈。所以这里按可用端口夹取，
   * 落空时退回几何首选方向，再落空就用该端第一个端口。</p>
   */
  const pick = (explicit: string | null | undefined, preferred: string, available: readonly string[]) => {
    if (explicit && available.includes(explicit)) {
      return explicit;
    }
    return available.includes(preferred) ? preferred : available[0];
  };
  return {
    fromPort: pick(fromPort, horizontal ? "right" : "bottom", fromPorts),
    toPort: pick(toPort, horizontal ? "left" : "top", toPorts),
  };
}

/** {@link pickFlowPorts} 的可选参数：两端是什么类型、多大，决定端口可用性与几何比较 */
export interface FlowPortPickOptions {
  fromType?: string;
  toType?: string;
  /** 覆盖菱形类型名单，缺省用 {@link DEFAULT_DIAMOND_TYPES} */
  diamondTypes?: readonly string[];
  /** 源节点尺寸，缺省按卡片 180×36 */
  fromSize?: { width: number; height: number };
  /** 目标节点尺寸，缺省按卡片 180×36 */
  toSize?: { width: number; height: number };
}

/**
 * 连线样式：语义色 + 不传递变量走虚线。
 *
 * @param kind 连线语义，决定描边色
 * @param transfer false 表示「不传递变量」，此时走 `6 4` 虚线
 * @returns 可直接喂给 `edge.setAttrs` 的 attrs
 */
export function flowEdgeAttrs(kind: FlowEdgeKind | undefined, transfer: boolean | undefined) {
  const stroke = FLOW_EDGE_COLORS[kind ?? "normal"];
  return {
    line: {
      stroke,
      strokeWidth: 1.8,
      strokeLinecap: "round",
      // 必须给空串而不是 undefined：X6 的 setAttrs 是深合并，值为 undefined 的键
      // **不会**把已有值删掉。拖拽连线的预览边带 strokeDasharray:"5 5"，
      // 若这里返回 undefined，edge:connected 处的整体重绘就把预览虚线留下了 ——
      // 每条新连的线都变成虚线，看起来像「没连完的临时线」。
      // 空串会把 SVG 的 stroke-dasharray 属性置空，即实线。
      // 这条不是推断：pw-dag-practice.mjs 的「松手后预览边已消失」断言实测命中。
      strokeDasharray: transfer === false ? "6 4" : "",
      targetMarker: { name: "block", width: 9, height: 7, stroke: "none", fill: stroke },
    },
  };
}

/**
 * 连线 metadata。
 *
 * @param input 连线的业务输入
 * @returns 可直接交给 `graph.addEdge` 的连线配置
 */
export function buildFlowEdgeMetadata(input: {
  id: string;
  from: string;
  to: string;
  fromPort?: string;
  toPort?: string;
  kind?: FlowEdgeKind;
  label?: string;
  transfer?: boolean;
  data?: Record<string, unknown>;
}) {
  return {
    id: input.id,
    shape: FLOW_EDGE_SHAPE,
    source: { cell: input.from, port: input.fromPort ?? "bottom" },
    target: { cell: input.to, port: input.toPort ?? "top" },
    attrs: flowEdgeAttrs(input.kind, input.transfer),
    labels: input.label
      ? [{ position: 0.5, attrs: { label: { text: input.label } } }]
      : [],
    data: {
      flowKind: input.kind ?? "normal",
      flowTransfer: input.transfer !== false,
      flowData: input.data ?? {},
    },
  };
}

/**
 * 按 type 取节点类型定义，未命中时兜底成一个同名节点。
 *
 * @param types 调色板的全量类型定义
 * @param type 待查的类型标识
 * @returns 命中的定义；未命中时返回 `{ type, label: type }`
 */
export function resolveFlowType(
  types: FlowNodeTypeDef[],
  type?: string,
): FlowNodeTypeDef {
  return types.find((t) => t.type === type) ?? { type: type ?? "default", label: type ?? "节点" };
}
