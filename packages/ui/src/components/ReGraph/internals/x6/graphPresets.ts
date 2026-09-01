/**
 * Graph Presets — 每种图模式，对应一组默认配置
 *
 * ReGraph 通过 config 或 mode 选择预设，再与用户传入的 config 合并，
 * 从而设置不同的 X6 路由 / 连接器 / 工具栏等
 */
import { ReGraphMode } from "./types";
import type { ReGraphMode as ReGraphModeType, ReGraphToolbarOptions } from "./types";

export interface GraphPreset {
  mode: ReGraphMode;
  label: string;
  nodeWidth: number;
  nodeHeight: number;
  edgeRouter: "manhattan" | "orth" | "er" | "metro" | "normal";
  edgeConnector: "rounded" | "smooth" | "jumpover" | "normal";
  toolbar: Partial<ReGraphToolbarOptions>;
  layoutOpts: Record<string, unknown>;
}

export const GRAPH_PRESETS: Record<ReGraphMode, GraphPreset> = {
  [ReGraphMode.FORCE]: {
    mode: ReGraphMode.FORCE,
    label: "力导向",
    nodeWidth: 180,
    nodeHeight: 44,
    edgeRouter: "normal",
    edgeConnector: "rounded",
    toolbar: { search: true, layout: true, zoom: true, fit: true, history: true, importExport: true },
    layoutOpts: { repulsion: 400, distance: 140 },
  },
  [ReGraphMode.TREE]: {
    mode: ReGraphMode.TREE,
    label: "树形",
    nodeWidth: 180,
    nodeHeight: 44,
    edgeRouter: "orth",
    edgeConnector: "rounded",
    toolbar: { search: true, layout: true, zoom: true, fit: true },
    layoutOpts: { direction: "TB", rankdir: "TB" },
  },
  [ReGraphMode.MIND]: {
    mode: ReGraphMode.MIND,
    label: "思维导图",
    nodeWidth: 200,
    nodeHeight: 44,
    edgeRouter: "orth",
    edgeConnector: "smooth",
    toolbar: { search: true, layout: true, zoom: true, fit: true },
    layoutOpts: { direction: "LR" },
  },
  [ReGraphMode.CIRCLE]: {
    mode: ReGraphMode.CIRCLE,
    label: "环形",
    nodeWidth: 160,
    nodeHeight: 44,
    edgeRouter: "normal",
    edgeConnector: "rounded",
    toolbar: { search: true, zoom: true, fit: true },
    layoutOpts: { radius: 160 },
  },
  [ReGraphMode.CENTER]: {
    mode: ReGraphMode.CENTER,
    label: "中心辐射",
    nodeWidth: 180,
    nodeHeight: 44,
    edgeRouter: "normal",
    edgeConnector: "rounded",
    toolbar: { search: true, layout: true, zoom: true, fit: true },
    layoutOpts: { centerRadius: 170 },
  },
  [ReGraphMode.FIXED]: {
    mode: ReGraphMode.FIXED,
    label: "固定坐标",
    nodeWidth: 180,
    nodeHeight: 44,
    edgeRouter: "manhattan",
    edgeConnector: "rounded",
    toolbar: { search: true, zoom: true, fit: true, palette: true, minimap: true },
    layoutOpts: {},
  },
  [ReGraphMode.RELATION]: {
    mode: ReGraphMode.RELATION,
    label: "关系图",
    nodeWidth: 180,
    nodeHeight: 44,
    edgeRouter: "manhattan",
    edgeConnector: "rounded",
    toolbar: { search: true, zoom: true, fit: true, history: true },
    layoutOpts: {},
  },
};

export function resolvePreset(mode: ReGraphMode): GraphPreset {
  return GRAPH_PRESETS[mode] ?? GRAPH_PRESETS[ReGraphMode.FORCE];
}
