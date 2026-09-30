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
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTab from "@repo/ui/re-tab";
import { formatDuration } from "@repo/ui/re-time";
import { costMs } from "@repo/utils";
import PairsEditor from "./PairsEditor.vue";
import commentForm from "./nodes/commentForm.vue";
import conditionForm from "./nodes/conditionForm.vue";
import databaseForm from "./nodes/databaseForm.vue";
import dedupForm from "./nodes/dedupForm.vue";
import endForm from "./nodes/endForm.vue";
import extractForm from "./nodes/extractForm.vue";
import genericForm from "./nodes/genericForm.vue";
import linkForm from "./nodes/linkForm.vue";
import outputForm from "./nodes/outputForm.vue";
import processForm from "./nodes/processForm.vue";
import requestForm from "./nodes/requestForm.vue";
import scriptForm from "./nodes/scriptForm.vue";
import sleepForm from "./nodes/sleepForm.vue";
import sqlForm from "./nodes/sqlForm.vue";
import startForm from "./nodes/startForm.vue";
import variableForm from "./nodes/variableForm.vue";
import {
  createNode,
  emptyDsl,
  hasCycle,
  indexMetas,
  pairPrefix,
  replacePairs,
} from "../utils/dsl";
import type { ParamPair } from "../utils/dsl";
import type { NodeForm, NodeFormContext, PlaceholderGroup, DdlPreviewPayload } from "./nodes/paramContext";
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
  loadTables?: (datasource: string) => Promise<string[]>;
  /** 读某张表的列元数据，供字段映射控件用 */
  loadColumns?: (datasource: string, table: string) => Promise<CollectColumn[]>;
  /** 预览建表 / 补列 DDL；未传时不显示「建表 / 补列」入口 */
  previewDdl?: (request: {
    datasource: string;
    table: string;
    columns: string[];
    primaryKey: string[];
  }) => Promise<DdlPreviewPayload>;
  /** 执行建表 / 补列；未传时不显示「建表 / 补列」入口 */
  executeDdl?: (request: {
    datasource: string;
    table: string;
    columns: string[];
    primaryKey: string[];
  }) => Promise<DdlPreviewPayload>;
}>();

const emit = defineEmits<{ (event: "change"): void }>();

type TabKey = "node" | "edge" | "flow";

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
 */
const TABS: { name: TabKey; label: string; disabled?: boolean }[] = [
  { name: "node", label: "节点参数" },
  { name: "edge", label: "连线" },
  { name: "flow", label: "流程设置", disabled: true },
];

const graphData = ref<FlowGraphData>({ nodes: [], edges: [] });
const flow = ref<FlowLevel>(emptyDsl());
const engine = shallowRef<FlowGraphEngine | null>(null);
const tab = ref<TabKey>("node");
const nodeForm = ref<NodeForm | null>(null);
const edgeForm = ref<EdgeForm | null>(null);

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

const nodeTypes = computed<FlowNodeTypeDef[]>(() =>
  props.metas
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

  const flowOptionsOf = computed(() =>
    (props.flowOptions ?? []).map(item => ({ value: item.value, label: item.label })),
  );

  /** 数据源候选同样要摊成 ReOption：CollectOption 是 interface，没有隐式索引签名 */
  const datasourceOptionsOf = computed(() =>
    (props.datasourceOptions ?? []).map(item => ({ value: item.value, label: item.label })),
  );

const panelTitle = computed(() => {
  if (nodeForm.value) return "节点参数";
  return edgeForm.value ? "连线属性" : "流程属性";
});

const selectedState = computed(() =>
  nodeForm.value ? props.states?.[nodeForm.value.id] ?? null : null,
);

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
  return /false/.test(raw) ? "假" : "真";
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
    edges: (dsl.edges ?? []).map(edge => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      kind: kindOf(edge.exceptionFlow, edge.condition),
      label: edgeLabelOf(edge, (dsl.nodes ?? []).find(item => item.id === edge.from)?.shape ?? ""),
      transfer: edge.transmitVariable !== false,
      data: { condition: text(edge.condition), exceptionFlow: edge.exceptionFlow || "0" },
    })),
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
const tablesByKey = ref<Record<string, string[]>>({});
const tablesLoading = ref(false);
const tablesError = ref<string | null>(null);

const activeTableKey = computed(
  () => `${nodeForm.value?.id ?? "-"}|${activeDatasource.value || "app"}`,
);

const tableOptions = computed(() => (tablesByKey.value[activeTableKey.value] ?? []).map(name => ({ value: name, label: name })));

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
  return tables.includes(table);
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

async function loadTablesForActive(): Promise<void> {
  const key = activeTableKey.value;
  if (!tableParamName.value) return;
  if (tablesByKey.value[key]) return;
  if (!props.loadTables) return;
  tablesLoading.value = true;
  tablesError.value = null;
  try {
    tablesByKey.value = { ...tablesByKey.value, [key]: await props.loadTables(activeDatasource.value || "app") };
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
  if (!force && columnsByKey.value[key]) return;
  if (!props.loadColumns) return;
  // 表还不存在时不去读列：读不到是必然结果，只会换来一次注定失败的请求和一条
  // 红色报错，把"运行时会自动建表"这件正常事显示成故障。直接给空候选即可。
  if (tableExists.value === false) {
    columnsByKey.value = { ...columnsByKey.value, [key]: [] };
    columnsError.value = null;
    return;
  }
  columnsLoading.value = true;
  columnsError.value = null;
  try {
    const columns = await props.loadColumns(activeDatasource.value || "app", activeTable.value);
    columnsByKey.value = { ...columnsByKey.value, [key]: columns };
  } catch (error) {
    columnsByKey.value = { ...columnsByKey.value, [key]: [] };
    columnsError.value = error instanceof Error ? error.message : String(error);
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
  variable: variableForm,
  database: databaseForm,
  output: outputForm,
  sql: sqlForm,
  dedup: dedupForm,
  sleep: sleepForm,
  script: scriptForm,
  process: processForm,
  comment: commentForm,
  condition: conditionForm,
  end: endForm,
};

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
 * 开始节点写 {@code urlList} 与首条 {@code url}，SQL 节点默认 {@code rows}。
 * 其余节点若没显式配「输出变量名」，就不列 —— 与其给一个不存在的变量，不如不给。</p>
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
function defaultOutputsOf(shape: string, declaredOutput = ""): { name: string; desc: string }[] {
  if (shape === "start") {
    return [
      { name: "urlList", desc: "种子 URL 集合" },
      { name: "url", desc: "首条种子 URL" },
    ];
  }
  if (shape === "sql") {
    return [{ name: "rows", desc: "查询结果行集合" }];
  }
  if (shape === "request") {
    // 出参变量名默认 resp，另外两个同伴变量都由它派生（见 CollectRequestExecutor）
    const out = declaredOutput.trim() || "resp";
    return [
      { name: `${out}Json`, desc: "响应体解析成 JSON 的对象（内容像 JSON 时才给出）" },
      { name: `${out}Doc`, desc: "已绑定 base 的 jsoup 文档，供 CSS / XPath 抽取" },
      { name: "url", desc: "本次请求的地址" },
    ];
  }
  if (shape === "extract") {
    return [
      { name: "row", desc: "单条模式写出的「一行」（字段名 → 值）" },
      { name: "rows", desc: "列表模式写出的行集合" },
    ];
  }
  if (shape === "condition") {
    return [{ name: "conditionResult", desc: "判断结果（真 / 假），出边条件用它分流" }];
  }
  return [];
}

/**
 * 本流程各节点对外产出的变量，作为「插入占位」的分组。
 *
 * <p>原先占位清单只有「全局变量 / 自定义函数」，用户配表达式时看不到本流程里
 * 上游节点产出的东西（如开始节点的 {@code urlList}、接口/抽取节点的输出变量），
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
    for (const item of defaultOutputsOf(node.type ?? "", valueOf("outputVariable"))) {
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
    void loadColumnsForActive(true);
  },
  // 建表 / 补列：宿主实现（FlowView 调数据源中心的 DDL 接口），未传时表单不显示该入口
  previewDdl: props.previewDdl,
  executeDdl: props.executeDdl,
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

function listPairs(field: "headers" | "cookies" | "variables"): ParamPair[] {
  return (flow.value[field] ?? []).map(item => ({ key: item.name, value: item.value ?? "" }));
}

function writeListPairs(field: "headers" | "cookies" | "variables", pairs: ParamPair[]): void {
  flow.value[field] = pairs
    .filter(pair => pair.key.trim() !== "")
    .map(pair => ({ name: pair.key.trim(), value: pair.value ?? "", description: null }));
  emit("change");
}

function patchFlow(changes: Partial<FlowLevel>): void {
  flow.value = { ...flow.value, ...changes };
  emit("change");
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
  if (selection.kind === "node") {
    readNodeForm(selection.node);
    tab.value = "node";
  } else {
    // 切到「连线」页签：流转条件（真假分流）就在这里编辑，判断节点的出边依赖它
    readEdgeForm(selection.edge);
    tab.value = "edge";
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
  tab.value = "edge";
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
  const costText = cost == null ? "" : ` ${formatDuration(cost)}`;
  return `${label}${iteration == null ? "" : ` ×${Number(iteration) + 1}`}${costText}`;
}

/** 描边只改 attrs 并临时关掉历史记录，避免轮询状态污染撤销栈 */
function applyStates(): void {
  const eng = engine.value;
  if (!eng) return;
  applying = true;
  try {
    eng.graph.disableHistory();
    eng.getData().nodes.forEach(node => {
      const status = props.states?.[node.id]?.collectTaskLogStatus;
      eng.graph.getCellById(node.id)?.setAttrs(
        {
          badge: {
            stroke: (status && STATE_RING[status]) || "#ffffff",
            strokeWidth: status ? 3 : 1.5,
          },
        } as never,
      );
    });
    eng.graph.enableHistory();
  } finally {
    applying = false;
  }
}

watch(() => props.states, applyStates, { deep: true });

/* --------------------------------- 对外接口 -------------------------------- */

function load(dsl: CollectDsl | null | undefined): void {
  const source = dsl ?? emptyDsl();
  pending = true;
  flow.value = {
    name: source.name ?? null,
    threadCount: source.threadCount ?? null,
    headers: (source.headers ?? []).map(item => ({ ...item })),
    cookies: (source.cookies ?? []).map(item => ({ ...item })),
    variables: (source.variables ?? []).map(item => ({ ...item })),
  };
  nodeForm.value = null;
  edgeForm.value = null;
  // 「流程设置」页签已停用，载入后停在「节点参数」页签
  tab.value = "node";
  const data = toGraphData(source);
  // 两个分支都要写 graphData：ReFlowGraph 的「N 节点 / M 连线」统计只在 data prop
  // 变化时刷新（内部 syncStat），只调 engine.setData 会让画布有图而计数仍是 0（实测）。
  graphData.value = data;
  if (engine.value) {
    // 同时直灌内核：重复加载同一张图时结构签名没变，prop 那条路会被拦下
    engine.value.setData(data);
    applyStates();
  }
  refreshStartPresence();
  // 载入即记录签名：随后引擎回抛的 change 会与它一致，onGraphChange 据此判定为程序行为
  loadedSignature = signatureOf(data);
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

defineExpose({ load, getGraph, addNode, startWith });
</script>

<template>
  <div class="collect-flow">
    <ReFlowGraph
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
        <ReTab v-model="tab" :tabs="TABS" variant="capsule">
          <template #node>
            <div v-if="nodeForm && selectedMeta" class="pane-grid">
              <div class="field">
                <div class="field-label">节点名称</div>
                <ReInput  :model-value="nodeForm.name" @update:model-value="renameNode"/>
              </div>
              <div class="field">
                <div class="field-label">节点 ID / 类型</div>
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

              <!--
                通用说明只在「没有专属表单、回落到 genericForm」时显示。
                15 个 shape 现在都有自己的 .node-intro（讲得更准），再叠一块就重复了；
                保留这条是为了将来后端新增 shape 时前端仍有基本说明。
              -->
              <div
                v-if="!FORM_BY_SHAPE[nodeForm.shape] && (selectedMeta.description || selectedMeta.outputVariable)"
                class="field field-wide"
              >
                <div v-if="selectedMeta.description" class="field-tip">{{ selectedMeta.description }}</div>
                <div v-if="selectedMeta.outputVariable" class="field-tip">
                  {{ selectedMeta.outputVariable }}
                </div>
              </div>

              <!-- 参数表单按 shape 拆成独立组件，写回仍走上面的 setParam / writeNodePairs / writeFields -->
              <component
                :is="activeForm"
                :node="nodeForm"
                :meta="selectedMeta"
                :ctx="formContext"
                @set-param="setParam"
                @set-pairs="writeNodePairs"
              />
            </div>
            <div v-else class="pane-hint">
              点击画布中的节点即可编辑参数；双击节点可就地改名
            </div>
          </template>

          <template #edge>
            <div v-if="edgeForm" class="pane-grid">
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
            <div v-else class="pane-hint">
              点击画布中的连线即可编辑条件；按住节点边缘的圆点拖到另一个节点即可连线
            </div>
          </template>

          <template #flow>
            <div class="pane-grid">
              <div class="field">
                <div class="field-label">流程名称</div>
                <ReInput
                  
                  maxlength="128"
                  placeholder="随 DSL 一起保存"
                  :model-value="flow.name ?? ''"
                  @update:model-value="(v: unknown) => patchFlow({ name: text(v) })"
                />
              </div>
              <div class="field">
                <div class="field-label">流程线程数</div>
                <ReInputNumber
                  :controls="false"
                  
                  :min="1"
                  :max="64"
                  placeholder="留空用全局默认"
                  :model-value="flow.threadCount ?? undefined"
                  @update:model-value="(v: number | undefined) => patchFlow({ threadCount: v ?? null })"
                />
              </div>
              <div class="field">
                <div class="field-label">全局请求头</div>
                <PairsEditor
                  :model-value="listPairs('headers')"
                  key-placeholder="Header 名"
                  @update:model-value="(v: ParamPair[]) => writeListPairs('headers', v)"
                />
              </div>
              <div class="field">
                <div class="field-label">全局 Cookie</div>
                <PairsEditor
                  :model-value="listPairs('cookies')"
                  key-placeholder="Cookie 名"
                  @update:model-value="(v: ParamPair[]) => writeListPairs('cookies', v)"
                />
              </div>
              <div class="field field-wide">
                <div class="field-label">流程变量</div>
                <PairsEditor
                  :model-value="listPairs('variables')"
                  key-placeholder="变量名"
                  value-placeholder="值 / ${表达式}"
                  @update:model-value="(v: ParamPair[]) => writeListPairs('variables', v)"
                />
                <div class="field-tip">
                  变量名需匹配 [A-Za-z_][A-Za-z0-9_]{0,63}，下游节点用 <code>${变量名}</code> 引用。
                  表达式三种写法：<code>${md5(x)}</code>、宿主在前面的 <code>${resp.selector('a').attr('href')}</code>、
                  带命名空间的 <code>${string.substring(s, 1, 4)}</code>，都解析到同一张内置函数表。
                  读取详情时这里含全局变量，不必覆盖的条目请删掉再保存，否则会被固化为本流程变量。
                </div>
              </div>
            </div>
          </template>
        </ReTab>
      </template>
    </ReFlowGraph>
  </div>
</template>

<style scoped>
.collect-flow {
  display: flex;
  flex: 1 1 auto;
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

.field {
  min-width: 0;
}

.field-wide {
  grid-column: 1 / -1;
}

.field-label {
  margin-bottom: 3px;
  font-size: 12px;
  color: #86909c;
}

.req {
  margin-left: 2px;
  color: #e5484d;
}

.pane-fill {
  width: 100%;
}

.field-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  color: #a3abb6;
}

.field-tip code {
  padding: 0 3px;
  color: #4f7cff;
  background: #f2f6ff;
  border-radius: 3px;
}

.field-state {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  color: #4e5969;
  background: #f5f7fa;
  border-radius: 999px;
}

.field-state em {
  font-style: normal;
  color: #a3abb6;
}

.field-state.state-SUCCESS {
  color: #068a52;
  background: #e8f8f0;
}

.field-state.state-FAILURE {
  color: #c9403f;
  background: #fff1f0;
}

.field-state.state-RUNNING {
  color: #2f5fd8;
  background: #eef3ff;
}

.pane-hint {
  padding: 18px 4px;
  font-size: 12px;
  color: #a4abb5;
  text-align: center;
}
</style>
