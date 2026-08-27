/**
 * Graph Presets —— 每种图形（布局）一份默认配置
 *
 * ReGraph 通用 config 通过 mode 选择预设，再与用户传入的 config 合并，
 * 从而调用不同的 X6 组件 / 布局 / 样式。
 */
import type { ReGraphMode, ReGraphToolbarOptions } from "./types";

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
  force: {
    mode: "force",
    label: "力导向",
    nodeWidth: 180,
    nodeHeight: 44,
    edgeRouter: "normal",
    edgeConnector: "rounded",
    toolbar: { search: true, layout: true, zoom: true, fit: true, history: true, importExport: true },
    layoutOpts: { repulsion: 400, distance: 140 },
  },
  tree: {
    mode: "tree",
    label: "树形",
    nodeWidth: 180,
    nodeHeight: 44,
    edgeRouter: "orth",
    edgeConnector: "rounded",
    toolbar: { search: true, layout: true, zoom: true, fit: true },
    layoutOpts: { direction: "TB", rankdir: "TB" },
  },
  mind: {
    mode: "mind",
    label: "思维导图",
    nodeWidth: 200,
    nodeHeight: 44,
    edgeRouter: "orth",
    edgeConnector: "smooth",
    toolbar: { search: true, layout: true, zoom: true, fit: true },
    layoutOpts: { direction: "LR" },
  },
  circle: {
    mode: "circle",
    label: "环形",
    nodeWidth: 160,
    nodeHeight: 44,
    edgeRouter: "normal",
    edgeConnector: "rounded",
    toolbar: { search: true, zoom: true, fit: true },
    layoutOpts: { radius: 160 },
  },
  center: {
    mode: "center",
    label: "中心辐射",
    nodeWidth: 180,
    nodeHeight: 44,
    edgeRouter: "normal",
    edgeConnector: "rounded",
    toolbar: { search: true, layout: true, zoom: true, fit: true },
    layoutOpts: { centerRadius: 170 },
  },
  fixed: {
    mode: "fixed",
    label: "固定坐标",
    nodeWidth: 180,
    nodeHeight: 44,
    edgeRouter: "manhattan",
    edgeConnector: "rounded",
    toolbar: { search: true, zoom: true, fit: true, palette: true, minimap: true },
    layoutOpts: {},
  },
  relation: {
    mode: "relation",
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
  return GRAPH_PRESETS[mode] ?? GRAPH_PRESETS.force;
}
