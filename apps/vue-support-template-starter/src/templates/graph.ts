/**
 * 关系图组件模板：ReGraph / ReGraphForce / ReGraphTree / ReGraphCenter / ReGraph3D
 *
 * 每个模板都内置典型示例数据，开箱即可预览。
 * 实际业务可参考示例数据格式（JsonNode / JsonLine / Graph3DData）。
 */
import type { TemplateMeta } from "./types";
// 三国数据：ReRelationGraphV2 集成示例（44 节点按势力分组）
import { sanguoNodes, sanguoEdges } from "../data/sanguo";

/** ReRelationGraphV2 默认数据：三国势力分组（nodes: id/label/group/type/size，edges: source/target） */
export const relationGraphV2Data = () => ({
  nodes: sanguoNodes.map((n) => ({
    id: n.id,
    label: n.id,
    group: n.data.cluster,
    type: n.data.type === "person" ? "circle" : n.data.type,
    size: n.style.size ?? 40,
  })),
  edges: sanguoEdges.map((e) => ({ source: e.source, target: e.target })),
});

// ============================================================
// 示例数据 —— 各布局演示用
// ============================================================

/** 力导向示例：社交网络 */
export const forceGraphData = {
  rootId: "alice",
  nodes: [
    { id: "alice", text: "Alice", groupId: "core" },
    { id: "bob", text: "Bob", groupId: "core" },
    { id: "carol", text: "Carol", groupId: "team" },
    { id: "david", text: "David", groupId: "team" },
    { id: "eve", text: "Eve", groupId: "team" },
    { id: "frank", text: "Frank", groupId: "team" },
    { id: "grace", text: "Grace", groupId: "team" },
    { id: "heidi", text: "Heidi", groupId: "team" },
    { id: "ivan", text: "Ivan", groupId: "team" },
    { id: "judy", text: "Judy", groupId: "team" },
    { id: "mallory", text: "Mallory", groupId: "team" },
    { id: "oscar", text: "Oscar", groupId: "team" },
    { id: "peggy", text: "Peggy", groupId: "team" },
    { id: "trent", text: "Trent", groupId: "team" },
  ],
  lines: [
    { from: "alice", to: "bob", text: "friend" },
    { from: "alice", to: "carol", text: "colleague" },
    { from: "alice", to: "david", text: "colleague" },
    { from: "bob", to: "eve", text: "knows" },
    { from: "bob", to: "frank", text: "knows" },
    { from: "carol", to: "grace", text: "manager" },
    { from: "carol", to: "heidi", text: "manager" },
    { from: "david", to: "ivan", text: "mentor" },
    { from: "david", to: "judy", text: "mentor" },
    { from: "eve", to: "mallory", text: "knows" },
    { from: "frank", to: "oscar", text: "knows" },
    { from: "grace", to: "peggy", text: "manages" },
    { from: "heidi", to: "trent", text: "manages" },
    { from: "ivan", to: "mallory", text: "knows" },
    { from: "judy", to: "oscar", text: "knows" },
    { from: "peggy", to: "trent", text: "knows" },
  ],
};

/** 树形示例：组织架构 */
export const treeGraphData = {
  rootId: "ceo",
  nodes: [
    { id: "ceo", text: "总经理" },
    { id: "cto", text: "技术总监" },
    { id: "cfo", text: "财务总监" },
    { id: "cmo", text: "运营总监" },
    { id: "fe", text: "前端组" },
    { id: "be", text: "后端组" },
    { id: "ops", text: "运维组" },
    { id: "fe-lead", text: "前端 Leader" },
    { id: "fe-dev1", text: "前端开发" },
    { id: "fe-dev2", text: "前端开发" },
    { id: "be-lead", text: "后端 Leader" },
    { id: "be-dev1", text: "后端开发" },
    { id: "be-dev2", text: "后端开发" },
    { id: "ops-lead", text: "运维 Leader" },
    { id: "ops-eng", text: "运维工程师" },
    { id: "finance", text: "财务部" },
    { id: "hr", text: "人事部" },
    { id: "market", text: "市场部" },
  ],
  lines: [
    { from: "ceo", to: "cto" },
    { from: "ceo", to: "cfo" },
    { from: "ceo", to: "cmo" },
    { from: "cto", to: "fe" },
    { from: "cto", to: "be" },
    { from: "cto", to: "ops" },
    { from: "fe", to: "fe-lead" },
    { from: "fe", to: "fe-dev1" },
    { from: "fe", to: "fe-dev2" },
    { from: "be", to: "be-lead" },
    { from: "be", to: "be-dev1" },
    { from: "be", to: "be-dev2" },
    { from: "ops", to: "ops-lead" },
    { from: "ops", to: "ops-eng" },
    { from: "cfo", to: "finance" },
    { from: "cfo", to: "hr" },
    { from: "cmo", to: "market" },
  ],
};

/** 中心布局示例：以核心服务为中心 */
export const centerGraphData = {
  rootId: "core",
  nodes: [
    { id: "core", text: "API 网关", width: 100, height: 60 },
    { id: "auth", text: "认证服务", groupId: "auth" },
    { id: "user", text: "用户服务", groupId: "biz" },
    { id: "order", text: "订单服务", groupId: "biz" },
    { id: "pay", text: "支付服务", groupId: "biz" },
    { id: "product", text: "商品服务", groupId: "biz" },
    { id: "mysql", text: "MySQL", groupId: "db" },
    { id: "redis", text: "Redis", groupId: "db" },
    { id: "mq", text: "RocketMQ", groupId: "db" },
  ],
  lines: [
    { from: "core", to: "auth" },
    { from: "core", to: "user" },
    { from: "core", to: "order" },
    { from: "core", to: "pay" },
    { from: "core", to: "product" },
    { from: "auth", to: "redis" },
    { from: "user", to: "mysql" },
    { from: "order", to: "mysql" },
    { from: "order", to: "mq" },
    { from: "pay", to: "mysql" },
    { from: "product", to: "mysql" },
    { from: "product", to: "redis" },
  ],
};

/** 3D 示例：知识图谱 */
export const graph3DData = {
  nodes: [
    { id: "root", text: "知识图谱", group: "A", val: 8 },
    { id: "ai", text: "人工智能", group: "A", val: 6 },
    { id: "ml", text: "机器学习", group: "B", val: 5 },
    { id: "dl", text: "深度学习", group: "B", val: 5 },
    { id: "nlp", text: "自然语言", group: "C", val: 4 },
    { id: "cv", text: "计算机视觉", group: "C", val: 4 },
    { id: "rl", text: "强化学习", group: "D", val: 3 },
    { id: "llm", text: "大语言模型", group: "B", val: 5 },
    { id: "transformer", text: "Transformer", group: "B", val: 4 },
    { id: "bert", text: "BERT", group: "C", val: 3 },
    { id: "gpt", text: "GPT", group: "C", val: 3 },
    { id: "yolo", text: "YOLO", group: "C", val: 3 },
    { id: "resnet", text: "ResNet", group: "C", val: 3 },
    { id: "dqn", text: "DQN", group: "D", val: 2 },
    { id: "pg", text: "Policy Gradient", group: "D", val: 2 },
  ],
  links: [
    { source: "root", target: "ai" },
    { source: "ai", target: "ml" },
    { source: "ai", target: "dl" },
    { source: "ai", target: "nlp" },
    { source: "ai", target: "cv" },
    { source: "ai", target: "rl" },
    { source: "ml", target: "dl" },
    { source: "dl", target: "llm" },
    { source: "dl", target: "transformer" },
    { source: "nlp", target: "llm" },
    { source: "transformer", target: "bert" },
    { source: "transformer", target: "gpt" },
    { source: "llm", target: "gpt" },
    { source: "cv", target: "yolo" },
    { source: "cv", target: "resnet" },
    { source: "rl", target: "dqn" },
    { source: "rl", target: "pg" },
    { source: "ml", target: "rl" },
  ],
};

// ============================================================
// 模板定义
// ============================================================

export const reGraphMeta: TemplateMeta = {
  name: "ReGraph",
  component: () => import("@repo/ui/re-graph").then((m) => ({ default: m.default })),
  title: "关系图（通用）",
  description: "通用关系图组件，集成搜索 / 右键扩线 / 折叠 / 锁定 / 历史回溯 / 导入导出",
  modelable: false,
  props: [
    {
      key: "mode",
      label: "布局模式",
      type: "select",
      default: "force",
      options: [
        { label: "force（力导向）", value: "force", icon: "Connection" },
        { label: "tree（树形）", value: "tree", icon: "Share" },
        { label: "center（中心扩散）", value: "center", icon: "Aim" },
        { label: "circle（环形）", value: "circle", icon: "Refresh" },
        { label: "fixed（固定坐标）", value: "fixed", icon: "Lock" },
        { label: "mind（思维导图）", value: "mind", icon: "Share" },
        { label: "relation（关系图）", value: "relation", icon: "Connection" },
      ],
    },
    { key: "data", label: "数据（RGJsonData）", type: "json", default: forceGraphData },
    { key: "height", label: "高度", type: "string", default: "500px" },
    { key: "showToolbar", label: "显示工具栏", type: "boolean", default: true },
  ],
};

export const reGraphForceMeta: TemplateMeta = {
  name: "ReGraphForce",
  component: () => import("@repo/ui/re-graph-force").then((m) => ({ default: m.default })),
  title: "力导向图",
  description: "ReGraphForce 力导向布局，适合社交网络 / 知识图谱",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "data", label: "数据", type: "json", default: forceGraphData },
    { key: "height", label: "高度", type: "string", default: "500px" },
    { key: "debug", label: "调试信息", type: "boolean", default: false },
  ],
};

export const reGraphTreeMeta: TemplateMeta = {
  name: "ReGraphTree",
  component: () => import("@repo/ui/re-graph-tree").then((m) => ({ default: m.default })),
  title: "树形图",
  description: "ReGraphTree 树形布局，适合组织架构 / 分类树",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "data", label: "数据", type: "json", default: treeGraphData },
    { key: "height", label: "高度", type: "string", default: "500px" },
  ],
};

export const reGraphCenterMeta: TemplateMeta = {
  name: "ReGraphCenter",
  component: () => import("@repo/ui/re-graph-center").then((m) => ({ default: m.default })),
  title: "中心布局",
  description: "ReGraphCenter 以根节点为中心的辐射式布局",
  modelable: false,
  props: [
    { key: "layout", label: "布局", type: "select", default: "default", options: [{ label: "default", value: "default", icon: "Switch" }] },
    { key: "data", label: "数据", type: "json", default: centerGraphData },
    { key: "height", label: "高度", type: "string", default: "500px" },
  ],
};

export const reGraph3DMeta: TemplateMeta = {
  name: "ReGraph3D",
  component: () => import("@repo/ui/re-graph-3d").then((m) => ({ default: m.default })),
  title: "3D 关系图",
  description: "ReGraph3D 基于 three.js + d3-force 实现，支持拖拽旋转、缩放、自动旋转",
  modelable: false,
  props: [
    { key: "data", label: "数据", type: "json", default: graph3DData },
    { key: "height", label: "高度", type: "string", default: "500px" },
    { key: "nodeRelSize", label: "节点尺寸", type: "number", default: 4, min: 1, max: 20, step: 1 },
    { key: "showNodeLabel", label: "节点文本", type: "boolean", default: true },
    { key: "linkArrowLength", label: "箭头长度", type: "number", default: 6, min: 0, max: 20, step: 1 },
    { key: "forceChargeStrength", label: "斥力", type: "number", default: -90, min: -300, max: 0, step: 10 },
    { key: "forceLinkDistance", label: "连线距离", type: "number", default: 60, min: 10, max: 200, step: 10 },
    { key: "cameraDistance", label: "相机距离", type: "number", default: 800, min: 100, max: 3000, step: 50 },
    { key: "autoRotate", label: "自动旋转", type: "boolean", default: true },
    { key: "interactive", label: "可交互", type: "boolean", default: true },
  ],
};

/**
 * ReRelationGraphV2 布局可选项（与 packages/ui/src/components/ReRelationGraphV2/internals/layouts.ts
 * 的 LAYOUT_OPTIONS 保持一致；此处刻意重复一份静态清单，避免模板模块 eager import
 * 组件包把 G6（约 2MB）拉进调试页首屏）。
 */
const RELATION_GRAPH_V2_LAYOUTS = [
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
  { label: "蛇形 snake", value: "snake", icon: "Guide" },
  { label: "鱼骨 fishbone", value: "fishbone", icon: "DataLine" },
  { label: "随机 random", value: "random", icon: "MagicStick" },
];

export const reRelationGraphV2Meta: TemplateMeta = {
  name: "ReRelationGraphV2",
  component: () => import("@repo/ui/re-relation-graph-v2").then((m) => ({ default: m.default })),
  title: "关系图谱V2",
  description:
    "G6 5.1.1 原生：气泡集 / Hull 双分组轮廓 + 分组布局（每组独立区域）+ 全部 G6 布局 + 内置工具栏（布局/分组/参数）+ 节点边 hover",
  modelable: false,
  props: [
    { key: "nodes", label: "节点（V2Node[]）", type: "json", default: relationGraphV2Data().nodes },
    { key: "edges", label: "边（V2Edge[]）", type: "json", default: relationGraphV2Data().edges },
    {
      key: "layout",
      label: "布局",
      type: "select",
      default: "group",
      description: "group = 分组布局（每组自动占据独立区域，推荐）",
      options: RELATION_GRAPH_V2_LAYOUTS,
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
      description: "图标 + Popover：布局 / 分组轮廓 / 分组开关 / 布局设置 / 适应画布",
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
    { key: "height", label: "高度", type: "string", default: "100%" },
  ],
};

export const graphTemplates: TemplateMeta[] = [
  reGraphMeta,
  reGraphForceMeta,
  reGraphTreeMeta,
  reGraphCenterMeta,
  reGraph3DMeta,
  reRelationGraphV2Meta,
];
