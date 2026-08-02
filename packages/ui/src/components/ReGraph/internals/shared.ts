/**
 * ReGraph 系列组件共享类型与默认值
 *
 * 每个 ReGraph* 子组件（Force / Mind / Tree 等）共用一套
 * 数据/事件接口，这里集中声明，避免重复。
 */
import type { JsonLine, JsonNode, RGJsonData, RGOptions } from "@relation-graph/vue3";

/** 通用 props：所有 ReGraph* 子组件都具备 */
export interface ReGraphBaseProps {
  /** 节点/连线数据 */
  data?: RGJsonData;
  /** 节点列表（与 data.nodes 二选一） */
  nodes?: JsonNode[];
  /** 连线列表（与 data.lines 二选一） */
  lines?: JsonLine[];
  /** 图配置（会与默认配置合并） */
  options?: RGOptions;
  /** 容器高度 */
  height?: string | number;
  /** 容器宽度 */
  width?: string | number;
  /** 是否显示调试信息 */
  debug?: boolean;
  /** 是否启用编辑模式 */
  editable?: boolean;
}

/** 默认值 */
export const ReGraphDefaults = {
  height: "100%",
  width: "100%",
  debug: false,
  editable: false,
} as const;

/** 容器样式计算 */
export function buildContainerStyle(width: string | number, height: string | number): Record<string, string> {
  return {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };
}

/** 合并数据：data 优先，否则组装 nodes/lines */
export function buildFinalData(
  data: RGJsonData | undefined,
  nodes: JsonNode[] | undefined,
  lines: JsonLine[] | undefined,
): RGJsonData {
  if (data) return data;
  return {
    rootId: "",
    nodes: nodes ?? [],
    lines: lines ?? [],
  } as RGJsonData;
}
