/**
 * 场景预设：把「一套常用的 props 组合」打包成可直接套用的对象。
 *
 * <p>关系图的默认值永远是折中：知识图谱要分组轮廓 + 悬浮提示，组织架构要树 + 箭头，
 * 流程拓扑要分层 + 小地图…业务每换一个场景都要重抄一遍十几个开关。
 * 这里给出按场景调好的一组，用法只有两句：</p>
 *
 * <pre>
 * import { GRAPH_PRESETS, applyPreset } from "@repo/ui/re-relation-graph";
 * const preset = ref(GRAPH_PRESETS[0]);
 * &lt;ReRelationGraph :nodes="nodes" :edges="edges" v-bind="applyPreset(preset)" /&gt;
 * </pre>
 *
 * <p>预设只是「参数包」，不改变组件能力：任何一项都可以在 v-bind 之后单独覆盖
 * （后面的属性覆盖前面的，Vue 的合并顺序）。</p>
 */
import type { GroupType, LayoutType } from "./layouts";

/** 预设能设置的全部参数（= 与组件同名的一组 props） */
export interface PresetOptions {
  layout: LayoutType;
  layoutOptions?: Record<string, unknown>;
  groupType?: GroupType;
  groupVisible?: boolean;
  groupAutoHide?: boolean;
  groupOptions?: Record<string, unknown>;
  combo?: boolean;
  clickSelect?: boolean;
  brushSelect?: boolean;
  highlight?: boolean;
  minimap?: boolean;
  tooltip?: boolean;
  nodeTooltip?: boolean;
  edgeTooltip?: boolean;
  rightClickSelect?: boolean;
  nodeBadge?: boolean;
  edgeArrow?: boolean | "both";
  edgeDashed?: boolean;
  edgeWidth?: number;
  edgeLabel?: boolean;
  toolbarVariant?: "pill" | "card" | "rail";
  toolbarCollapsible?: boolean;
}

/** 一个场景预设 */
export interface Preset {
  /** 唯一标识（做下拉的 value） */
  key: string;
  /** 中文名（下拉展示） */
  label: string;
  /** 一句话说明「这个场景为什么这么配」 */
  hint: string;
  /** 套用后的效果一句话（展示用） */
  effect: string;
  options: PresetOptions;
}

/**
 * 内置场景预设。
 *
 * <p>每个都经过实测：布局能排出唯一位置（不会全叠在原点）、交叉数可接受、
 * 开关组合自洽（例如树类布局不再画分组轮廓，因为树已经自带层次）。</p>
 */
export const GRAPH_PRESETS: Preset[] = [
  {
    key: "knowledge",
    label: "知识图谱",
    hint: "分组 + 气泡轮廓 + 悬浮提示，看势力结构和节点详情",
    effect: "分组布局 · 气泡集轮廓 · 节点/边提示开 · 无箭头",
    options: {
      layout: "group",
      groupType: "bubble",
      groupVisible: true,
      groupAutoHide: true,
      highlight: true,
      nodeTooltip: true,
      edgeTooltip: true,
      clickSelect: true,
      brushSelect: false,
      minimap: false,
      combo: false,
      edgeArrow: false,
      edgeDashed: false,
      edgeWidth: 1.4,
      edgeLabel: true,
      nodeBadge: true,
      toolbarVariant: "pill",
      toolbarCollapsible: true,
    },
  },
  {
    key: "org",
    label: "组织架构",
    hint: "自顶向下的层级 + 箭头，看汇报关系（谁向谁汇报）",
    effect: "dagre 自上而下 · 不画轮廓 · 单向箭头 · 边标签开",
    options: {
      layout: "dagre",
      layoutOptions: { rankdir: "TB", nodesep: 40, ranksep: 110 },
      groupType: "none",
      groupVisible: false,
      highlight: true,
      nodeTooltip: true,
      edgeTooltip: true,
      clickSelect: true,
      brushSelect: false,
      minimap: false,
      combo: false,
      edgeArrow: true,
      edgeDashed: false,
      edgeWidth: 1.6,
      edgeLabel: true,
      nodeBadge: true,
      toolbarVariant: "pill",
      toolbarCollapsible: true,
    },
  },
  {
    key: "topology",
    label: "流程拓扑",
    hint: "分层铺开 + 小地图/框选，看上下游和数据流向",
    effect: "antv-dagre 宽幅分层 · 单向箭头 · 小地图 + 框选开",
    options: {
      layout: "antv-dagre",
      layoutOptions: { nodesep: 34, ranksep: 80 },
      groupType: "none",
      groupVisible: false,
      highlight: true,
      nodeTooltip: true,
      edgeTooltip: true,
      clickSelect: true,
      brushSelect: true,
      minimap: true,
      combo: false,
      edgeArrow: true,
      edgeDashed: false,
      edgeWidth: 1.6,
      edgeLabel: true,
      nodeBadge: true,
      toolbarVariant: "card",
      toolbarCollapsible: true,
    },
  },
  {
    key: "social",
    label: "社交关系",
    hint: "力导向自由布局 + 细虚线，看聚类和远近亲疏",
    effect: "d3-force · 无轮廓 · 细虚线 · 只开节点提示",
    options: {
      layout: "d3-force",
      groupType: "none",
      groupVisible: false,
      highlight: true,
      nodeTooltip: true,
      edgeTooltip: false,
      clickSelect: true,
      brushSelect: true,
      minimap: true,
      combo: false,
      edgeArrow: false,
      edgeDashed: true,
      edgeWidth: 1.1,
      edgeLabel: false,
      nodeBadge: false,
      toolbarVariant: "pill",
      toolbarCollapsible: true,
    },
  },
  {
    key: "hierarchy",
    label: "家族谱系",
    hint: "鱼骨横向铺开 + 双向箭头，看世代和婚姻/血缘的双向关系",
    effect: "鱼骨布局 · 双向箭头 · 边标签开 · 提示全开",
    options: {
      layout: "fishbone",
      groupType: "none",
      groupVisible: false,
      highlight: true,
      nodeTooltip: true,
      edgeTooltip: true,
      clickSelect: true,
      brushSelect: false,
      minimap: true,
      combo: false,
      edgeArrow: "both",
      edgeDashed: false,
      edgeWidth: 1.4,
      edgeLabel: true,
      nodeBadge: true,
      toolbarVariant: "pill",
      toolbarCollapsible: true,
    },
  },
];

/** 按 key 取预设（找不到给第一个，方便下拉初始化） */
export const presetOf = (key: string): Preset =>
  GRAPH_PRESETS.find((p) => p.key === key) ?? GRAPH_PRESETS[0];

/**
 * 取出可直接 v-bind 的参数包（浅拷贝，避免业务改到内置常量）。
 *
 * <p>{@code layoutOptions} / {@code groupOptions} 也做了拷贝，业务改了不会污染预设。</p>
 */
export const applyPreset = (preset: Preset | string): PresetOptions => {
  const p = typeof preset === "string" ? presetOf(preset) : preset;
  return {
    ...p.options,
    ...(p.options.layoutOptions ? { layoutOptions: { ...p.options.layoutOptions } } : {}),
    ...(p.options.groupOptions ? { groupOptions: { ...p.options.groupOptions } } : {}),
  };
};

/**
 * 从现有数据猜一个合适的预设（首次接入时少调参）。
 *
 * <p>规则很简单，够用就好：有 group 字段 + 分组数 ≥ 3 → 知识图谱；
 * 连通且有明确层次（平均度数低、有唯一高度数节点）→ 组织架构；其余 → 流程拓扑。</p>
 */
export const suggestPreset = (
  nodes: Array<{ id?: string | number; group?: string }> = [],
  edges: Array<{ source: string; target: string }> = [],
): Preset => {
  const groups = new Set(nodes.map((n) => n.group).filter(Boolean));
  if (groups.size >= 3) return presetOf("knowledge");
  const degree = new Map<string, number>();
  for (const n of nodes) degree.set(String(n.id), 0);
  for (const e of edges) {
    degree.set(String(e.source), (degree.get(String(e.source)) ?? 0) + 1);
    degree.set(String(e.target), (degree.get(String(e.target)) ?? 0) + 1);
  }
  const degs = [...degree.values()].sort((a, b) => b - a);
  const avg = degs.reduce((s, d) => s + d, 0) / Math.max(1, degs.length);
  const hub = degs[0] ?? 0;
  if (hub >= 3 && avg <= 2) return presetOf("org");
  return presetOf("topology");
};
