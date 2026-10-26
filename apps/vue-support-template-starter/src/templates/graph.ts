/**
 * 关系图组件模板：ReRelationGraph（G6 5.1.1 原生内核）
 *
 * 内置三国势力示例数据，开箱即可预览。
 * 实际业务参考数据格式：节点 `{ id, label, group, type, size }`，边 `{ source, target }`。
 */
import type { TemplateMeta } from "./types";
// 关系图示例数据：三国势力 / 小圈子 / 压力测试（三档规模，分段切换）
import { relationGraphDatasets, defaultDataset } from "../data/relationGraphDatasets";

/**
 * ReRelationGraph 默认数据：三国势力分组（nodes: id/label/group/type/size，edges: source/target）
 *
 * @deprecated 数据已由 {@link relationGraphDatasets} 统一管理，此处仅保留兼容入口
 */
export const relationGraphData = () => ({
  nodes: defaultDataset.nodes,
  edges: defaultDataset.edges,
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
    {
      key: "dataset",
      label: "示例数据",
      type: "dataset",
      default: defaultDataset.label,
      description: "点一下直接换图，不用再手贴 JSON",
      datasets: relationGraphDatasets.map((d) => ({
        label: d.label,
        hint: d.hint,
        values: { nodes: d.nodes, edges: d.edges },
      })),
    },
    {
      key: "nodes",
      label: "节点（RelationNode[]）",
      type: "json",
      default: defaultDataset.nodes,
      advanced: true,
      description:
        "无需手填：由上方「示例数据」自动写入。仅在要试自定义结构时才展开改。每个节点：{ id 唯一标识, label 显示文字, group 分组名（决定配色与轮廓）, type 形状（circle / rect …）, size 直径 }",
    },
    {
      key: "edges",
      label: "边（RelationEdge[]）",
      type: "json",
      default: defaultDataset.edges,
      advanced: true,
      description:
        "无需手填：由上方「示例数据」自动写入。每条边：{ source 起点 id, target 终点 id }，两端都必须指向已存在的节点 id，否则该边会被 G6 丢弃",
    },
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
