<!--
  采集流程图设计器：ReFlowGraph（X6）画布 + 元数据驱动的属性面板。

  画布能力全部来自 @repo/ui 的 ReFlowGraph：调色板拖拽入板、四向磁吸正交连线、框选、
  撤销重做、就地改名、右键菜单、缩略图、缩放适配、结构预检。本组件只做三件事：
    ① /designer/metas → 调色板节点类型（含分组配色与悬浮提示）；
    ② CollectDsl ↔ FlowGraphData 双向换算（连线独有的 condition/exceptionFlow 寄生在 data 里）；
    ③ 按参数元数据渲染表单（text / textarea / number / switch / select / flow / pairs / fields）。
  新增节点类型仍然只需后端注册执行器，前端零改动。
-->
<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { fetchPreview } from "../api/collectApi";
import type { PreviewPayload } from "./nodes/paramContext";
import type { Component } from "vue";
import { msgError } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReFlowGraph from "@repo/ui/re-flow-graph";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import { formatDuration } from "@repo/ui/re-time";
import { costMs } from "@repo/utils";
import commentForm from "./nodes/commentForm.vue";
import conditionForm from "./nodes/conditionForm.vue";
import dataEntryForm from "./nodes/dataEntryForm.vue";
import databaseForm from "./nodes/databaseForm.vue";
import dedupForm from "./nodes/dedupForm.vue";
import endForm from "./nodes/endForm.vue";
import extractForm from "./nodes/extractForm.vue";
import genericForm from "./nodes/genericForm.vue";
import linkForm from "./nodes/linkForm.vue";
import middlewareForm from "./nodes/middlewareForm.vue";
import outputForm from "./nodes/outputForm.vue";
import processForm from "./nodes/processForm.vue";
import requestForm from "./nodes/requestForm.vue";
import scriptForm from "./nodes/scriptForm.vue";
import sleepForm from "./nodes/sleepForm.vue";
import sqlForm from "./nodes/sqlForm.vue";
import startForm from "./nodes/startForm.vue";
import aiForm from "./nodes/aiForm.vue";
import SectionHead from "./nodes/SectionHead.vue";
import NodeFormTabs from "./NodeFormTabs.vue";
import {
  createNode,
  emptyDsl,
  hasCycle,
  indexMetas,
  lintExpression,
  pairPrefix,
  replacePairs,
} from "../utils/dsl";
import type { ParamPair } from "../utils/dsl";
import type { NodeForm, NodeFormContext, PlaceholderGroup } from "./nodes/paramContext";
import type {
  FlowEdge,
  FlowEdgeKind,
  FlowGraphData,
  FlowGraphEngine,
  FlowNode,
  FlowNodeTypeDef,
  FlowSelection,
} from "@repo/ui/re-flow-graph";
import type {
  CollectColumn,
  CollectDsl,
  CollectEdge,
  CollectExtractField,
  CollectNode,
  CollectOption,
  CollectParam,
  CollectParamMeta,
  CollectShapeMeta,
  CollectTaskLog,
} from "../types/collect";
// 表元数据与下拉选项映射归数据源中心管：中文口径只有一份实现
import { toTableOptions } from "@pages/datasource";
import type { CollectTable } from "@pages/datasource";

const props = defineProps<{
  metas: CollectShapeMeta[];
  /**
   * 待载入的流程图（声明式入口）。
   *
   * <p>预览图、运行回放、弹窗里的设计器都用它把图灌进画布，外部不要拿 ref 调
   * {@code load()}：画布内核（X6）异步就绪，就绪前调用会落到 graphData 分支，
   * 随后又被 {@code onReady} 的播种覆盖，结果是「节点清单 4 个、画布 0 个」（实测）。
   * 这里在 ready 之后再补灌一次，引擎就绪与数据到达的先后顺序就不再重要。</p>
   */
  initialDsl?: CollectDsl | null;
  /**
   * 只读模式：禁拖拽、禁连线、禁属性编辑，并隐藏调色板与属性停靠区。
   *
   * 流程预览图与运行回放都走这个模式——它们要的是同一张画布，
   * 不另写一套渲染，回放时只改 states 就能让节点逐个变色。
   *
   * 注意：{@code @repo/ui/re-flow-graph} 是按主题加载的组件，两个主题的开关名不一样：
   * koi 主题有 {@code editable}，内部翻译成 readonly / showPalette / showProperties；
   * default 主题只有 {@code readonly}，没有 {@code editable}。
   * 所以两个都传：koi 下 {@code editable} 生效、{@code readonly} 是无害的 fallthrough
   * （会被 koi 壳的显式绑定覆盖）；default 下反过来。
   * 少传一个的后果是切到另一主题时只读态静默失效 —— 组件不报错、画布照旧可拖。
   */
  readonly?: boolean;
  /** 最近一次任务的逐节点执行状态，用来给画布节点描边 */
  states?: Record<string, CollectTaskLog>;
  /** 已执行轨迹的连线 id 集合；这些边显示流动虚线动画（重播 / 追踪） */
  activeEdgeIds?: string[];
  /** 当前正在执行/循环的节点 id；该节点显示蓝色虚线动画边框 */
  loopingNodeId?: string | null;
  /** 紧凑模式：降低画布最低高度，供弹窗内叠放的第二张图使用 */
  compact?: boolean;
  /**
   * 最近一次落库时间（UI 稿底栏「最近保存 15:07」）。
   *
   * <p>由持有保存动作的宿主传入（FlowView 拿 {@code CollectFlow.updateTime}），
   * 设计器自己不发请求也不猜时间；没传就显示占位符。只读宿主（预览图 / 回放）
   * 不渲染属性面板，这个值用不到。</p>
   */
  savedAt?: string | number | Date | null;
  /**
   * 可插入的占位字段分组（全局变量 / 自定义函数等），透传给文本参数的「插入占位」入口。
   *
   * <p>刻意由宿主注入而不是设计器自己去调接口：设计器不依赖 api 层，只认 props，
   * 这样它既能嵌在弹窗里用，也能在只读预览里被复用。</p>
   */
  placeholderGroups?: PlaceholderGroup[];
  /** 子流程节点可选的流程，未传时 flow 参数退回手填流程ID */
  flowOptions?: CollectOption[];
  /** 数据源下拉候选，首项固定是应用主库 */
  datasourceOptions?: CollectOption[];
  /** 读某个数据源的表清单；未传时 table 参数退回手填表名 */
  /**
   * 传表元数据而不是 string[]：表下拉要显示表注释（中文）与表类型，
   * 只有表名的话中文无从谈起。宿主老实现若仍返回 string[]，
   * 这里按「每项一个表名」兜底，不至于整个下拉空掉。
   */
  loadTables?: (datasource: string) => Promise<CollectTable[] | string[]>;
  /** 读某张表的列元数据，供字段映射控件用 */
  loadColumns?: (datasource: string, table: string) => Promise<CollectColumn[]>;
}>();

const emit = defineEmits<{ (event: "change"): void }>();

/** 流程级字段：图结构由画布内核持有，这里只管 name/线程数/请求头/Cookie/变量 */
type FlowLevel = Omit<CollectDsl, "nodes" | "edges">;

/** 节点在画布上携带的业务数据 */
interface NodeCanvas {
  params?: CollectParam[];
  fields?: CollectExtractField[];
}

/** 连线在画布上携带的业务数据（X6 没有条件/异常流向概念，只能寄生在 data） */
interface EdgeCanvas {
  condition?: string;
  exceptionFlow?: string;
}

interface EdgeForm {
  id: string;
  from: string;
  to: string;
  condition: string;
  exceptionFlow: string;
  transmitVariable: boolean;
}

/** 分组主色，与节点库观感一致 */
const GROUP_COLORS: Record<string, string> = {
  来源: "#4f7cff",
  解析: "#8e4ec6",
  控制: "#f59a23",
  输出: "#00b96b",
};

/** 执行状态描边色 */
const STATE_RING: Record<string, string> = {
  SUCCESS: "#00b96b",
  FAILURE: "#e5484d",
  RUNNING: "#4f7cff",
  SKIPPED: "#f59a23",
  STOPPED: "#a8b3c0",
};

const STATE_LABELS: Record<string, string> = {
  SUCCESS: "成功",
  FAILURE: "失败",
  RUNNING: "执行中",
  SKIPPED: "跳过",
  STOPPED: "停止",
};

/** 连线触发时机，值与 DSL 的 exceptionFlow 一致 */
const EXCEPTION_OPTIONS = [
  { value: "0", label: "总是流转" },
  { value: "2", label: "仅上游正常时流转" },
  { value: "1", label: "仅上游异常时流转" },
];

/**
 * 属性面板页签。
 *
 * <p>「流程设置」按要求停用：页签禁用、点不动，内容仍保留在下方插槽里，以便日后恢复。
 * 「连线」**保持可用**：判断节点（condition）算出的真假要靠出边的「流转条件」分流，
 * 而那个输入框就在这个页签里 —— 禁掉它，条件分支就只能靠手改 DSL 才能编辑。</p>
 *
 * <p>「连线」带计数 badge：当前图里有几条连线一眼可见（0 条不渲染 badge，
 * 空壳数字只添噪音）；页签行按 UI 稿用 underline 变体（见模板）。</p>
 */

const graphData = ref<FlowGraphData>({ nodes: [], edges: [] });
/**
 * 图结构版本号：onGraphChange 每次回抛 +1。
 *
 * <p>引擎的 change 不回写 graphData —— prop 只在载入时灌，
 * 回写会触发 ReFlowGraph 的 prop 同步重放，有重入风险；
 * 但「删节点后未注册红标 / 警报即时解除」这类计算必须跟编辑走，
 * 于是用版本号驱动重算，数据本体直接读引擎实时数据。</p>
 */
const graphVersion = ref(0);
const flow = ref<FlowLevel>(emptyDsl());
const engine = shallowRef<FlowGraphEngine | null>(null);
/**
 * ReFlowGraph 组件实例。
 *
 * <p>面板里的「全览流程节点」要经它调 {@code fit()}，而不是直接 engine.fitCenter()：
 * 外壳那版会同步工具条倍率显示，直接调引擎的话图缩放了、倍率还停在旧值。</p>
 */
const graphRef = ref<{ fit?: () => unknown; tidy?: () => unknown } | null>(null);
const nodeForm = ref<NodeForm | null>(null);
const edgeForm = ref<EdgeForm | null>(null);

/** 底部概览的三格统计：节点数 / 连线数 / 最近保存 */
const overview = computed(() => {
  // 版本号参与依赖追踪：编辑（onGraphChange +1）与
  // 载入（load 写 graphData）都驱动重算；计数取引擎实时数据
  graphVersion.value;
  const data = engine.value?.getData() ?? graphData.value;
  return {
    nodes: data.nodes?.length ?? 0,
    edges: data.edges?.length ?? 0,
    savedAt: savedLabel.value,
  };
});

/** 「最近保存」文案：宿主给服务端保存时间，没给就显示占位符（不编造时间） */
const savedLabel = computed(() => {
  const raw = props.savedAt;
  if (!raw) return "—";
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toTimeString().slice(0, 5);
});

/** 底栏右侧状态：有过保存时间才算「已自动保存」 */
const isSaved = computed(() => !!props.savedAt);

/** 空态主按钮「全览流程节点」：缩放到能装下整张图，让所有节点一次入画 */
function overviewAll(): void {
  // 组件实例优先（能同步工具条倍率），拿不到再退回引擎本身
  if (graphRef.value?.fit) {
    graphRef.value.fit();
    return;
  }
  engine.value?.fitCenter();
}

/** 整体灌图后的第一个 change 来自内核 setData，不算用户改动 */
let pending = true;

/**
 * 最近一次程序化载入的图签名。
 *
 * 用来区分「程序把图画上去」与「用户改了画布」：两者都会触发引擎 change 事件，
 * 只有后者该把页面标成未保存。
 */
let loadedSignature = "";

/** 图内容签名。流程图很小（几十个节点），直接序列化最省事也最不容易漏判 */
function signatureOf(data: FlowGraphData): string {
  return JSON.stringify(data);
}
/** 补默认参数、状态描边期间产生的 change 同样不算改动 */
let applying = false;

const metaMap = computed(() => indexMetas(props.metas));

/**
 * 类型未注册的节点：后端执行器没启用时（如 script 开关关闭），
 * 已保存的 DSL 里仍可能有这种 shape 的节点 — 设计器读得出来，
 * 但一执行就报「节点 X 的类型未注册」。这里在设计期标出：
 * 画布描边标红、面板顶部出警报，保存 / 运行由宿主（FlowView.graphOf）拦下。
 *
 * <p>读引擎实时数据：删掉未注册节点后引擎立刻更新，
 * 警报与保存拦截随之解除（graphData prop 不回写，由 graphVersion 驱动重算）。</p>
 */
const shapeIssues = computed(() => {
  graphVersion.value;
  const data = engine.value?.getData() ?? graphData.value;
  return data.nodes
    .filter(node => !metaMap.value[node.type])
    .map(node => ({ id: node.id, name: node.label, shape: node.type }));
});

/** 开始节点类型标识，与 ReFlowGraph 的 start-type / 后端 CollectGraph.checkStartEnd() 口径一致 */
const START_TYPE = "start";

/** 画布上是否已存在开始节点：true 时调色板隐藏「开始」项，把后端的「有且仅有一个 start」提前到编辑期 */
const hasStartNode = ref(false);

/**
 * 开始节点的「钉住」位置：id → 图形坐标。
 *
 * <p>需求要求开始节点不允许再拖动。X6 没有 per-node 的 draggable（`nodeMovable` 是整图级），
 * 所以在 {@link lockStartPosition} 里监听位置变更把它弹回这里记下的坐标。</p>
 *
 * <p>每次载入/图变更都会重新记录 —— 位置来自持久化数据而非硬编码，换个布局的流程图照样能在新位置钉住。</p>
 */
const startPositions = new Map<string, { x: number; y: number }>();

/** 已下线的节点 shape：即使远端后端旧 jar 没下发 hidden，前端也不允许再进调色板 */
const DEPRECATED_SHAPES = new Set(["script", "exists", "output"]);

const nodeTypes = computed<FlowNodeTypeDef[]>(() =>
  props.metas
    .filter(meta => !meta.hidden && !DEPRECATED_SHAPES.has(meta.shape))
    .filter(meta => !(meta.shape === START_TYPE && hasStartNode.value))
    .map(meta => ({
      type: meta.shape,
      label: meta.label,
      group: meta.group || "其他",
      color: GROUP_COLORS[meta.group ?? ""] ?? "#5b6b7b",
      tips: [meta.description, meta.outputVariable].filter(Boolean).join("\n"),
    })),
);

const selectedMeta = computed(() =>
  nodeForm.value ? metaMap.value[nodeForm.value.shape] ?? null : null,
);

/** 非 Tab 化节点的说明：基础信息「节点 ID / 类型」旁的信息图标 */
const nodeInfoText = computed(() =>
  selectedMeta.value
    ? [selectedMeta.value.description, selectedMeta.value.outputVariable].filter(Boolean).join("\n")
    : "",
);

  const flowOptionsOf = computed(() =>
    (props.flowOptions ?? []).map(item => ({ value: item.value, label: item.label })),
  );

  /** 数据源候选同样要摊成 ReOption：CollectOption 是 interface，没有隐式索引签名 */
  const datasourceOptionsOf = computed(() =>
    (props.datasourceOptions ?? []).map(item => ({ value: item.value, label: item.label })),
  );

const panelTitle = computed(() => {
  if (nodeForm.value) return "节点参数";
  if (edgeForm.value) return "连线属性";
  return "流程属性";
});

/** 流程属性：运行超时的文本态（空 = 用平台全局默认 30 分钟） */
const timeoutText = ref("");
const formatTimeout = (v: number | null | undefined): string =>
  v && v > 0 ? String(v) : "";
watch(
  () => flow.value.timeoutMs,
  (v) => { timeoutText.value = formatTimeout(v); },
);
/** 流程属性：更新运行超时（毫秒），空/非正数按「用全局默认」处理并清空 */
function updateTimeout(v: string): void {
  const raw = String(v ?? "").trim();
  const n = raw === "" ? null : Number(raw);
  timeoutText.value = raw;
  if (raw === "") {
    if (flow.value.timeoutMs !== null) {
      flow.value.timeoutMs = null;
      emit("change");
    }
    return;
  }
  if (n == null || !Number.isFinite(n) || n <= 0) {
    timeoutText.value = formatTimeout(flow.value.timeoutMs);
    return;
  }
  if (flow.value.timeoutMs !== Math.trunc(n)) {
    flow.value.timeoutMs = Math.trunc(n);
    emit("change");
  }
}

const selectedState = computed(() =>
  nodeForm.value ? props.states?.[nodeForm.value.id] ?? null : null,
);

/**
 * 状态条的表达式体检结果（UI 稿底栏「表达式校验通过」）。
 *
 * <p>实时扫本节点**全部**参数值（含 pairs / mapping 每一行，它们同样是参数）：
 * 有问题报「参数标签 + 问题」，全通过返回 null。判定口径见 {@link lintExpression}
 * ——只报未闭合 / 空体 / 嵌套三类确定性错误，不碰裸 }，不会对 JSON 与正则误报。</p>
 */
const exprIssue = computed<string | null>(() => {
  for (const param of nodeForm.value?.params ?? []) {
    const issue = lintExpression(param.value ?? "");
    if (issue) {
      const label = selectedMeta.value?.params.find(item => item.name === param.name)?.label;
      return label ? `${label}：${issue}` : issue;
    }
  }
  return null;
});

const edgeFlowText = computed(() =>
  edgeForm.value ? `${nameOf(edgeForm.value.from)} → ${nameOf(edgeForm.value.to)}` : "",
);

/* --------------------------------- 文案换算 -------------------------------- */

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

/* ------------------------------ DSL ↔ 画布换算 ------------------------------ */

/** 按元数据生成一份默认参数与抽取字段 */
function seedOf(shape: string): { params: CollectParam[]; fields: CollectExtractField[] } {
  const meta = metaMap.value[shape];
  if (!meta) {
    return { params: [], fields: [] };
  }
  const node = createNode(meta, "seed", 0, 0);
  return { params: node.params ?? [], fields: node.fields ?? [] };
}

/** 异常流向优先着色，其次有条件即视为条件分支 */
function kindOf(exceptionFlow?: string | null, condition?: string | null): FlowEdgeKind {
  if (exceptionFlow === "1") return "exception";
  return text(condition).trim() ? "condition" : "normal";
}

/** 连线标签只做显示，真实条件存在 data 里 */
function condLabel(condition?: string | null): string {
  const value = text(condition).trim();
  if (!value) return "";
  return value.length > 18 ? `${value.slice(0, 18)}…` : value;
}

/**
 * 连线标签：判断节点的出边直接标「真 / 假」，其它节点沿用条件原文。
 *
 * <p>判断节点是靠出边条件分流的，但它的出边条件通常写成 {@code ${conditionResult}} 或留空，
 * 画布上看到的要么是一串占位符、要么什么都不显示 —— 用户没法一眼看出哪条是真的哪条是假的。
 * 这里按源节点类型换成人话；条件里显式比较 false 的算假，留空即默认出边（也就等于假分支，
 * 因为真分支已经被 {@code ${conditionResult}} 占掉了）。</p>
 *
 * @param edge        连线（至少有 condition）
 * @param sourceShape 源节点类型
 * @returns 画布上显示的连线标签
 */
/**
 * 判断节点出边属于哪个分支：真 / 假。
 *
 * <p>判断节点是靠出边条件分流的：条件里显式比较 false 的算假，留空即默认出边
 * （也就等于假分支，因为真分支已经被 `${conditionResult}` 占掉了）。</p>
 *
 * @param edge        连线（至少有 condition）
 * @param sourceShape 源节点类型
 * @returns 「真」/「假」；非判断节点或异常边返回空串
 */
function branchOf(
  edge: { condition?: string | null; exceptionFlow?: string | null },
  sourceShape: string,
): string {
  if (text(edge.exceptionFlow) === "1" || sourceShape !== "condition") {
    return "";
  }
  const raw = text(edge.condition).trim();
  if (!raw) {
    return "假";
  }
  return /false/.test(raw) ? "假" : "真";
}

/**
 * 判断节点出边该走的端口：真 → right，假 → bottom。
 *
 * <p>判断节点在画布上是菱形，只有一个入边锚（top）和两个出边锚（right / bottom）。
 * 不指定端口时 {@code pickFlowPorts} 按几何选向，真分支可能从 bottom 出去、假分支从
 * right 出去 —— 标签写着「真」但线走的却是假端口，「一入两出」就只是画得像。
 * 这里按分支把端口定死；非判断节点与异常边返回 undefined，交给几何自动选。</p>
 *
 * @param edge        连线（至少有 condition）
 * @param sourceShape 源节点类型
 * @returns 端口名；不适用时为 undefined
 */
function branchPortOf(
  edge: { condition?: string | null; exceptionFlow?: string | null },
  sourceShape: string,
): string | undefined {
  const branch = branchOf(edge, sourceShape);
  if (branch === "真") {
    return "right";
  }
  if (branch === "假") {
    return "bottom";
  }
  return undefined;
}

function edgeLabelOf(
  edge: { condition?: string | null; exceptionFlow?: string | null },
  sourceShape: string,
): string {
  if (text(edge.exceptionFlow) === "1") {
    return "异常时";
  }
  if (sourceShape !== "condition") {
    return condLabel(edge.condition);
  }
  const raw = text(edge.condition).trim();
  if (!raw) {
    return "假（默认出边）";
  }
  return branchOf(edge, sourceShape);
}

function toGraphData(dsl: CollectDsl): FlowGraphData {
  return {
    nodes: (dsl.nodes ?? []).map(node => ({
      id: node.id,
      type: node.shape,
      label: node.name || node.shape,
      x: node.x ?? 0,
      y: node.y ?? 0,
      data: {
        params: (node.params ?? []).map(item => ({ ...item })),
        fields: (node.fields ?? []).map(item => ({ ...item })),
      },
    })),
    edges: (dsl.edges ?? []).map(edge => {
      const sourceShape = (dsl.nodes ?? []).find(item => item.id === edge.from)?.shape ?? "";
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        // 判断节点按分支定端口（真 right / 假 bottom），其余交给几何自动选
        fromPort: branchPortOf(edge, sourceShape),
        kind: kindOf(edge.exceptionFlow, edge.condition),
        label: edgeLabelOf(edge, sourceShape),
        transfer: edge.transmitVariable !== false,
        data: { condition: text(edge.condition), exceptionFlow: edge.exceptionFlow || "0" },
      };
    }),
  };
}

function toCollectNode(node: FlowNode): CollectNode {
  const held = (node.data ?? {}) as NodeCanvas;
  const seed = held.params ? null : seedOf(node.type);
  return {
    id: node.id,
    shape: node.type,
    name: node.label,
    x: node.x,
    y: node.y,
    params: (held.params ?? seed?.params ?? []).map(item => ({ ...item })),
    fields: (held.fields ?? seed?.fields ?? []).map(item => ({ ...item })),
  };
}

function toCollectEdge(edge: FlowEdge): CollectEdge {
  const held = (edge.data ?? {}) as EdgeCanvas;
  return {
    id: edge.id,
    from: edge.from,
    to: edge.to,
    condition: text(held.condition),
    exceptionFlow: held.exceptionFlow ?? (edge.kind === "exception" ? "1" : "0"),
    transmitVariable: edge.transfer !== false,
  };
}

/* -------------------------------- 面板读写 -------------------------------- */

function cloneParams(params: CollectParam[] | undefined): CollectParam[] {
  return (params ?? []).map(item => ({ ...item }));
}

function cloneFields(fields: CollectExtractField[] | undefined): CollectExtractField[] {
  return (fields ?? []).map(item => ({ ...item }));
}

function readNodeForm(node: FlowNode): void {
  const held = (node.data ?? {}) as NodeCanvas;
  const seed = held.params && held.fields ? null : seedOf(node.type);
  nodeForm.value = {
    id: node.id,
    shape: node.type,
    name: node.label,
    params: cloneParams(held.params ?? seed?.params),
    fields: cloneFields(held.fields ?? seed?.fields),
  };
}

function readEdgeForm(edge: FlowEdge): void {
  const held = (edge.data ?? {}) as EdgeCanvas;
  edgeForm.value = {
    id: edge.id,
    from: edge.from,
    to: edge.to,
    condition: text(held.condition),
    exceptionFlow: held.exceptionFlow ?? (edge.kind === "exception" ? "1" : "0"),
    transmitVariable: edge.transfer !== false,
  };
}

/** 面板镜像写回画布；传副本，避免内核与面板共享同一份可变数组 */
function pushNode(): void {
  const form = nodeForm.value;
  if (!form) return;
  engine.value?.updateNode(form.id, {
    label: form.name,
    data: { params: cloneParams(form.params), fields: cloneFields(form.fields) },
  });
}

function renameNode(value: unknown): void {
  const form = nodeForm.value;
  if (!form) return;
  form.name = text(value);
  pushNode();
}

function setParam(param: CollectParamMeta, value: unknown): void {
  const form = nodeForm.value;
  if (!form) return;
  const hit = form.params.find(item => item.name === param.name);
  if (hit) {
    hit.value = text(value);
  } else {
    form.params.push({ name: param.name, value: text(value), description: param.label });
  }
  pushNode();
}

function paramOf(name: string): string {
  return nodeForm.value?.params.find(item => item.name === name)?.value ?? "";
}

/* --------------------------- 数据源联动（表 / 字段映射） --------------------------- */

/*
 * 这段必须放在 paramOf / selectedMeta / nodeForm 之后：
 * 下面的 watch 开了 immediate，会在 setup 阶段同步求值，
 * 若这些 const 还没初始化就会抛 ReferenceError（TDZ），整个属性面板直接白屏。
 */

/** 当前选中节点里 type=table 的参数名，一个节点至多一个 */
const tableParamName = computed<string | null>(() => {
  const params = selectedMeta.value?.params ?? [];
  return params.find(item => item.type === "table")?.name ?? null;
});

/** 当前选中节点里 type=mapping 的参数名 */
const mappingParamName = computed<string | null>(() => {
  const params = selectedMeta.value?.params ?? [];
  return params.find(item => item.type === "mapping")?.name ?? null;
});

const activeTable = computed<string>(() =>
  tableParamName.value ? paramOf(tableParamName.value).trim() : "",
);

const activeDatasource = computed<string>(() => {
  const params = selectedMeta.value?.params ?? [];
  const source = params.find(item => item.type === "datasource");
  return source ? paramOf(source.name).trim() : "";
});

/** 表清单：跟着数据源走，key 换成数据源+节点，避免切节点时串数据 */
const tablesByKey = ref<Record<string, CollectTable[]>>({});
const tablesLoading = ref(false);
const tablesError = ref<string | null>(null);

const activeTableKey = computed(
  () => `${nodeForm.value?.id ?? "-"}|${activeDatasource.value || "app"}`,
);

/**
 * 表下拉候选：交给共享映射函数生成「label=中文备注、subtitle=表名·类型」。
 *
 * <p>不用就地 map：中文回退、空白剪裁、无类型时不拼多余分隔符这套口径
 * 集中在 datasource 包的 schemaOptions 里，改一处就够。</p>
 */
const tableOptions = computed(() => toTableOptions(tablesByKey.value[activeTableKey.value] ?? []));

/**
 * 当前目标表是否已存在，三态而不是布尔：
 * - null   表清单还没读到（正在加载、或读失败），无法判断，按"存在"处理避免误报
 * - true   表清单里确实有这张表
 * - false  表清单已确认没有这张表 → 走"新建表"模式，字段映射允许自由输入列名
 *
 * 为什么不靠"读列报错了"来判断不存在：读列失败还有数据源不可达、权限不足、
 * 连接超时等多种原因，把它们一律当成"表不存在"会把真故障静默掉。
 */
const tableExists = computed<boolean | null>(() => {
  const table = activeTable.value;
  if (!table) return null;
  const tables = tablesByKey.value[activeTableKey.value];
  if (!tables) return null;
  // 表清单存的是元数据，判断存在性要按表名比，不能用 includes（那是字符串用法）
  return tables.some(row => row.name === table);
});

/**
 * 目标表输入框的占位文案，按当前能确定的事实说人话：
 * 读不到表清单就承认读不到，确认表不存在就直说是新表，别让用户以为只能从已有表里挑。
 */
const tablePlaceholder = computed(() => {
  if (tablesError.value) return "读取表清单失败，可直接输入表名";
  if (tableExists.value === false) return "新表名（首次运行自动建表）";
  return "选择目标表，或直接输入新表名";
});

/**
 * 把宿主的表清单归一化成表元数据。
 *
 * <p>宿主的 loadTables 允许返回 {@code string[]}（老实现）：那类项没有注释与类型，
 * 按「无注释」处理即可 —— 表下拉会退回显示真实表名，与改造前一致。</p>
 */
function toTableRows(rows: CollectTable[] | string[] | null | undefined): CollectTable[] {
  return (rows ?? []).map(row =>
    typeof row === "string" ? { name: row, comment: null, type: null } : row,
  );
}

async function loadTablesForActive(): Promise<void> {
  const key = activeTableKey.value;
  if (!tableParamName.value) return;
  if (tablesByKey.value[key]) return;
  if (!props.loadTables) return;
  tablesLoading.value = true;
  tablesError.value = null;
  try {
    const rows = await props.loadTables(activeDatasource.value || "app");
    tablesByKey.value = { ...tablesByKey.value, [key]: toTableRows(rows) };
  } catch (error) {
    tablesError.value = error instanceof Error ? error.message : String(error);
  } finally {
    tablesLoading.value = false;
  }
}

/** 列元数据：跟着「数据源 + 表」走 */
const columnsByKey = ref<Record<string, CollectColumn[]>>({});
const columnsLoading = ref(false);
const columnsError = ref<string | null>(null);

const activeColumnKey = computed(
  () => `${activeTableKey.value}|${activeTable.value}`,
);

const activeColumns = computed<CollectColumn[]>(
  () => columnsByKey.value[activeColumnKey.value] ?? [],
);

async function loadColumnsForActive(force = false): Promise<void> {
  const key = activeColumnKey.value;
  if (!mappingParamName.value || !activeTable.value) return;
  if (!props.loadColumns) return;
  // 表确认不存在时不去读列：读不到是必然结果，只会换来一次注定失败的请求和一条
  // 红色报错，把"运行时会自动建表"这件正常事显示成故障。直接给空候选即可。
  // 注意这段必须在缓存检查之前：读列先于表清单返回、失败后会把 [] 写进缓存（见下），
  // 若先查缓存，"确认不存在"的重新判定会在缓存处提前返回，报错永远留在界面上，
  // 映射编辑器会被错误态卡死（2026-10-08 用户实测：映射点不出来）。force 例外 ——
  // 建表 / 补列刚执行完时表清单是旧的，必须真读一次才知道新表的列。
  if (tableExists.value === false && !force) {
    columnsByKey.value = { ...columnsByKey.value, [key]: [] };
    columnsError.value = null;
    return;
  }
  if (!force && columnsByKey.value[key]) return;
  columnsLoading.value = true;
  columnsError.value = null;
  try {
    const columns = await props.loadColumns(activeDatasource.value || "app", activeTable.value);
    columnsByKey.value = { ...columnsByKey.value, [key]: columns };
  } catch (error) {
    // 表清单此刻明确确认表不存在：读列 409（表不存在或没有可见列）是必然结果，
    // 不是故障 —— 与上面非 force 的跳过同语义，清掉红条让映射编辑器进「新建表模式」。
    // force 也适用：force 是为了「建完表真读一次」，读失败即表确实还没建成，
    // 旧清单的「不存在」与实测一致；反过来清单说存在却读不到，才是数据源 / 权限类
    // 真故障，照常留红条（否则点一次「重新读取表结构」就永久卡红，见 2026-10-10 用户反馈：
    // 表不存在 → 红条 → 按提示重读 → force 绕过拦截又 409 → 死循环）。
    if (tableExists.value === false) {
      columnsByKey.value = { ...columnsByKey.value, [key]: [] };
      columnsError.value = null;
    } else {
      // 失败不写缓存：写进去（哪怕是 []）会让下一次重判在缓存处提前返回，
      // 报错状态就永远清不掉；不写则表清单随后到位、或用户点「重新读取」时都能再试。
      columnsError.value = error instanceof Error ? error.message : String(error);
    }
  } finally {
    columnsLoading.value = false;
  }
}

watch(
  // tableExists 也要进监听源：表清单是异步读回来的，它从"未知"变成"确认不存在"
  // 的那一刻，才知道该不该跳过读列。漏了它，表不存在时会先发一次注定失败的读列请求。
  [activeTableKey, activeColumnKey, tableExists, () => nodeForm.value?.id],
  () => {
    void loadTablesForActive();
    void loadColumnsForActive();
  },
  { immediate: true },
);

function writeNodePairs(param: CollectParamMeta, pairs: ParamPair[]): void {
  const form = nodeForm.value;
  if (!form) return;
  const owner: { params?: CollectParam[] } = { params: cloneParams(form.params) };
  replacePairs(owner, pairPrefix(param.name), pairs, param.label);
  form.params = owner.params ?? [];
  pushNode();
}

function writeFields(fields: CollectExtractField[]): void {
  const form = nodeForm.value;
  if (!form) return;
  form.fields = cloneFields(fields);
  pushNode();
}

/** shape → 专属表单组件；未登记的类型回落到通用表单，保证不漏节点类型 */
const FORM_BY_SHAPE: Record<string, Component> = {
  start: startForm,
  request: requestForm,
  extract: extractForm,
  link: linkForm,
  database: databaseForm,
  output: outputForm,
  sql: sqlForm,
  dedup: dedupForm,
  sleep: sleepForm,
  script: scriptForm,
  ai: aiForm,
  process: processForm,
  comment: commentForm,
  condition: conditionForm,
  end: endForm,
  // 数据录入：手工录行产出行数据流，建表走共享 CreateTableDialog
  entry: dataEntryForm,
  // 中间件读写四型共用一份表单，差异（数据源类型过滤）由 shape 前缀决定
  "influxdb-read": middlewareForm,
  "influxdb-write": middlewareForm,
  "neo4j-read": middlewareForm,
  "neo4j-write": middlewareForm,
};

/** 使用统一 Tab 外壳的节点类型；request 也走统一 Tab，script 已下线不参与 */
const SIMPLE_TABBED_SHAPES = new Set([
  "start",
  "request",
  "extract",
  "database",
  "sql",
  "link",
  "output",
  "dedup",
  "sleep",
  "ai",
  "process",
  "comment",
  "condition",
  "end",
  "entry",
  "influxdb-read",
  "influxdb-write",
  "neo4j-read",
  "neo4j-write",
]);

/** 当前节点该渲染的表单组件 */
const activeForm = computed<Component>(() =>
  nodeForm.value ? FORM_BY_SHAPE[nodeForm.value.shape] ?? genericForm : genericForm,
);

/**
 * 表单共享上下文。
 *
 * <p>数据源联动、下拉候选这些状态仍由 FlowDesigner 持有，打包成一个对象下发给各 shape 表单，
 * 避免每个表单各存一份导致状态不一致。</p>
 */
/**
 * 找某个节点的上游抓取地址，给元素拾取器预填。
 *
 * <p>只沿入边找一跳：采集编排里 extract 的上一跳就是 request，这是约定。找不到就返回空串，
 * 拾取器里由用户自己填 —— 不为了「猜得全」去遍历整张图，那样分支汇合时会给出让人意外的结果。</p>
 *
 * <p>值为 {@code ${url}} 这类占位符时**原样返回**：设计期解析不出种子 URL，
 * 与其猜一个值，不如把占位符摆出来让用户改成真地址。</p>
 *
 * @param nodeId 当前节点 id
 * @returns 上游抓取节点的 url 参数值；没有则空串
 */
function upstreamUrlOf(nodeId: string): string {
  const data = engine.value?.getData() ?? graphData.value;
  const incoming = data.edges.find(edge => edge.to === nodeId);
  if (!incoming) {
    return "";
  }
  const source = data.nodes.find(node => node.id === incoming.from);
  const params = (source?.data as NodeCanvas | undefined)?.params ?? [];
  return params.find(param => param.name === "url")?.value ?? "";
}

/**
 * 某类节点默认对外产出的变量名。
 *
 * <p>只登记执行器里**写死**的默认名（有源码依据），不猜：
 * 开始节点写 {@code url} 列表并别名到 {@code data}，SQL / 录入 / 中间件查询节点默认 {@code rows}。
 * 其余节点若没显式配「输出名」，就不列 —— 与其给一个不存在的变量，不如不给。</p>
 *
 * @param shape 节点类型
 * @returns 默认变量（变量名 + 用途说明）
 */
/**
 * 各 shape 的「隐含出参」——不写在 outputVariable 里、但运行期一定会出现在上下文中的变量。
 *
 * <p>此前这里只认 start 与 sql，其它 shape 一律返回空，于是请求节点的 {@code respJson} /
 * {@code respDoc}、抽取节点的 {@code row} / {@code rows}、判断节点的 {@code conditionResult}
 * 都不在占位清单里 —— 用户在内置示例里看到 {@code ${respJson}} 却找不到它从哪来
 * （它就是「出参变量名 + Json/Doc」，见 CollectRequestExecutor）。这里按真实产出补齐。</p>
 *
 * @param shape          节点类型
 * @param declaredOutput 该节点自己声明的出参变量名（可为空）
 * @returns 该 shape 的隐含出参列表
 */
function defaultOutputsOf(shape: string, declaredOutput = "", setNames: string[] = []): { name: string; desc: string }[] {
  if (shape === "start") {
    return [
      { name: "url", desc: "种子 URL 列表：${url} 整表、${url[0]} 首条、${url.size()} 取条数" },
      { name: "data", desc: "同 url（上一个节点的产出）" },
      { name: "dataJson", desc: "data 的 JSON 形态" },
    ];
  }
  if (shape === "sql" || shape === "entry" || shape === "influxdb-read" || shape === "neo4j-read") {
    return [
      { name: "rows", desc: shape === "entry" ? "录入结果行集合" : "查询结果行集合" },
      { name: "data", desc: "同 rows（上一个节点的产出）" },
      { name: "dataJson", desc: "data 的 JSON 形态" },
    ];
  }
  if (shape === "request") {
    // 出参变量名默认 resp，另外两个同伴变量都由它派生（见 CollectRequestExecutor）
    const out = declaredOutput.trim() || "resp";
    return [
      { name: `${out}Json`, desc: "响应体解析成 JSON 的对象（内容像 JSON 时才给出）" },
      { name: `${out}Doc`, desc: "已绑定 base 的 jsoup 文档，供 CSS / XPath 抽取" },
      { name: "url", desc: "本次请求的地址" },
      { name: "data", desc: "同 resp（上一个节点的产出）" },
      { name: "dataJson", desc: "data 的 JSON 形态" },
    ];
  }
  if (shape === "extract") {
    return [
      { name: "row", desc: "单条模式写出的「一行」（字段名 → 值）" },
      { name: "rows", desc: "列表模式写出的行集合" },
      { name: "data", desc: "同 rows / row（上一个节点的产出）" },
      { name: "dataJson", desc: "data 的 JSON 形态" },
    ];
  }
  if (shape === "condition") {
    return [
      { name: "conditionResult", desc: "判断结果（真 / 假），出边条件用它分流" },
      { name: "data", desc: "同 conditionResult（上一个节点的产出）" },
    ];
  }
  if (shape === "link") {
    // 与 CollectLinkExecutor 的 DEFAULT_OUTPUT 一致；用户改过出参名就按改过的来
    const out = declaredOutput.trim() || "linkList";
    return [
      { name: out, desc: "本页抽到的链接集合（可喂给下游循环）" },
      { name: "data", desc: "同链接集合（上一个节点的产出）" },
      { name: "dataJson", desc: "data 的 JSON 形态" },
    ];
  }
  if (shape === "exists") {
    return [
      { name: "data", desc: "查重结果：{ exists: 已存在键, fresh: 全新行, existsCount, freshCount, total }" },
      { name: "dataJson", desc: "data 的 JSON 形态" },
    ];
  }
  // 其余 shape 的变量要么不存在（sleep / comment / end / output 明确无出参），
  // 要么是内部暂存（database 的 _written/_cleared、dedup 的判重主键），故意不列 —— 列出只会变成噪音。
  return [];
}

/**
 * 本流程各节点对外产出的变量，作为「插入占位」的分组。
 *
 * <p>原先占位清单只有「全局变量 / 自定义函数」，用户配表达式时看不到本流程里
 * 上游节点产出的东西（如开始节点的 {@code url}、接口/抽取节点的输出变量），
 * 只能凭记忆手打 ${}。这里按当前编辑节点的**上游 / 其它**分成两组：
 * 上游在前（沿入边反向可达），并标出来自哪个节点，顺带解决「这变量哪来的」。</p>
 */
const flowVariableGroups = computed<PlaceholderGroup[]>(() => {
  const data = engine.value?.getData() ?? graphData.value;
  const nodes = (data.nodes ?? []) as unknown as { id: string; type?: string; label?: string; data?: NodeCanvas }[];
  const edges = (data.edges ?? []) as unknown as { from: string; to: string }[];
  const editingId = nodeForm.value?.id ?? "";

  // 上游集合：从当前节点沿入边反向广度优先
  const upstream = new Set<string>();
  if (editingId) {
    const queue: string[] = [editingId];
    while (queue.length) {
      const current = queue.shift() as string;
      for (const edge of edges) {
        if (edge.to === current && !upstream.has(edge.from)) {
          upstream.add(edge.from);
          queue.push(edge.from);
        }
      }
    }
  }

  const near: PlaceholderGroup["items"] = [];
  const far: PlaceholderGroup["items"] = [];
  for (const node of nodes) {
    // 本节点自己还没执行完，它的产出不该出现在自己的占位里
    if (node.id === editingId) {
      continue;
    }
    const canvas = (node.data ?? {}) as NodeCanvas;
    const params = canvas.params ?? [];
    const valueOf = (name: string): string =>
      String(params.find(param => param.name === name)?.value ?? "").trim();
    const nodeLabel = node.label || node.type || "节点";
    const bucket = upstream.has(node.id) ? near : far;
    const seen = new Set<string>();

    const push = (name: string, desc: string): void => {
      if (!name || seen.has(name)) {
        return;
      }
      seen.add(name);
      bucket.push({ name, description: desc });
    };

    const declared = valueOf("outputVariable");
    if (declared) {
      push(declared, `来自「${nodeLabel}」`);
    }
    // 变量节点的产出就是它 set: 声明的变量名 —— 先取出来再交给 defaultOutputsOf
    const setNames = params
      .map(item => String(item.name ?? ""))
      .filter(name => name.startsWith("set:"))
      .map(name => name.slice(4).trim())
      .filter(Boolean);
    for (const item of defaultOutputsOf(node.type ?? "", valueOf("outputVariable"), setNames)) {
      push(item.name, `${item.desc}（「${nodeLabel}」默认）`);
    }
    const loopIndex = valueOf("loopVariableName");
    if (loopIndex) {
      push(loopIndex, `迭代下标（「${nodeLabel}」）`);
    }
    const loopItem = valueOf("loopItemVariableName");
    if (loopItem) {
      push(loopItem, `迭代元素（「${nodeLabel}」）`);
    }
  }

  const groups: PlaceholderGroup[] = [];
  // 内置变量：与具体节点无关、引擎始终注入的那一批。放在最前，
  // 用户配表达式时第一眼就能看到 ${data} / ${env.xxx} / ${nodes.节点ID.字段}。
  groups.push({
    label: "内置变量",
    items: [
      { name: "data", description: "上一个节点的产出（所有节点通用）" },
      { name: "dataJson", description: "data 的 JSON 形态，引擎自动派生" },
      { name: "index", description: "逐条处理时的轮次（从 0 起）" },
      { name: "item", description: "逐条处理时当前那条数据" },
      { name: "url", description: "开始节点的种子 URL 列表（${url[0]} 首条）" },
      { name: "env.变量名", description: "流程变量（流程设置 → 流程变量里声明的）" },
      { name: "nodes.节点ID.字段", description: "跨节点 / 跨分支取任意节点的产出" },
    ],
  });
  if (near.length) {
    groups.push({ label: "上游节点变量", items: near });
  }
  if (far.length) {
    groups.push({ label: "其它节点变量", items: far });
  }
  return groups;
});

const formContext = computed<NodeFormContext>(() => ({
  // props.placeholderGroups 是可选的（宿主不注入时占位插入入口不出现），
  // 而 NodeFormContext.placeholderGroups 要求必填数组 —— 这里兜成空数组。
  // 直接透传会让 computed 的 getter 返回 undefined，TS2769。
  // 宿主注入的（全局变量 / 自定义函数）在前，本流程节点变量在后 ——
  // 后者随画布实时变化，位置靠后不影响前者稳定性。
  placeholderGroups: [...(props.placeholderGroups ?? []), ...flowVariableGroups.value],
  previewUrl: nodeForm.value ? upstreamUrlOf(nodeForm.value.id) : "",
  // fetchPreview 的第二参 timeoutMs 是可选的，函数整体可直接赋给只收 url 的签名；
  // 返回值 CollectPreviewPayload 与 PreviewPayload 字段一致，可直接赋值。
  loadPreview: (url: string): Promise<PreviewPayload> => fetchPreview(url),
  flowOptions: flowOptionsOf.value,
  datasourceOptions: datasourceOptionsOf.value,
  tableOptions: tableOptions.value,
  tablesLoading: tablesLoading.value,
  tablePlaceholder: tablePlaceholder.value,
  activeColumns: activeColumns.value,
  activeTable: activeTable.value,
  tableExists: tableExists.value,
  columnsLoading: columnsLoading.value,
  columnsError: columnsError.value,
  columnKey: activeColumnKey.value,
  refreshColumns: () => {
    // 建表 / 补列执行完回这里：表清单是存在性判断的唯一依据，只刷列不刷清单的话，
    // 「目标表尚不存在」的横幅会一直挂在刚建好的表上。先让本数据源的表清单缓存失效，
    // 列与清单一起重读 —— 「重新读取表结构」按钮也走这里，顺带把存在性修正过来。
    const key = activeTableKey.value;
    if (tablesByKey.value[key]) {
      const next = { ...tablesByKey.value };
      delete next[key];
      tablesByKey.value = next;
    }
    void loadTablesForActive();
    void loadColumnsForActive(true);
  },
  // 建表 / 补列不再经由上下文：两个表单各自用 @pages/datasource 的共享 CreateTableDialog，
  // 预览与执行由那个组件直连数据源中心，这里不再转发 DDL 回调。
  writeFields,
}));

function patchEdge(changes: Partial<EdgeForm>): void {
  const form = edgeForm.value;
  if (!form) return;
  Object.assign(form, changes);
  engine.value?.updateEdge(form.id, {
    kind: kindOf(form.exceptionFlow, form.condition),
    // 与初次渲染同口径：判断节点的出边显示真/假，否则显示条件原文
    label: edgeLabelOf(
      form,
      (engine.value?.getData() ?? graphData.value).nodes.find(item => item.id === form.from)?.type ?? "",
    ),
    transfer: form.transmitVariable,
    data: { condition: form.condition, exceptionFlow: form.exceptionFlow },
  });
}

function removeSelectedEdge(): void {
  const form = edgeForm.value;
  if (!form) return;
  engine.value?.removeEdges([form.id]);
  edgeForm.value = null;
}

/* -------------------------------- 画布事件 -------------------------------- */

function nameOf(nodeId: string): string {
  return engine.value?.getData().nodes.find(node => node.id === nodeId)?.label ?? nodeId;
}

/** 新建/粘贴进来的节点没有参数集，按元数据补一份默认值 */
function seedCanvasNodes(data: FlowGraphData): void {
  const eng = engine.value;
  if (!eng) return;
  data.nodes.forEach(node => {
    if ((node.data as NodeCanvas | undefined)?.params) return;
    const seed = seedOf(node.type);
    eng.updateNode(node.id, {
      data: { params: cloneParams(seed.params), fields: cloneFields(seed.fields) },
    });
  });
}

/** 画布上的就地改名与删除要同步回面板镜像 */
function syncForms(data: FlowGraphData): void {
  const form = nodeForm.value;
  if (form) {
    const node = data.nodes.find(item => item.id === form.id);
    if (!node) {
      nodeForm.value = null;
    } else if (node.label !== form.name) {
      form.name = node.label;
    }
  }
  const edge = edgeForm.value;
  if (edge && !data.edges.some(item => item.id === edge.id)) {
    edgeForm.value = null;
  }
}

/**
 * 刷新「画布上是否已有开始节点」。
 *
 * <p>以引擎数据为准（graphData 是灌图用的 prop，用户编辑后不会同步），引擎未就绪时退回 prop 数据。</p>
 */
function refreshStartPresence(): void {
  const data = engine.value?.getData() ?? graphData.value;
  hasStartNode.value = data.nodes.some(node => node.type === START_TYPE);
  // 同步刷新「钉住」坐标：图上没有的 id 要清掉，否则删掉再新建一个同 id 的 start 会用到旧坐标
  startPositions.clear();
  data.nodes.forEach(node => {
    if (node.type === START_TYPE) {
      startPositions.set(node.id, { x: node.x ?? 0, y: node.y ?? 0 });
    }
  });
}

/**
 * 拦截多余的开始节点。
 *
 * <p>后端 CollectGraph.checkStartEnd() 要求有且仅有一个 start；调色板已按 hasStartNode 隐藏「开始」项，
 * 但连续双击、复制粘贴等路径仍可能一次落进两个，这里兜底删掉新增的并给出中文提示。</p>
 *
 * @param data 本次 change 的图数据
 * @returns true 表示已回滚多余开始节点，本次改动不再标记为脏
 */
function rejectExtraStart(data: FlowGraphData): boolean {
  const starts = data.nodes.filter(node => node.type === START_TYPE);
  if (starts.length <= 1) {
    return false;
  }
  const extra = starts.slice(1).map(node => node.id);
  msgError("流程只能有一个开始节点，已阻止新增");
  applying = true;
  try {
    engine.value?.removeNodes(extra);
    if (nodeForm.value && extra.includes(nodeForm.value.id)) {
      nodeForm.value = null;
    }
  } finally {
    applying = false;
  }
  refreshStartPresence();
  return true;
}

function onGraphChange(data: FlowGraphData): void {
  if (applying) return;
  // 结构版本 +1：驱动 shapeIssues / overview 重算（引擎不回写 graphData prop）
  graphVersion.value += 1;
  if (!engine.value) {
    pending = false;
    return;
  }
  refreshStartPresence();
  applying = true;
  try {
    seedCanvasNodes(data);
    syncForms(data);
  } finally {
    applying = false;
  }
  if (pending) {
    pending = false;
    return;
  }
  // 程序化载入也会回抛 change（prop 同步一次、引擎直灌一次，且都在更晚的微任务里），
  // 用固定时间窗去抑制不可靠：窗口一过事件才到，页面就会莫名显示「未保存」。
  // 改成比对内容签名——和刚载入的那张图一样就视为程序行为，用户真编辑才会标脏。
  if (signatureOf(data) === loadedSignature) {
    return;
  }
  if (rejectExtraStart(data)) {
    return;
  }
  emit("change");
}

function onSelect(selection: FlowSelection): void {
  if (!selection) return;
  // 属性面板只有一块：选中节点显示节点参数，选中连线显示连线属性
  // （判断节点的真假分流条件在连线属性里编），不再有页签切换
  if (selection.kind === "node") {
    readNodeForm(selection.node);
  } else {
    readEdgeForm(selection.edge);
  }
}

/** 后端同样禁止环路，编辑期先挡住，免得保存时才报错 */
function onEdgeConnected(edge: FlowEdge): void {
  const eng = engine.value;
  if (!eng) return;
  const data = eng.getData();
  const cycle = hasCycle(
    data.nodes.map(node => ({ id: node.id, shape: node.type, params: [], fields: [] })),
    data.edges.map(item => ({ id: item.id, from: item.from, to: item.to })),
  );
  if (cycle) {
    eng.removeEdges([edge.id]);
    msgError(`流程存在环路：${cycle.join(" → ")}，循环请用节点的「循环集合 / 循环次数」参数表达`);
    return;
  }
  eng.updateEdge(edge.id, {
    kind: "normal",
    label: "",
    transfer: true,
    data: { condition: "", exceptionFlow: "0" },
  });
  readEdgeForm({ ...edge, kind: "normal", label: "", transfer: true, data: {} });
}

function onReady(instance: FlowGraphEngine): void {
  engine.value = instance;
  applying = true;
  try {
    seedCanvasNodes(instance.getData());
  } finally {
    applying = false;
  }
  // 引擎与数据谁先到是随机的（X6 初始化 vs 详情接口），两条路必须在这里汇合：
  // 只在 onReady 读 props.initialDsl 会在「引擎先到」时读到 null 而整个跳过，
  // 只在 watcher 里灌又会在「引擎未就绪」时被跳过——两者互相错开就永远画不出图。
  requestLoad(props.initialDsl ?? wantedDsl);
  applyStates();
  refreshStartPresence();
  lockStartPosition(instance);
}

/**
 * 记录 start 节点的位置，并锁死它。
 *
 * <p>需求：「只支持一个开始」+ 开始节点不允许再拖动。X6 的 `interacting.nodeMovable`
 * 是**整图级**的开关（源码 `CellView.can('nodeMovable')` 只读 `graph.options.interacting`，
 * 没有 per-node 的 draggable —— 本会话核过源码），所以没法定点禁止某一个节点。
 * 这里改成监听位置变更后把 start 弹回原位：改的是位置不是能力，但可观测结果一致
 * （节点拖不动），且不影响其它节点。</p>
 *
 * <p>在 `node:change:position` 上回弹而不是等 `change` 事件：后者要等松手才收尾，
 * 用户会看到节点被拖走再跳回来；前者在拖动过程中就顶回去。</p>
 *
 * @param instance 引擎实例
 */
function lockStartPosition(instance: FlowGraphEngine): void {
  instance.graph.on("node:change:position", ({ node }: { node: { getData?: () => { flowType?: string }; id: string; getPosition: () => { x: number; y: number }; setPosition: (x: number, y: number) => void } }) => {
    if (node.getData?.()?.flowType !== START_TYPE) {
      return;
    }
    const pinned = startPositions.get(node.id);
    if (!pinned) {
      return;
    }
    const now = node.getPosition();
    // 相等即短路：setPosition 会再次触发本事件，没有这个判断会无限递归
    if (now.x === pinned.x && now.y === pinned.y) {
      return;
    }
    node.setPosition(pinned.x, pinned.y);
  });
}

/**
 * 请求灌图：引擎没就绪就先记下来，就绪后补灌。
 *
 * <p>所有入口（挂载、props 变化、引擎就绪）都走它，保证任意到达顺序都能画出图。</p>
 *
 * @param dsl 待载入的流程图；空值忽略
 */
function requestLoad(dsl: CollectDsl | null | undefined): void {
  if (!dsl) {
    return;
  }
  wantedDsl = dsl;
  if (engine.value) {
    load(dsl);
    wantedDsl = null;
  }
}

/** 引擎未就绪时暂存的图，等 onReady 补灌 */
let wantedDsl: CollectDsl | null = null;

/** 挂载即请求灌图（引擎多半还没就绪，会先暂存） */
onMounted(() => {
  requestLoad(props.initialDsl);
});

function exportPng(): void {
  engine.value?.exportPNG(`${flow.value.name || "collect-flow"}.png`);
}

/* ------------------------------- 执行状态描边 ------------------------------- */

function stateText(nodeId: string): string {
  const state = props.states?.[nodeId];
  if (!state) return "";
  const label = STATE_LABELS[state.collectTaskLogStatus] ?? state.collectTaskLogStatus;
  const iteration = state.collectTaskLogIteration;
  // 与表格列同源：走 ReTime 的 formatDuration，空值不显示耗时段
  const cost = costMs(state.collectTaskLogCost);
  const costText = cost == null ? "" : ` · 耗时 ${formatDuration(cost)}`;
  const startText = state.createTime ? `开始 ${formatTime(state.createTime)}` : "";
  return `${label}${iteration == null ? "" : ` ×${Number(iteration) + 1}`}${costText}${startText ? ` · ${startText}` : ""}`;
}

/** 时间字段可能是 ISO / 时间戳 / 后端字符串，只取 HH:mm:ss 片段 */
function formatTime(value: string | number | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const text = String(value).trim();
    const match = text.match(/(\d{2}:\d{2}:\d{2})/);
    return match?.[1] ?? text.slice(0, 19);
  }
  return d.toTimeString().slice(0, 8);
}

/** 回放/校验状态只改节点边框数据并临时关掉历史记录，避免轮询状态污染撤销栈 */
function applyStates(): void {
  const eng = engine.value;
  if (!eng) return;
  applying = true;
  try {
    eng.graph.disableHistory();
    eng.getData().nodes.forEach(node => {
      const status = props.states?.[node.id]?.collectTaskLogStatus;
      // 执行前校验：类型未注册的节点标红（回放状态优先于校验标红）
      const unregistered = !status && !metaMap.value[node.type];
      if (status && STATE_RING[status]) {
        eng.updateNode(node.id, {
          strokeColor: STATE_RING[status],
          strokeWidth: 3,
          stateText: stateText(node.id),
          looping: node.id === props.loopingNodeId,
        });
      } else if (unregistered) {
        eng.updateNode(node.id, { strokeColor: "#f53f3f", strokeWidth: 3, stateText: "", looping: false });
      } else {
        eng.updateNode(node.id, { strokeColor: "", strokeWidth: 1.5, stateText: "", looping: false });
      }
    });
    eng.graph.enableHistory();
  } finally {
    applying = false;
  }
}

/** 推进线：执行轨迹上的边全部点亮（虚线动画），其余恢复常规样式 */
function applyActiveEdge(): void {
  const eng = engine.value;
  if (!eng) return;
  const active = new Set(props.activeEdgeIds ?? []);
  eng.getData().edges.forEach(edge => {
    eng.setEdgeActive(edge.id, active.has(edge.id));
  });
  // X6 在 setData 后异步建 view；刚灌完图就传 activeEdgeIds 时补一次，
  // 否则新图上的“执行轨迹虚线”要到下一次 cursor 变化才出现动画
  if (active.size) {
    window.setTimeout(applyActiveEdge, 0);
  }
}

watch(() => props.activeEdgeIds, applyActiveEdge, { deep: true });
// 当前执行/循环节点变化时重描边（蓝色虚线边框）
watch(() => props.loopingNodeId, applyStates);
// 后端执行器注册表变化（如重启后启用了 script）时重描边，未注册红标跟着刷新
watch(() => props.metas, applyStates, { deep: true });

/* --------------------------------- 对外接口 -------------------------------- */

function load(dsl: CollectDsl | null | undefined): void {
  const source = dsl ?? emptyDsl();
  const data = toGraphData(source);
  const signature = signatureOf(data);
  // 重复加载同一张图（onReady 和 watcher 都可能触发）时直接跳过，避免节点/边被灌成两份
  if (signature === loadedSignature && loadedSignature !== "") {
    return;
  }
  pending = true;
  flow.value = {
    name: source.name ?? null,
    threadCount: source.threadCount ?? null,
    timeoutMs: source.timeoutMs ?? null,
    headers: (source.headers ?? []).map(item => ({ ...item })),
    cookies: (source.cookies ?? []).map(item => ({ ...item })),
    variables: (source.variables ?? []).map(item => ({ ...item })),
  };
  timeoutText.value = formatTimeout(source.timeoutMs);
  nodeForm.value = null;
  edgeForm.value = null;
  // 两个分支都要写 graphData：ReFlowGraph 的「N 节点 / M 连线」统计只在 data prop
  // 变化时刷新（内部 syncStat），只调 engine.setData 会让画布有图而计数仍是 0（实测）。
  graphData.value = data;
  if (engine.value) {
    // 同时直灌内核：重复加载同一张图时结构签名没变，prop 那条路会被拦下
    engine.value.setData(data);
    applyStates();
    applyActiveEdge();
  }
  refreshStartPresence();
  // 载入即记录签名：随后引擎回抛的 change 会与它一致，onGraphChange 据此判定为程序行为
  loadedSignature = signature;
}

/**
 * 声明式图源：外部换了图就重灌。
 *
 * 引擎还没就绪时交给 requestLoad 暂存（onReady 会补灌），这里只管「图又变了」。
 */
watch(
  () => props.initialDsl,
  dsl => {
    requestLoad(dsl);
  },
);

function getGraph(): CollectDsl {
  const data = engine.value?.getData() ?? graphData.value;
  return {
    name: flow.value.name ?? null,
    threadCount: flow.value.threadCount ?? null,
    timeoutMs: flow.value.timeoutMs ?? null,
    headers: (flow.value.headers ?? []).map(item => ({ ...item })),
    cookies: (flow.value.cookies ?? []).map(item => ({ ...item })),
    variables: (flow.value.variables ?? []).map(item => ({ ...item })),
    nodes: data.nodes.map(toCollectNode),
    edges: data.edges.map(toCollectEdge),
  };
}

function addNode(shape: string, at?: { x: number; y: number }): void {
  if (!metaMap.value[shape]) {
    msgError(`节点类型未注册: ${shape}`);
    return;
  }
  if (shape === START_TYPE && hasStartNode.value) {
    msgError("流程只能有一个开始节点，已阻止新增");
    return;
  }
  engine.value?.addNode(shape, at?.x, at?.y);
}

function startWith(name: string): void {
  const dsl = emptyDsl(name);
  const start = metaMap.value.start;
  if (start) {
    dsl.nodes = [createNode(start, "n1", 150, 170)];
  }
  load(dsl);
}

function autoOptimize(): void {
  graphRef.value?.tidy?.();
  graphRef.value?.fit?.();
}

/** 回放追踪：把某个节点居中显示（engine.focusNode 透传） */
function focusNode(id: string | null | undefined): void {
  if (!id) return;
  engine.value?.focusNode(id);
}

defineExpose({ load, getGraph, addNode, startWith, shapeIssues, autoOptimize, focusNode });
</script>

<template>
  <div class="collect-flow" :style="compact ? { height: '100%', minHeight: '180px' } : undefined">
    <ReFlowGraph
      ref="graphRef"
      :data="graphData"
      :node-types="nodeTypes"
      :properties-title="panelTitle"
      :editable="!readonly"
      :readonly="readonly"
      start-type="start"
      end-type="end"
      @ready="onReady"
      @change="onGraphChange"
      @select="onSelect"
      @edge-connected="onEdgeConnected"
    >
      <template #toolbar>
        <ReButton icon="Camera" @click="exportPng">导出图片</ReButton>
      </template>

      <template #properties>
        <!--
          执行前校验警报：后端执行器未启用的节点类型在此列出。
          画布上对应节点同时标红；保存 / 运行由宿主（FlowView.graphOf）拦下，
          不让「设计器能编、执行才炸」的事再发生。
        -->
        <div v-if="shapeIssues.length" class="pane-alert">
          <b>以下节点类型未注册</b>（后端执行器未启用），删除或替换后才能保存执行：
          <ul>
            <li v-for="it in shapeIssues" :key="it.id">
              「{{ it.name }}」· {{ it.shape }}
            </li>
          </ul>
        </div>

        <!-- 节点参数：属性面板唯一常驻内容，选中节点即显示 -->
        <template v-if="nodeForm && selectedMeta">
          <NodeFormTabs
            v-if="SIMPLE_TABBED_SHAPES.has(nodeForm.shape)"
            :node="nodeForm"
            :meta="selectedMeta"
            :ctx="formContext"
            :active-form="activeForm"
            :state-text="stateText"
            :selected-state="selectedState"
            :rename-node="renameNode"
            @set-param="setParam"
            @set-pairs="writeNodePairs"
          />
          <div v-else class="pane-grid">
              <!-- 分节头（UI 稿）：基础信息 = 名称 / ID / 最近执行；其余表单归「类型配置」节 -->
              <SectionHead title="基础信息" />
              <div class="field">
                <div class="field-label">节点名称</div>
                <ReInput  :model-value="nodeForm.name" @update:model-value="renameNode"/>
              </div>
              <div class="field">
                <div class="field-label">
                  节点 ID / 类型
                  <el-tooltip
                    v-if="nodeInfoText"
                    :content="nodeInfoText"
                    placement="top"
                    :show-after="200"
                    :teleported="true"
                  >
                    <span class="label-tip"><ReIcon name="InfoFilled" :size="13" /></span>
                  </el-tooltip>
                </div>
                <ReInput
                  
                  disabled
                  :model-value="`${nodeForm.id} · ${selectedMeta.label}`"
                />
              </div>

              <div v-if="selectedState" class="field field-wide">
                <div class="field-label">最近执行</div>
                <span class="field-state" :class="`state-${selectedState.collectTaskLogStatus}`">
                  {{ stateText(nodeForm.id) }}
                  <em v-if="selectedState.collectTaskLogMessage">
                    {{ selectedState.collectTaskLogMessage }}
                  </em>
                </span>
              </div>

              <!-- 「${节点类型}配置」分节头：extract →「抽取配置」，恰合 UI 稿叫法 -->
              <SectionHead :title="`${selectedMeta.label}配置`" />

              <!-- 参数表单按 shape 拆成独立组件，写回仍走上面的 setParam / writeNodePairs / writeFields -->
              <component
                :is="activeForm"
                :node="nodeForm"
                :meta="selectedMeta"
                :ctx="formContext"
                @set-param="setParam"
                @set-pairs="writeNodePairs"
              />

              <!-- 状态条（UI 稿底栏）：左＝表达式体检实时结果；右＝如实说明「为什么没有保存/取消按钮」 -->
              <div class="pane-status">
                <span class="pane-status-flag" :class="exprIssue ? 'is-bad' : 'is-ok'">
                  {{ exprIssue ? `⚠ ${exprIssue}` : "✓ 表达式校验通过" }}
                </span>
                <span class="pane-status-hint">改动实时生效，随流程一起保存</span>
              </div>
            </div>
          </template>

          <!-- 连线属性：选中连线即显示（判断节点的真假分流条件在这里编） -->
          <div v-else-if="edgeForm" class="pane-grid">
              <div class="field">
                <div class="field-label">流转方向</div>
                <ReInput  disabled :model-value="edgeFlowText"/>
              </div>
              <div class="field" data-edge="exceptionFlow">
                <div class="field-label">触发时机</div>
                <ReSelect

                  class="pane-fill"
                  :model-value="edgeForm.exceptionFlow"
                  :options="EXCEPTION_OPTIONS"
                  @update:model-value="
                    (v: string | number | (string | number)[] | null) =>
                      patchEdge({ exceptionFlow: String(v ?? '0') })
                  "
                />
              </div>
              <div class="field field-wide" data-edge="condition">
                <div class="field-label">流转条件</div>
                <ReInput
                  type="textarea"
                  :rows="2"
                  placeholder="留空即总放行，如 ${rows.size() > 0}"
                  :model-value="edgeForm.condition"
                  @update:model-value="(v: unknown) => patchEdge({ condition: text(v) })"
                />
                <div class="field-tip">
                  条件为真是这条边放行的依据；上游节点失败时，只有「仅上游异常时流转」的红色边会走。
                </div>
              </div>
              <div class="field" data-edge="transmitVariable">
                <div class="field-label">传递上游变量</div>
                <ReSwitch
                  :model-value="edgeForm.transmitVariable"
                  @update:model-value="
                    (v: boolean | string | number) => patchEdge({ transmitVariable: v === true })
                  "
                />
              </div>
              <div class="field">
                <div class="field-label">连线操作</div>
                <ReButton  type="danger" plain @click="removeSelectedEdge">
                  删除这条连线
                </ReButton>
              </div>
            </div>

            <!--
              流程属性：未选中节点/连线时显示。含流程级运行超时——
              分片型大采集（如 GitHub 全量 1140 个分页请求）默认 30 分钟会被
              超时强制结束，这里可按需调大；留空表示用平台全局默认。
            -->
            <div v-else-if="!nodeForm && !edgeForm" class="pane-grid pane-grid--flow">
              <SectionHead title="流程属性" />
              <div class="field">
                <div class="field-label">运行超时（毫秒）</div>
                <ReInput
                  :model-value="timeoutText"
                  placeholder="留空 = 平台默认（30 分钟）"
                  @update:model-value="(v: unknown) => updateTimeout(text(v))"
                />
                <div class="field-tip">
                  单次运行最长毫秒，超时后任务判失败并停止。例：10800000 = 3 小时；
                  分片大采集（如 GitHub 全部项目）建议调大后再运行。
                </div>
              </div>
            </div>

            <!--
              选中了节点、但它的类型在后端没注册（执行器未启用）：没有参数
              定义可渲染，表单无处可放。明确告知原因与出路，不再误显示成
              「还没有选中节点」空态。
            -->
            <div v-else-if="nodeForm" class="pane-hint pane-hint--warn">
              该节点类型未注册（后端执行器未启用），参数无法编辑；删除或替换该节点后才能保存执行。
            </div>

            <!--
              空态（UI 稿）：虚线插画 + 主按钮 + 快捷键提示。
              没选中节点时表单无处可放，只留一句灰字太冷，这里给一条能立刻上手的出路：
              「全览流程节点」把整张图缩放进画布。
            -->
            <div v-else class="pane-empty">
              <svg class="pane-empty-art" viewBox="0 0 132 96" width="132" height="96" aria-hidden="true">
                <rect
                  x="14.5" y="18.5" width="86" height="58" rx="10"
                  fill="none" stroke="var(--el-color-primary)" stroke-width="1.6"
                  stroke-dasharray="7 5"
                />
                <rect x="38" y="34" width="30" height="6" rx="3" fill="var(--el-color-primary)" opacity=".45" />
                <rect x="28" y="48" width="56" height="6" rx="3" fill="var(--el-color-primary)" opacity=".22" />
                <circle cx="14.5" cy="47.5" r="4.5" fill="var(--el-bg-color)" stroke="var(--el-color-primary)" stroke-width="1.6" />
                <circle cx="100.5" cy="18.5" r="4.5" fill="var(--el-bg-color)" stroke="var(--el-color-primary)" stroke-width="1.6" />
                <circle cx="100.5" cy="76.5" r="4.5" fill="var(--el-bg-color)" stroke="var(--el-color-primary)" stroke-width="1.6" />
                <path d="M76 84l0 8 5-2.6 3.4 6.4 4-2.1-3.4-6.4 6.3-.6z" fill="var(--el-color-primary)" opacity=".9" />
              </svg>
              <div class="pane-empty-title">还没有选中节点</div>
              <p class="pane-empty-sub">
                点击画布中的节点即可编辑参数；双击节点可就地改名；<br />
                点击连线可编辑流转条件，按住节点边缘的圆点拖到另一节点即可连线
              </p>
              <div class="pane-empty-actions">
                <ReButton type="primary" class="pane-empty-btn" icon="View" @click="overviewAll">
                  全览流程节点
                </ReButton>
              </div>
              <div class="pane-empty-keys">
                <kbd>⌘</kbd>
                <kbd>A</kbd>
                <span>全选 · 双击改名</span>
                <i class="pane-empty-sep" />
                <kbd>Del</kbd>
                <span>删除</span>
              </div>
            </div>
      </template>

      <!--
        面板底栏（UI 稿「本流程概览」）：常驻在属性停靠区底部，不随表单滚动。
        节点 / 连线计数取 graphData —— 它由 onGraphChange 跟着内核 change 一起刷新；
        「最近保存」由宿主传入服务端时间，设计器不自己发请求。
      -->
      <template #properties-footer>
        <div class="overview">
          <div class="overview-head">
            <span class="overview-title">本流程概览</span>
            <span v-if="isSaved" class="overview-saved">
              <i class="overview-check" />
              已自动保存
            </span>
            <span v-else class="overview-saved is-draft">未保存</span>
          </div>
          <div class="overview-stats">
            <div class="overview-stat">
              <b>{{ overview.nodes }}</b>
              <span>流程节点</span>
            </div>
            <div class="overview-stat">
              <b>{{ overview.edges }}</b>
              <span>连线</span>
            </div>
            <div class="overview-stat">
              <b>{{ overview.savedAt }}</b>
              <span>最近保存</span>
            </div>
          </div>
        </div>
      </template>
    </ReFlowGraph>
  </div>
</template>

<style scoped>
.collect-flow {
  display: flex;
  flex: 1 1 auto;
  /* height 与 min-height 必须同时给：ReFlowGraph 的壳是 `height: 100%`，而百分比只在
     父级有**确定**高度时才解析。本组件原先只有 min-height（父 height 为 auto），
     壳回退成 auto → 只剩工具条高度 → .flow-main / .flow-canvas-wrap 塌成 0 →
     X6 画布没有布局盒，节点全部不可见（状态栏却照常显示「N 节点 / M 连线」）。
     宿主是弹层时必现：弹层给的是 flex:1 的自动高度，撑不开这条百分比链。 */
  height: 100%;
  min-height: 520px;
}

.collect-flow > * {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.pane-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 10px 14px;
  align-content: start;
}

/* 状态条（UI 稿底栏）：跨满整行，上分隔线；绿＝体检通过，橙＝首个问题 */
.pane-status {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 8px;
  margin-top: 2px;
  font-size: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.pane-status-flag {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  font-weight: 600;
}

.pane-status-flag.is-ok {
  color: var(--status-success);
}

.pane-status-flag.is-bad {
  color: var(--status-warning);
}

.pane-status-hint {
  flex: none;
  /* 长提示必须能换行，否则撑出横向滚动条 */
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
  color: var(--el-text-color-secondary);
}

/* 执行前校验警报：类型未注册的节点（后端执行器未启用） */
.pane-alert {
  grid-column: 1 / -1;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  word-break: break-word;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: 4px;
}

.pane-alert ul {
  margin: 4px 0 0;
  padding-left: 18px;
}

.field {
  min-width: 0;
}

.field-wide {
  grid-column: 1 / -1;
}

.field-label {
  margin-bottom: 3px;
  font-size: 12px;
  /* 写死的 #86909c 不跟随主题；改用 koi 体系令牌 */
  color: var(--el-text-color-secondary);
}

.req {
  margin-left: 2px;
  /* 写死的 #e5484d → danger 令牌 */
  color: var(--el-color-danger);
}

.pane-fill {
  width: 100%;
}

.field-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  /* 长说明 / 长表达式必须换行，否则撑出横向滚动条 */
  overflow-wrap: anywhere;
  word-break: break-word;
  /* 原为 #a3abb6：比任何主题令牌都浅，暗色下几乎不可读；secondary 是可访问性下限 */
  color: var(--el-text-color-secondary);
}

.field-tip code {
  padding: 0 3px;
  /* 原为 #4f7cff / #f2f6ff：改用主色令牌 */
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 3px;
}

.field-state {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  /* 失败信息可能很长，必须换行 */
  overflow-wrap: anywhere;
  word-break: break-word;
  /* 原为 #4e5969 / #f5f7fa：改用令牌 */
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 999px;
}

.field-state em {
  font-style: normal;
  color: var(--el-text-color-secondary);
}

.field-state.state-SUCCESS {
  /* 原为 #068a52 / #e8f8f0 */
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.field-state.state-FAILURE {
  /* 原为 #c9403f / #fff1f0 */
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.field-state.state-RUNNING {
  /* 原为 #2f5fd8 / #eef3ff */
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.pane-hint {
  padding: 18px 4px;
  font-size: 12px;
  /* 原为 #a4abb5：同 field-tip，secondary 为下限 */
  color: var(--el-text-color-secondary);
  text-align: center;
}

/* 未注册节点选中态：与顶部警报同因（执行器未启用），用警告色提示 */
.pane-hint--warn {
  padding: 12px 10px;
  /* secondary 太弱；同因警示信息提到 warning 令牌，与 .pane-alert 的 danger 区分层级 */
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-7);
  border-radius: 4px;
  overflow-wrap: anywhere;
  word-break: break-word;
  text-align: left;
}

/*
 * ===== 空态（UI 稿右侧栏「还没有选中节点」） =====
 * 没选中节点时表单无处可放。这里给插画 + 两条能立刻上手的出路（看全图 / 开流程设置）
 * + 一行快捷键提示，而不是只丢一句灰字。
 */
.pane-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 4px 8px;
  text-align: center;
}
.pane-empty-art {
  margin-bottom: 18px;
}
.pane-empty-title {
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.pane-empty-sub {
  margin: 0 0 22px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--el-text-color-secondary);
}
/* 两枚按钮各占满一行：面板最窄 300px，横排放不下两个带图标的按钮 */
.pane-empty-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.pane-empty-btn {
  width: 100%;
  height: 38px;
  margin: 0;
}
.pane-empty-keys {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 18px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pane-empty-keys kbd {
  min-width: 22px;
  padding: 2px 6px;
  font-family: inherit;
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-text-color-regular);
  text-align: center;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
}
.pane-empty-sep {
  width: 1px;
  height: 12px;
  margin: 0 4px;
  background: var(--el-border-color-lighter);
}

/*
 * ===== 面板底栏「本流程概览」（UI 稿） =====
 * 常驻底部：右栏拉到多宽都不至于看不见流程规模与保存状态。
 */
.overview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}
.overview-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.overview-saved {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-color-success);
}
.overview-saved.is-draft {
  color: var(--el-text-color-secondary);
}
.overview-check {
  width: 12px;
  height: 12px;
  background-color: currentcolor;
  /* 对勾：用两条边框拼出来，省一个图标字体 */
  clip-path: polygon(14% 44%, 0 60%, 40% 100%, 100% 22%, 84% 8%, 38% 68%);
  border-radius: 2px;
}
.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(78px, 1fr));
  gap: 8px;
}
.overview-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  text-align: center;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}
.overview-stat b {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.overview-stat span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
</style>
