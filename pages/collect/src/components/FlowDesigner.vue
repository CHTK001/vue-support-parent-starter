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
import { computed, ref, shallowRef, watch } from "vue";
import { msgError } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReFlowGraph from "@repo/ui/re-flow-graph";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTab from "@repo/ui/re-tab";
import FieldTable from "./FieldTable.vue";
import MappingEditor from "./MappingEditor.vue";
import PairsEditor from "./PairsEditor.vue";
import {
  createNode,
  emptyDsl,
  hasCycle,
  indexMetas,
  pairPlaceholder,
  pairPrefix,
  pairsOf,
  replacePairs,
} from "../utils/dsl";
import type { ParamPair } from "../utils/dsl";
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
   */
  readonly?: boolean;
  /** 最近一次任务的逐节点执行状态，用来给画布节点描边 */
  states?: Record<string, CollectTaskLog>;
  /** 子流程节点可选的流程，未传时 flow 参数退回手填流程ID */
  flowOptions?: CollectOption[];
  /** 数据源下拉候选，首项固定是应用主库 */
  datasourceOptions?: CollectOption[];
  /** 读某个数据源的表清单；未传时 table 参数退回手填表名 */
  loadTables?: (datasource: string) => Promise<string[]>;
  /** 读某张表的列元数据，供字段映射控件用 */
  loadColumns?: (datasource: string, table: string) => Promise<CollectColumn[]>;
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

interface NodeForm {
  id: string;
  shape: string;
  name: string;
  params: CollectParam[];
  fields: CollectExtractField[];
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

const TABS = [
  { name: "node", label: "节点参数" },
  { name: "edge", label: "连线" },
  { name: "flow", label: "流程设置" },
];

/** 同一个枚举值在不同参数里语义不同（all 在"继承上游变量"里是全部继承，在"变量回写"里是全部回写），按参数名覆盖 */
const OPTION_LABELS: Record<string, string> = {
  "0": "否",
  "1": "是",
  branch: "仅本分支",
  global: "写入全局",
  flow: "本流程",
  task: "本次任务",
  single: "单条抽取",
  list: "列表抽行",
};

const PARAM_OPTION_LABELS: Record<string, string> = {
  "inherit:all": "全部继承",
  "inherit:none": "不继承",
  "writeBack:changed": "仅回写改动",
  "writeBack:all": "全部回写",
  "writeBack:none": "不回写",
};

const graphData = ref<FlowGraphData>({ nodes: [], edges: [] });
const flow = ref<FlowLevel>(emptyDsl());
const engine = shallowRef<FlowGraphEngine | null>(null);
const tab = ref<TabKey>("flow");
const nodeForm = ref<NodeForm | null>(null);
const edgeForm = ref<EdgeForm | null>(null);

/** 整体灌图后的第一个 change 来自内核 setData，不算用户改动 */
let pending = true;
/** 补默认参数、状态描边期间产生的 change 同样不算改动 */
let applying = false;

const metaMap = computed(() => indexMetas(props.metas));

const nodeTypes = computed<FlowNodeTypeDef[]>(() =>
  props.metas.map(meta => ({
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

function optionLabel(param: CollectParamMeta, value: string): string {
  return PARAM_OPTION_LABELS[`${param.name}:${value}`] ?? OPTION_LABELS[value] ?? value;
}

/** ReSelect 吃的是对象字面量数组，自定义接口不能直接赋值，故逐项新建 */
function optionsOf(param: CollectParamMeta): { value: string; label: string }[] {
  return (param.options ?? []).map(item => ({ value: item, label: optionLabel(param, item) }));
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
      label: condLabel(edge.condition),
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

function paramNumber(name: string): number | undefined {
  const value = paramOf(name);
  return value === "" ? undefined : Number(value);
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
  [activeTableKey, activeColumnKey, () => nodeForm.value?.id],
  () => {
    void loadTablesForActive();
    void loadColumnsForActive();
  },
  { immediate: true },
);

function nodePairs(param: CollectParamMeta): ParamPair[] {
  return pairsOf({ params: nodeForm.value?.params }, pairPrefix(param.name));
}

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

function patchEdge(changes: Partial<EdgeForm>): void {
  const form = edgeForm.value;
  if (!form) return;
  Object.assign(form, changes);
  engine.value?.updateEdge(form.id, {
    kind: kindOf(form.exceptionFlow, form.condition),
    label: condLabel(form.condition),
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

function onGraphChange(data: FlowGraphData): void {
  if (applying) return;
  if (!engine.value) {
    pending = false;
    return;
  }
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
  emit("change");
}

function onSelect(selection: FlowSelection): void {
  if (!selection) return;
  if (selection.kind === "node") {
    readNodeForm(selection.node);
    tab.value = "node";
  } else {
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
  applyStates();
}

function exportPng(): void {
  engine.value?.exportPNG(`${flow.value.name || "collect-flow"}.png`);
}

/* ------------------------------- 执行状态描边 ------------------------------- */

function stateText(nodeId: string): string {
  const state = props.states?.[nodeId];
  if (!state) return "";
  const label = STATE_LABELS[state.collectTaskLogStatus] ?? state.collectTaskLogStatus;
  const iteration = state.collectTaskLogIteration;
  const cost = state.collectTaskLogCost == null ? "" : ` ${state.collectTaskLogCost}ms`;
  return `${label}${iteration == null ? "" : ` ×${Number(iteration) + 1}`}${cost}`;
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
  tab.value = "flow";
  const data = toGraphData(source);
  // 两个分支都要写 graphData：ReFlowGraph 的「N 节点 / M 连线」统计只在 data prop
  // 变化时刷新（内部 syncStat），只调 engine.setData 会让画布有图而计数仍是 0（实测）。
  graphData.value = data;
  if (engine.value) {
    // 同时直灌内核：重复加载同一张图时结构签名没变，prop 那条路会被拦下
    engine.value.setData(data);
    applyStates();
  }
  // 上面两条路都会触发 change（一次来自 prop 同步、一次来自直灌），所以不能靠
  // 「第一个 change 吞掉」那套：那样第二个 change 会被当成用户编辑，打开弹窗就显示
  // 「未保存」（实测）。这里改成整段宏任务内都算程序行为，任务结束统一放行；
  // 顺带修掉「载入空图时没有 change 事件、pending 永远为 true，用户第一次真编辑被吞」。
  setTimeout(() => {
    pending = false;
  }, 0);
}

/**
 * 声明式图源：外部换了图就重灌。
 *
 * 引擎还没就绪时不在这里灌——onReady 会补灌一次（见 initialDsl 的说明），
 * 这里只处理「引擎已就绪、图又变了」的情况（弹窗里切换采集器、预览换流程）。
 */
watch(
  () => props.initialDsl,
  dsl => {
    if (dsl && engine.value) {
      load(dsl);
    }
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
      :readonly="readonly"
      :show-palette="!readonly"
      :show-properties="!readonly"
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
                <ReInput size="small" :model-value="nodeForm.name" @update:model-value="renameNode"/>
              </div>
              <div class="field">
                <div class="field-label">节点 ID / 类型</div>
                <ReInput
                  size="small"
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

              <div
                v-if="selectedMeta.description || selectedMeta.outputVariable"
                class="field field-wide"
              >
                <div v-if="selectedMeta.description" class="field-tip">{{ selectedMeta.description }}</div>
                <div v-if="selectedMeta.outputVariable" class="field-tip">
                  {{ selectedMeta.outputVariable }}
                </div>
              </div>

              <div
                v-for="param in selectedMeta.params"
                :key="param.name"
                  :class="[
                    'field',
                    {
                      'field-wide':
                        param.type === 'textarea' ||
                        param.type === 'pairs' ||
                        param.type === 'mapping' ||
                        param.type === 'table',
                    },
                  ]"
                :data-param="param.name"
              >
                <div class="field-label">
                  {{ param.label }}<span v-if="param.required" class="req">*</span>
                </div>

                <ReInput
                  v-if="param.type === 'textarea'"
                  type="textarea"
                  :rows="3"
                  :placeholder="param.tip || ''"
                  :model-value="paramOf(param.name)"
                  @update:model-value="(v: unknown) => setParam(param, v)"
                />
                <ReInputNumber
                  v-else-if="param.type === 'number'"
                  :controls="false"
                  size="small"
                  :placeholder="param.tip || ''"
                  :model-value="paramNumber(param.name)"
                  @update:model-value="(v: number | undefined) => setParam(param, v)"
                />
                <ReSwitch
                  v-else-if="param.type === 'switch'"
                  :model-value="paramOf(param.name) === '1'"
                  @update:model-value="(v: boolean | string | number) => setParam(param, v ? '1' : '0')"
                />
                <ReSelect
                  v-else-if="param.type === 'select'"
                  size="small"
                  class="pane-fill"
                  :placeholder="param.tip || '请选择'"
                  :model-value="paramOf(param.name)"
                  :options="optionsOf(param)"
                  @update:model-value="
                    (v: string | number | (string | number)[] | null) => setParam(param, v)
                  "
                />
                <ReSelect
                  v-else-if="param.type === 'flow' && flowOptionsOf.length"
                  size="small"
                  filterable
                  clearable
                  class="pane-fill"
                  placeholder="选择子流程"
                  :model-value="paramOf(param.name)"
                  :options="flowOptionsOf"
                  @update:model-value="
                    (v: string | number | (string | number)[] | null) => setParam(param, v)
                  "
                />
                  <ReSelect
                    v-else-if="param.type === 'datasource'"
                    size="small"
                    filterable
                    class="pane-fill"
                    placeholder="选择数据源"
                    :model-value="paramOf(param.name) || param.defaultValue || ''"
                    :options="datasourceOptionsOf"
                    @update:model-value="
                      (v: string | number | (string | number)[] | null) => setParam(param, v)
                    "
                  />
                  <ReSelect
                    v-else-if="param.type === 'table'"
                    size="small"
                    filterable
                    clearable
                    class="pane-fill"
                    :loading="tablesLoading"
                    :placeholder="tablesError ? '读取表清单失败，可直接输入表名' : '选择目标表'"
                    :model-value="paramOf(param.name)"
                    :options="tableOptions"
                    @update:model-value="
                      (v: string | number | (string | number)[] | null) => setParam(param, v)
                    "
                  />
                  <MappingEditor
                    v-else-if="param.type === 'mapping'"
                    :key="`${nodeForm.id}:${param.name}:${activeColumnKey}`"
                    :model-value="nodePairs(param)"
                    :columns="activeColumns"
                    :table="activeTable"
                    :loading="columnsLoading"
                    :load-error="columnsError"
                    :on-refresh="() => loadColumnsForActive(true)"
                    @update:model-value="(v: ParamPair[]) => writeNodePairs(param, v)"
                  />
                  <PairsEditor
                    v-else-if="param.type === 'pairs'"
                  :key="`${nodeForm.id}:${param.name}`"
                  :model-value="nodePairs(param)"
                  :key-placeholder="pairPlaceholder(param.name)"
                  value-placeholder="值 / ${表达式}"
                  @update:model-value="(v: ParamPair[]) => writeNodePairs(param, v)"
                />
                <ReInput
                  v-else
                  size="small"
                  :placeholder="param.tip || ''"
                  :model-value="paramOf(param.name)"
                  @update:model-value="(v: unknown) => setParam(param, v)"
                />
                <div v-if="param.tip && param.type !== 'textarea'" class="field-tip">
                  {{ param.tip }}
                </div>
              </div>

              <div v-if="selectedMeta.fieldEditor" class="field field-wide">
                <div class="field-label">抽取字段</div>
                <FieldTable :model-value="nodeForm.fields" @update:model-value="writeFields"/>
              </div>
            </div>
            <div v-else class="pane-hint">
              点击画布中的节点即可编辑参数；双击节点可就地改名
            </div>
          </template>

          <template #edge>
            <div v-if="edgeForm" class="pane-grid">
              <div class="field">
                <div class="field-label">流转方向</div>
                <ReInput size="small" disabled :model-value="edgeFlowText"/>
              </div>
              <div class="field" data-edge="exceptionFlow">
                <div class="field-label">触发时机</div>
                <ReSelect
                  size="small"
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
                <ReButton size="small" type="danger" plain @click="removeSelectedEdge">
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
                  size="small"
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
                  size="small"
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
