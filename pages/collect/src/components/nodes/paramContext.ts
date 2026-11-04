/**
 * 节点属性表单的公共契约与取数工具。
 *
 * <p>FlowDesigner 只负责画布与写回；每个 shape 的表单组件从 meta 里挑出本节点的专属参数，
 * 通过事件把「参数名 + 新值」回传，写回仍然集中在 FlowDesigner，避免两处状态不一致。</p>
 */
import { computed } from "vue";
import { pairPrefix, pairsOf } from "../../utils/dsl";
import type { ParamPair } from "../../utils/dsl";
import type {
  CollectColumn,
  CollectExtractField,
  CollectParam,
  CollectParamMeta,
  CollectShapeMeta,
} from "../../types/collect";

/** 节点在属性面板里的表单镜像（与 FlowDesigner 的 nodeForm 同构） */
export interface NodeForm {
  id: string;
  shape: string;
  name: string;
  params: CollectParam[];
  fields: CollectExtractField[];
}

/** 占位字段（插入时会被包成 `${name}`），结构与 RePlaceholderPicker 的 groups 一致 */
export interface PlaceholderField {
  name: string;
  description?: string;
  sample?: string;
}

/** 占位字段分组，如「全局变量」「自定义函数」 */
export interface PlaceholderGroup {
  label: string;
  items: PlaceholderField[];
}

/** 所有可执行节点共用的循环四参数，由后端 CollectShapeMetas.loopParams() 统一追加 */
export const LOOP_PARAM_NAMES: string[] = [
  "loopCount",
  "loopVariableName",
  "loopItemVariableName",
  "loopParallel",
];

/**
 * 高级配置参数名：低频、与「这个节点干什么」无关的运行时开关，只在「高级配置」页签展示。
 *
 * <p>属性面板页签化之后，这份名单同时被 NodeFormTabs（决定有没有「高级配置」页签）
 * 和各 shape 的输入参数过滤（把高级参数从「输入参数」页签摘出去）使用 —— 两处必须是**同一份**，
 * 否则会出现「页签存在但里面是空的」或「同一个参数在两个页签各出现一次」。</p>
 */
export const ADVANCED_PARAM_NAMES: string[] = [
  "timeout",
  "timeoutPolicy",
  "retry",
  "retryInterval",
  "proxy",
  "userAgent",
  "fetcher",
  "saveDocument",
  "batchSize",
  "onBatchError",
  "writeBack",
  "outputPrefix",
  "maxTokens",
  "temperature",
];

/**
 * 是否循环四参数（由 LoopFields 分节统一渲染，不进字段流）。
 *
 * @param name 参数名
 * @returns 是则 true
 */
export function isLoopParamName(name: string): boolean {
  return LOOP_PARAM_NAMES.includes(name);
}

/**
 * 是否高级配置参数。
 *
 * @param name 参数名
 * @returns 是则 true
 */
export function isAdvancedParamName(name: string): boolean {
  return ADVANCED_PARAM_NAMES.includes(name);
}

/**
 * 是否输出参数（出参变量名 / 字段映射三组）。
 *
 * @param name 参数名
 * @returns 是则 true
 */
export function isOutputParamName(name: string): boolean {
  return (
    name === "outputVariable" ||
    name.startsWith("column:") ||
    name.startsWith("cell:") ||
    name.startsWith("key:")
  );
}

/**
 * 是否「输入参数」页签里的参数：既不是输出参数、也不是高级配置、也不是循环四参数。
 *
 * <p>数据库节点的 {@code datasource / table / mode} 例外：它们在 NodeFormTabs 里归「输出参数」
 * （与字段映射同组），所以由 NodeParamForm 自己按 shape 再摘一次，这里不特判。</p>
 *
 * @param param 参数元数据
 * @returns 是则 true
 */
export function isInputParam(param: CollectParamMeta): boolean {
  return (
    !isLoopParamName(param.name) &&
    !isAdvancedParamName(param.name) &&
    !isOutputParamName(param.name)
  );
}

/**
 * 不参与循环的 shape（结构节点本身不执行迭代）。
 *
 * <p>循环四参数不再进表单字段流（由 LoopFields 分节统一渲染），
 * 这三个 shape 连分节都不该出现——后端 metas 对它们本就不下发 loop 参数，
 * 此处再兜一层，防止 metas 口径变化把「循环」刷回开始/结束/注释节点。</p>
 */
export const NON_LOOP_SHAPES: string[] = ["start", "end", "comment"];

/** 预览抓取载荷，与 ReElementPicker 的 loader 返回形状一致 */
export interface PreviewPayload {
  /** HTTP 状态码 */
  status: number;
  /** 响应 Content-Type，可空 */
  contentType?: string | null;
  /** 正文字符数，可空 */
  length?: number;
  /** 正文原文 */
  html: string;
}

/** 表单共享上下文：下拉候选、表/列联动状态与刷新回调，由 FlowDesigner 统一提供 */
export interface NodeFormContext {
  /** 可用于插入的占位字段分组（全局变量 / 自定义函数 / 内置函数等），空数组即不显示插入入口 */
  placeholderGroups: PlaceholderGroup[];
  /** 元素拾取器的预填地址：当前节点的上游抓取节点 URL；空串则拾取器里由用户自己填 */
  previewUrl: string;
  /** 元素拾取器的加载器；缺省时不显示「选取」入口（拾取器自身不发 HTTP） */
  loadPreview?: (url: string) => Promise<PreviewPayload>;
  /** flow 类型下拉候选 */
  flowOptions: { value: string; label: string }[];
  /** datasource 类型下拉候选 */
  datasourceOptions: { value: string; label: string }[];
  /** table 类型候选表清单 */
  tableOptions: { value: string; label: string }[];
  /** 表清单加载态 */
  tablesLoading: boolean;
  /** 表输入框占位文案 */
  tablePlaceholder: string;
  /** mapping 类型左列候选列 */
  activeColumns: CollectColumn[];
  /** mapping 类型当前目标表 */
  activeTable: string;
  /** 目标表是否存在：null=未知，true=存在，false=确认不存在 */
  tableExists: boolean | null;
  /** 列元数据加载态 */
  columnsLoading: boolean;
  /** 读列失败原因 */
  columnsError: string | null;
  /** 「数据源 + 表」联动 key，mapping 组件据此重建 */
  columnKey: string;
  /** 重新读取列元数据 */
  refreshColumns: () => void;
  /** 写回抽取字段（仅 extract 等带 fieldEditor 的节点使用），实现仍在 FlowDesigner */
  writeFields: (fields: CollectExtractField[]) => void;
}

/**
 * 取本 shape 可用的循环四参数元数据；start / end / comment 返回空数组。
 *
 * <p>LoopFields 分节用它决定渲染与否：循环不再混在字段流里（用户问「节点的循环是啥
 * 干啥的」时被循环参数挤在表单头部误导），改为独立「循环迭代」分节展示。</p>
 *
 * @param meta 该 shape 的参数元数据
 * @returns 循环四参数中该 shape 实际下发的那些（保持后端声明顺序）
 */
export function loopParamsOf(meta: CollectShapeMeta): CollectParamMeta[] {
  if (NON_LOOP_SHAPES.includes(meta.shape)) return [];
  const names = new Set(LOOP_PARAM_NAMES);
  return (meta.params ?? []).filter(item => names.has(item.name));
}

/**
 * 按固定顺序取参数字段：先本节点自身参数，再其余后端参数；必填项整体前置。
 *
 * <p>顺序依据是「用户最该先填的东西排最前」（用户反馈「必填的放到最上面啊」）：
 * 必填前置对 own 与 rest 全量生效——同组内保持后端声明顺序，只把必填项整体提到前面；
 * 可选项按原序跟在后面。循环四参数不再进字段流（loopParamsOf → LoopFields 分节），
 * 曾被旧参数挤到中间的节点必填项（开始节点的种子 URL、输出节点的字段映射）不再被挤走。</p>
 *
 * @param meta  该 shape 的参数元数据
 * @param names 该表单专属参数名，按期望展示顺序
 * @returns 排好序的参数元数据列表（不含循环四参数）
 */
export function orderedParams(
  meta: CollectShapeMeta,
  names: string[],
): CollectParamMeta[] {
  const find = (name: string): CollectParamMeta | undefined =>
    (meta.params ?? []).find(item => item.name === name);
  const fill = (list: string[]): CollectParamMeta[] =>
    list.map(find).filter((item): item is CollectParamMeta => Boolean(item));
  const used = new Set([...LOOP_PARAM_NAMES, ...names]);
  // 末段兜底保证后端新增参数时不会从表单里漏掉（循环参数已剥离，不再占位）
  const rest = (meta.params ?? []).filter(item => !used.has(item.name));
  const all = [...fill(names), ...rest];
  // 必填前置：own 与 rest 全量稳定前置——声明顺序不变，只把必填项整体提到最前
  return [...all.filter(item => item.required), ...all.filter(item => !item.required)];
}

/**
 * shape 表单的取数工具：给出专属参数顺序后，返回排好序的参数元数据与按参数名读值/读组的方法。
 *
 * @param node  当前节点的表单镜像（getter，保持响应式）
 * @param meta  该 shape 的参数元数据（getter，保持响应式）
 * @param names 该表单专属参数名，按期望展示顺序
 * @returns fields 排好序的参数元数据（不含循环四参数）；valueOf 读单个参数值；pairsOfParam 读 pairs / mapping 组
 */
export function useShapeFieldList(
  node: () => NodeForm,
  meta: () => CollectShapeMeta,
  names: string[],
) {
  const fields = computed(() => orderedParams(meta(), names));
  const valueOf = (name: string): string => node().params.find(item => item.name === name)?.value ?? "";
  const pairsOfParam = (name: string): ParamPair[] => pairsOf({ params: node().params }, pairPrefix(name));
  return { fields, valueOf, pairsOfParam };
}
