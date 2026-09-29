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
 * 按固定顺序取参数字段：先循环四参数，再按 names 给出的专属参数，最后兜底 meta 里的其余参数。
 *
 * <p>循环参数由后端追加在所有节点参数之前，这里显式排在表单最前，与后端下发顺序一致；
 * 末段兜底保证后端新增参数时不会从表单里漏掉。</p>
 *
 * @param meta  该 shape 的参数元数据
 * @param names 该表单专属参数名，按期望展示顺序
 * @returns 排好序的参数元数据列表
 */
export function orderedParams(meta: CollectShapeMeta, names: string[]): CollectParamMeta[] {
  const find = (name: string): CollectParamMeta | undefined =>
    (meta.params ?? []).find(item => item.name === name);
  const fill = (list: string[]): CollectParamMeta[] =>
    list.map(find).filter((item): item is CollectParamMeta => Boolean(item));
  const used = new Set([...LOOP_PARAM_NAMES, ...names]);
  const rest = (meta.params ?? []).filter(item => !used.has(item.name));
  return [...fill(LOOP_PARAM_NAMES), ...fill(names), ...rest];
}

/**
 * shape 表单的取数工具：给出专属参数顺序后，返回排好序的参数元数据与按参数名读值/读组的方法。
 *
 * @param node  当前节点的表单镜像（getter，保持响应式）
 * @param meta  该 shape 的参数元数据（getter，保持响应式）
 * @param names 该表单专属参数名，按期望展示顺序
 * @returns fields 排好序的参数元数据；valueOf 读单个参数值；pairsOfParam 读 pairs / mapping 组
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
