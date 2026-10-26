/**
 * 关系图组件模板：ReRelationGraph（G6 5.1.1 原生内核）
 *
 * 内置三国势力示例数据，开箱即可预览。
 * 实际业务参考数据格式：节点 `{ id, label, group, type, size }`，边 `{ source, target }`。
 */
import type { TemplateMeta } from "./types";
// 三国数据：ReRelationGraph 集成示例（按势力分组）
import { sanguoNodes, sanguoEdges } from "../data/sanguo";

/** ReRelationGraph 默认数据：三国势力分组（nodes: id/label/group/type/size，edges: source/target） */
export const relationGraphData = () => ({
  nodes: sanguoNodes.map((n) => ({
    id: n.id,
    label: n.id,
    group: n.data.cluster,
    type: n.data.type === "person" ? "circle" : n.data.type,
    size: n.style.size ?? 40,
  })),
  edges: sanguoEdges.map((e) => ({ source: e.source, target: e.target })),
});

/**
 * ReRelationGraph 布局可选项（与 packages/ui/src/components/ReRelationGraph/internals/layouts.ts
 * 的 LAYOUT_OPTIONS 保持一致；此处刻意重复一份静态清单，避免模板模块 eager import
 * 组件包把 G6（约 2MB）拉进调试页首屏）。
 */
const RELATION_GRAPH_LAYOUTS = [
  { label: "分组布局 group", value: "group", icon: "Files" },
  { label: "力导向 force", value: "force", icon: "Share" },
  { label: "D3 力导向 d3-force", value: "d3-force", icon: "Connection" },
  { label: "ForceAtlas2 force-atlas2", value: "force-atlas2", icon: "Aim" },
  { label: "Fruchterman fruchterman", value: "fruchterman", icon: "Compass" },
  { label: "环形 circular", value: "circular", icon: "RefreshRight" },
  { label: "同心圆 concentric", value: "concentric", icon: "Odometer" },
  { label: "网格 grid", value: "grid", icon: "Grid" },
  { label: "辐射 radial", value: "radial", icon: "Position" },
  { label: "MDS mds", value: "mds", icon: "Histogram" },
  { label: "Dagre 分层 dagre", value: "dagre", icon: "Sort" },
  { label: "AntV Dagre 分层 antv-dagre", value: "antv-dagre", icon: "SortDown" },
  { label: "Combo 组合 combo-combined", value: "combo-combined", icon: "Menu" },
  // 刻意不提供 snake：G6 的 snake 带 validate()，只接受单链，关系网络必然校验失败
  { label: "鱼骨 fishbone", value: "fishbone", icon: "DataLine" },
  { label: "紧凑树 compact-box", value: "compact-box", icon: "Share" },
  { label: "思维导图 mindmap", value: "mindmap", icon: "Share" },
  { label: "树状图 dendrogram", value: "dendrogram", icon: "Share" },
  { label: "缩进树 indented", value: "indented", icon: "Sort" },
  { label: "随机 random", value: "random", icon: "MagicStick" },
];

export const reRelationGraphMeta: TemplateMeta = {
  name: "ReRelationGraph",
  component: () => import("@repo/ui/re-relation-graph").then((m) => ({ default: m.default })),
  title: "关系图谱",
  description:
    "G6 5.1.1 原生：气泡集 / Hull 双分组轮廓 + 分组布局（每组独立区域）+ 19 种布局（含自研鱼骨）+ 内置工具栏（布局/分组/参数）+ 最短路径 / 撤销重做 / 节点内容插槽",
  modelable: false,
  props: [
    { key: "nodes", label: "节点（RelationNode[]）", type: "json", default: relationGraphData().nodes },
    { key: "edges", label: "边（RelationEdge[]）", type: "json", default: relationGraphData().edges },
    {
      key: "layout",
      label: "布局",
      type: "select",
      default: "group",
      description: "group = 分组布局（每组自动占据独立区域，推荐）",
      options: RELATION_GRAPH_LAYOUTS,
    },
    {
      key: "layoutOptions",
      label: "布局参数（layoutOptions）",
      type: "json",
      default: {},
      description:
        '分组布局支持 { "spacing": 100, "gap": 170, "minRadius": 70 }；其余布局透传 G6 参数',
    },
    {
      key: "groupType",
      label: "分组轮廓（groupType）",
      type: "select",
      default: "bubble",
      description: "bubble = 气泡集；hull = Hull 轮廓（凹包）；none = 不画轮廓",
      options: [
        { label: "气泡集 bubble-sets", value: "bubble", icon: "ChatDotRound" },
        { label: "Hull 轮廓 hull", value: "hull", icon: "Crop" },
        { label: "不分组 none", value: "none", icon: "Hide" },
      ],
    },
    {
      key: "groupVisible",
      label: "显示分组轮廓（groupVisible）",
      type: "boolean",
      default: true,
      description: "关掉只保留势力配色，不画轮廓",
    },
    {
      key: "groupOptions",
      label: "分组轮廓参数（groupOptions）",
      type: "json",
      default: {},
      description:
        'hull 支持 { "padding": 18, "concavity": 200 }；bubble 支持 { "nodeR1": 50 }；共用 { "fillOpacity": 0.16, "lineWidth": 2 }',
    },
    {
      key: "toolbar",
      label: "内置工具栏（toolbar）",
      type: "boolean",
      default: true,
      description: "图标 + Popover：布局 / 分组轮廓 / 分组开关 / 布局设置 / 最短路径 / 适应画布",
    },
    {
      key: "toolbarVariant",
      label: "工具栏外观（toolbarVariant）",
      type: "select",
      default: "pill",
      options: [
        { label: "胶囊 pill", value: "pill", icon: "Minus" },
        { label: "卡片 card", value: "card", icon: "Postcard" },
        { label: "侧轨 rail", value: "rail", icon: "Operation" },
      ],
    },
    {
      key: "nodeSize",
      label: "节点缺省尺寸（nodeSize）",
      type: "number",
      default: 40,
      min: 12,
      max: 80,
      step: 2,
      description: "节点数据里没写 size 时用这个直径",
    },
    { key: "minimap", label: "小地图（minimap）", type: "boolean", default: false },
    { key: "height", label: "高度", type: "string", default: "100%" },
  ],
};

export const graphTemplates: TemplateMeta[] = [reRelationGraphMeta];
