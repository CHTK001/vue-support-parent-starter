/**
 * ReRelationGraph 布局参数表（工具栏「布局设置」面板用）
 *
 * <p>每种布局只暴露真正生效、且有直观视觉反馈的少量参数，避免把 G6 的
 * 几十个选项一股脑摊给使用者。<b>参数按布局各管一摊</b>：环形只给半径 / 环上间距 /
 * 排序方式，分层布局只给方向 / 同层间距 / 层间距，树类布局给方向和间距 ——
 * 换了布局，面板里的控件种类和数量都跟着换。</p>
 *
 * <p>字段初值即「不传时」的行为：面板显示默认值，用户改动用 {@code layoutOptions}
 * 覆盖，重置即清空 {@code layoutOptions}。</p>
 */

/** 控件种类：数值滑杆 / 下拉选项 / 开关 */
export type LayoutSettingKind = "slider" | "select" | "switch";

/** 一个可调参数 */
export interface LayoutSettingField {
  /** 写入 layoutOptions 的键名 */
  key: string;
  /** 中文标签 */
  label: string;
  /** 控件种类，缺省 slider */
  kind?: LayoutSettingKind;
  /** 最小值（slider） */
  min?: number;
  /** 最大值（slider） */
  max?: number;
  /** 步进（slider） */
  step?: number;
  /** 默认值（= 不传时的 G6/组件默认行为） */
  defaultValue: number | string | boolean;
  /** 单位（仅展示） */
  unit?: string;
  /** 一句话说明 */
  hint?: string;
  /** 下拉选项（select） */
  options?: Array<{ label: string; value: string }>;
  /** 下拉选项来自图上的节点（root / focusNode 这类按节点 id 取值的参数） */
  fromNodes?: boolean;
  /** 数值 0 表示「不指定，自动算」（面板显示成「自动」而不是「0px」） */
  zeroAsAuto?: boolean;
}

/** 方向类下拉的公共选项（树类布局 / 分层布局复用） */
const DIRECTION_TB: Array<{ label: string; value: string }> = [
  { label: "从上到下 TB", value: "TB" },
  { label: "从下到上 BT", value: "BT" },
  { label: "从左到右 LR", value: "LR" },
  { label: "从右到左 RL", value: "RL" },
];

/** 各布局的参数表（键为布局名；缺省 = 该布局无可调参数） */
export const LAYOUT_SETTINGS: Record<string, LayoutSettingField[]> = {
  // ---- 分组布局（本组件自研）----
  group: [
    { key: "spacing", label: "组内间距", min: 40, max: 240, step: 10, defaultValue: 100, unit: "px", hint: "越大组内越松散，单组区域也随之变大" },
    { key: "gap", label: "组间留白", min: 60, max: 400, step: 10, defaultValue: 170, unit: "px", hint: "组与组之间的空隙" },
    { key: "minRadius", label: "最小半径", min: 30, max: 200, step: 10, defaultValue: 70, unit: "px", hint: "小势力（1~2 个节点）的占位半径" },
  ],

  // ---- 力导向族：受力模型，调「力」不调「位置」----
  force: [
    { key: "nodeStrength", label: "节点斥力", min: 10, max: 2000, step: 10, defaultValue: 1000, hint: "正值=互相排斥，越大越散" },
    { key: "linkDistance", label: "连线长度", min: 50, max: 400, step: 10, defaultValue: 200, unit: "px" },
    { key: "gravity", label: "向心引力", min: 0, max: 50, step: 1, defaultValue: 10, hint: "把节点往画布中心拉" },
  ],
  "d3-force": [
    { key: "linkDistance", label: "连线长度", min: 20, max: 300, step: 10, defaultValue: 100, unit: "px" },
    { key: "nodeStrength", label: "节点斥力", min: -500, max: 0, step: 10, defaultValue: -30, hint: "负数=排斥，越负越散" },
    { key: "collideStrength", label: "防撞强度", min: 0.1, max: 1, step: 0.1, defaultValue: 1, hint: "节点挤在一起时互相推开的力度" },
  ],
  "force-atlas2": [
    { key: "kr", label: "斥力系数", min: 1, max: 500, step: 1, defaultValue: 5, hint: "越大布局越松" },
    { key: "kg", label: "向心系数", min: 0, max: 20, step: 1, defaultValue: 1, hint: "越大越聚在中心" },
    { key: "ks", label: "移动速度", min: 0.01, max: 1, step: 0.01, defaultValue: 0.1 },
    {
      key: "mode",
      label: "聚类模式",
      kind: "select",
      defaultValue: "normal",
      hint: "linlog 模式下同簇节点更紧凑",
      options: [
        { label: "普通 normal", value: "normal" },
        { label: "紧凑 linlog", value: "linlog" },
      ],
    },
  ],
  fruchterman: [
    { key: "gravity", label: "向心引力", min: 0, max: 50, step: 1, defaultValue: 10 },
    { key: "speed", label: "收敛速度", min: 0.1, max: 10, step: 0.1, defaultValue: 5, hint: "太快会明显震荡" },
  ],

  // ---- 几何布局：调「半径 / 间距 / 排序」----
  circular: [
    { key: "radius", label: "圆半径", min: 0, max: 900, step: 20, defaultValue: 0, unit: "px", zeroAsAuto: true, hint: "0 = 按节点尺寸自动撑开圆周；手填半径后不再按间距反推，半径小的圈会靠去重叠收尾" },
    { key: "nodeSpacing", label: "环上间距", min: 0, max: 80, step: 2, defaultValue: 14, unit: "px", hint: "仅自动半径时生效：按节点直径之和反推圆周；手填了半径就不再用它" },
    { key: "startAngle", label: "起始角度", min: 0, max: 360, step: 15, defaultValue: 0, unit: "°" },
    {
      key: "ordering",
      label: "环上排序",
      kind: "select",
      defaultValue: "",
      hint: "决定节点在圆周上的先后顺序",
      options: [
        { label: "数据顺序", value: "" },
        { label: "按拓扑 topology", value: "topology" },
        { label: "按有向拓扑", value: "topology-directed" },
        { label: "按度数 degree", value: "degree" },
      ],
    },
    { key: "clockwise", label: "顺时针", kind: "switch", defaultValue: true },
  ],
  concentric: [
    { key: "nodeSpacing", label: "节点间距", min: 0, max: 80, step: 2, defaultValue: 14, unit: "px" },
    { key: "equidistant", label: "等距分环", kind: "switch", defaultValue: false, hint: "开=每环间距相同；关=按度数比例分配" },
    { key: "clockwise", label: "顺时针", kind: "switch", defaultValue: true },
    {
      key: "sortBy",
      label: "分环依据",
      kind: "select",
      defaultValue: "degree",
      hint: "数值越高越靠圆心",
      options: [{ label: "按度数 degree", value: "degree" }],
    },
  ],
  grid: [
    { key: "rows", label: "行数", min: 0, max: 20, step: 1, defaultValue: 0, zeroAsAuto: true, hint: "0 = 按画布宽高比自动算" },
    { key: "cols", label: "列数", min: 0, max: 20, step: 1, defaultValue: 0, zeroAsAuto: true, hint: "0 = 按画布宽高比自动算" },
    { key: "nodeSpacing", label: "节点间距", min: 0, max: 80, step: 2, defaultValue: 14, unit: "px" },
    { key: "condense", label: "紧凑排列", kind: "switch", defaultValue: false, hint: "开=只用最小画布空间，关=铺满画布" },
  ],
  radial: [
    { key: "unitRadius", label: "环间距", min: 20, max: 300, step: 10, defaultValue: 100, unit: "px" },
    { key: "linkDistance", label: "连线长度", min: 20, max: 200, step: 10, defaultValue: 50, unit: "px" },
    { key: "focusNode", label: "中心节点", kind: "select", defaultValue: "", fromNodes: true, hint: "留空 = 取数据里的第一个节点" },
    { key: "strictRadial", label: "严格同环", kind: "switch", defaultValue: true, hint: "关掉后同环节点可以前后错开，更容易避开重叠" },
  ],
  mds: [{ key: "linkDistance", label: "连线长度", min: 20, max: 300, step: 10, defaultValue: 200, unit: "px" }],

  // ---- 分层布局：方向 + 两个间距 ----
  dagre: [
    { key: "rankdir", label: "布局方向", kind: "select", defaultValue: "TB", options: DIRECTION_TB },
    { key: "nodesep", label: "同层间距", min: 10, max: 200, step: 10, defaultValue: 40, unit: "px" },
    { key: "ranksep", label: "层间距", min: 20, max: 300, step: 10, defaultValue: 70, unit: "px" },
  ],
  "antv-dagre": [
    { key: "rankdir", label: "布局方向", kind: "select", defaultValue: "TB", options: DIRECTION_TB },
    { key: "nodesep", label: "同层间距", min: 10, max: 200, step: 10, defaultValue: 40, unit: "px" },
    { key: "ranksep", label: "层间距", min: 20, max: 300, step: 10, defaultValue: 70, unit: "px" },
    {
      key: "align",
      label: "节点对齐",
      kind: "select",
      defaultValue: "UL",
      options: [
        { label: "左上 UL", value: "UL" },
        { label: "右上 UR", value: "UR" },
        { label: "左下 DL", value: "DL" },
        { label: "右下 DR", value: "DR" },
      ],
    },
  ],
  "combo-combined": [
    { key: "comboSpacing", label: "组间距", min: 0, max: 200, step: 10, defaultValue: 30, unit: "px", hint: "combo 之间的空隙" },
    { key: "comboPadding", label: "组内边距", min: 0, max: 100, step: 5, defaultValue: 20, unit: "px" },
    { key: "nodeSpacing", label: "节点间距", min: 0, max: 80, step: 2, defaultValue: 14, unit: "px" },
  ],

  // ---- 自研鱼骨 ----
  fishbone: [
    { key: "hGap", label: "骨头间距", min: 40, max: 260, step: 10, defaultValue: 90, unit: "px", hint: "沿脊柱方向，一级节点之间的距离" },
    { key: "vGap", label: "肋骨长度", min: 40, max: 200, step: 10, defaultValue: 70, unit: "px" },
    { key: "root", label: "鱼头节点", kind: "select", defaultValue: "", fromNodes: true, hint: "留空 = 取度数最大的枢纽节点" },
  ],

  // ---- 树类布局：方向 + 间距（@antv/hierarchy 的键，由组件包成函数再传下去）----
  "compact-box": [
    { key: "direction", label: "展开方向", kind: "select", defaultValue: "LR", options: DIRECTION_TB, hint: "生态树默认横向展开" },
    { key: "nodeSize", label: "节点占位", min: 30, max: 120, step: 4, defaultValue: 56, unit: "px", hint: "参与排版的节点尺寸，要和实际节点差不多大才不会挤" },
    { key: "getVGap", label: "层间距", min: 0, max: 120, step: 4, defaultValue: 16, unit: "px" },
    { key: "getHGap", label: "兄弟间距", min: 0, max: 120, step: 4, defaultValue: 16, unit: "px" },
  ],
  mindmap: [
    {
      key: "direction",
      label: "展开方向",
      kind: "select",
      defaultValue: "H",
      options: [
        { label: "左右展开 H", value: "H" },
        { label: "从上到下 TB", value: "TB" },
        { label: "从下到上 BT", value: "BT" },
      ],
      hint: "脑图默认左右对称展开",
    },
    { key: "nodeSize", label: "节点占位", min: 30, max: 120, step: 4, defaultValue: 56, unit: "px", hint: "参与排版的节点尺寸，要和实际节点差不多大才不会挤" },
    { key: "getVGap", label: "层间距", min: 0, max: 120, step: 4, defaultValue: 16, unit: "px" },
    { key: "getHGap", label: "兄弟间距", min: 0, max: 120, step: 4, defaultValue: 16, unit: "px" },
  ],
  dendrogram: [
    { key: "isHorizontal", label: "横向展开", kind: "switch", defaultValue: true, hint: "关掉改为纵向" },
    { key: "nodeSize", label: "节点占位", min: 30, max: 120, step: 4, defaultValue: 56, unit: "px", hint: "参与排版的节点尺寸，要和实际节点差不多大才不会挤" },
    { key: "nodeSep", label: "叶子间距", min: 0, max: 160, step: 4, defaultValue: 60, unit: "px" },
    { key: "rankSep", label: "层间距", min: 40, max: 400, step: 10, defaultValue: 160, unit: "px" },
  ],
  indented: [
    {
      key: "direction",
      label: "展开方向",
      kind: "select",
      defaultValue: "LR",
      options: [
        { label: "从左到右 LR", value: "LR" },
        { label: "从右到左 RL", value: "RL" },
        { label: "横向 H", value: "H" },
      ],
    },
    { key: "nodeSize", label: "节点占位", min: 30, max: 120, step: 4, defaultValue: 56, unit: "px", hint: "参与排版的节点尺寸，要和实际节点差不多大才不会挤" },
    { key: "indent", label: "缩进", min: 10, max: 200, step: 5, defaultValue: 60, unit: "px" },
  ],

  // 随机布局没有可调参数，位置本身就是随机的
  random: [],
};

/** 分组轮廓：两种包裹方式共有的外观参数 */
export const GROUP_COMMON_SETTINGS: LayoutSettingField[] = [
  { key: "fillOpacity", label: "填充透明度", min: 0.02, max: 0.5, step: 0.02, defaultValue: 0.14, hint: "组的底色浓淡" },
  { key: "lineWidth", label: "描边粗细", min: 0, max: 6, step: 1, defaultValue: 2, unit: "px" },
];

/**
 * 分组轮廓：按包裹方式区分的参数。
 *
 * <p>两种轮廓的「胖瘦」由完全不同的机制控制，因此不硬凑同一个字段：</p>
 * <ul>
 *   <li>bubble-sets：轮廓由等值线场推出来，{@code nodeR1} 决定节点影响半径（越大越鼓）；</li>
 *   <li>hull：直接对节点外包多边形做 {@code padding} 外扩，{@code concavity} 决定贴合程度。</li>
 * </ul>
 */
export const GROUP_TYPE_SETTINGS: Record<string, LayoutSettingField[]> = {
  bubble: [
    { key: "nodeR1", label: "轮廓外扩", min: 10, max: 220, step: 5, defaultValue: 90, unit: "px", hint: "节点影响半径，越大气泡越鼓" },
  ],
  hull: [
    { key: "padding", label: "轮廓内边距", min: 4, max: 60, step: 2, defaultValue: 18, unit: "px", hint: "轮廓把节点包多紧" },
    { key: "concavity", label: "凹度", min: 100, max: 3000, step: 20, defaultValue: 700, hint: "最大边长，越大轮廓越平滑（≤ 节点间距才贴形）" },
  ],
};

/** 取某分组类型的参数表（不含「不分组」） */
export const groupSettingsOf = (groupType: string): LayoutSettingField[] => [
  ...(GROUP_TYPE_SETTINGS[groupType] ?? []),
  ...GROUP_COMMON_SETTINGS,
];

/** 取某布局的参数表（无配置时返回空数组） */
export const settingsOf = (layout: string): LayoutSettingField[] => LAYOUT_SETTINGS[layout] ?? [];

/** 该布局有没有可调参数（面板据此决定是否显示空态说明） */
export const hasSettingsOf = (layout: string): boolean => settingsOf(layout).length > 0;

/** 字段缺省值（面板显示、重置回落的基准） */
export const defaultValueOf = (field: LayoutSettingField) => field.defaultValue;

/**
 * 用当前 layoutOptions 计算某个字段的显示值（未设置时回落到默认值）。
 *
 * <p>三种控件共用：滑杆要 number、下拉要 string、开关要 boolean。
 * 空字符串对下拉是「不传」的语义，所以 {@code ""} 也要当成合法值保留。</p>
 */
export const valueOf = (
  options: Record<string, unknown> | undefined,
  field: LayoutSettingField,
): number | string | boolean => {
  const raw = options?.[field.key];
  if (field.kind === "switch") {
    return typeof raw === "boolean" ? raw : field.defaultValue === true;
  }
  if (field.kind === "select") {
    if (raw == null) return String(field.defaultValue);
    return String(raw);
  }
  const n = typeof raw === "number" ? raw : Number(raw);
  if (Number.isFinite(n)) return n;
  return Number(field.defaultValue);
};

/** 数值字段的显示值（滑杆用；非数值字段回落到默认值） */
export const numberOf = (
  options: Record<string, unknown> | undefined,
  field: LayoutSettingField,
): number => {
  const v = valueOf(options, field);
  return typeof v === "number" ? v : Number(field.defaultValue) || 0;
};
