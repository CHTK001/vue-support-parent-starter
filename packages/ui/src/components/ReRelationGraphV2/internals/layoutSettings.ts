/**
 * ReRelationGraphV2 布局参数表（工具栏「布局设置」面板用）
 *
 * <p>每种布局只暴露真正生效、且有直观视觉反馈的少量参数，避免把 G6 的
 * 几十个选项一股脑摊给使用者。<b>group（分组布局）</b>用的是本组件自研的
 * spacing / gap / minRadius；其余为 G6 布局的同名选项。</p>
 *
 * <p>字段初值即「不传时」的行为：面板显示默认值，用户改动用 {@code layoutOptions}
 * 覆盖，重置即清空 {@code layoutOptions}。</p>
 */

/** 一个可调参数 */
export interface LayoutSettingField {
  /** 写入 layoutOptions 的键名 */
  key: string;
  /** 中文标签 */
  label: string;
  /** 最小值 */
  min: number;
  /** 最大值 */
  max: number;
  /** 步进 */
  step: number;
  /** 默认值（= 不传时的 G6/组件默认行为） */
  defaultValue: number;
  /** 单位（仅展示） */
  unit?: string;
  /** 一句话说明 */
  hint?: string;
}

/** 各布局的参数表（键为布局名；缺省 = 该布局无可调参数） */
export const LAYOUT_SETTINGS: Record<string, LayoutSettingField[]> = {
  // ---- 分组布局（本组件自研）----
  group: [
    { key: "spacing", label: "组内间距", min: 40, max: 240, step: 10, defaultValue: 100, unit: "px", hint: "越大组内越松散，单组区域也随之变大" },
    { key: "gap", label: "组间留白", min: 60, max: 400, step: 10, defaultValue: 170, unit: "px", hint: "组与组之间的空隙" },
    { key: "minRadius", label: "最小半径", min: 30, max: 200, step: 10, defaultValue: 70, unit: "px", hint: "小势力（1~2 个节点）的占位半径" },
  ],
  // ---- G6 内置布局 ----
  force: [
    { key: "nodeStrength", label: "节点斥力", min: 10, max: 2000, step: 10, defaultValue: 1000, hint: "正值=互相排斥，越大越散" },
    { key: "linkDistance", label: "连线长度", min: 50, max: 400, step: 10, defaultValue: 200, unit: "px" },
    { key: "gravity", label: "向心引力", min: 0, max: 50, step: 1, defaultValue: 10, hint: "把节点往画布中心拉" },
  ],
  "d3-force": [
    { key: "linkDistance", label: "连线长度", min: 20, max: 300, step: 10, defaultValue: 100, unit: "px" },
    { key: "nodeSize", label: "节点占位", min: 10, max: 80, step: 2, defaultValue: 30, unit: "px" },
  ],
  "force-atlas2": [
    { key: "kr", label: "斥力系数", min: 1, max: 500, step: 1, defaultValue: 100 },
    { key: "speed", label: "收敛速度", min: 0.1, max: 10, step: 0.1, defaultValue: 1 },
  ],
  fruchterman: [
    { key: "gravity", label: "向心引力", min: 0, max: 50, step: 1, defaultValue: 10 },
    { key: "speed", label: "收敛速度", min: 0.1, max: 10, step: 0.1, defaultValue: 1 },
  ],
  circular: [
    { key: "nodeSize", label: "节点占位", min: 10, max: 80, step: 2, defaultValue: 30, unit: "px" },
    { key: "nodeSpacing", label: "节点间距", min: 0, max: 60, step: 2, defaultValue: 0, unit: "px" },
  ],
  concentric: [
    { key: "nodeSize", label: "节点占位", min: 10, max: 80, step: 2, defaultValue: 30, unit: "px" },
    { key: "nodeSpacing", label: "节点间距", min: 0, max: 60, step: 2, defaultValue: 10, unit: "px" },
  ],
  grid: [
    { key: "nodeSize", label: "节点占位", min: 10, max: 120, step: 2, defaultValue: 30, unit: "px" },
    { key: "nodeSpacing", label: "节点间距", min: 0, max: 60, step: 2, defaultValue: 10, unit: "px" },
  ],
  radial: [
    { key: "unitRadius", label: "环间距", min: 20, max: 300, step: 10, defaultValue: 100, unit: "px" },
    { key: "linkDistance", label: "连线长度", min: 20, max: 200, step: 10, defaultValue: 50, unit: "px" },
  ],
  mds: [{ key: "linkDistance", label: "连线长度", min: 20, max: 200, step: 10, defaultValue: 50, unit: "px" }],
  dagre: [
    { key: "nodesep", label: "同层间距", min: 10, max: 200, step: 10, defaultValue: 30, unit: "px" },
    { key: "ranksep", label: "层间距", min: 20, max: 300, step: 10, defaultValue: 60, unit: "px" },
  ],
  "antv-dagre": [
    { key: "nodesep", label: "同层间距", min: 10, max: 200, step: 10, defaultValue: 30, unit: "px" },
    { key: "ranksep", label: "层间距", min: 20, max: 300, step: 10, defaultValue: 60, unit: "px" },
  ],
  "combo-combined": [
    { key: "nodeSize", label: "节点占位", min: 10, max: 80, step: 2, defaultValue: 30, unit: "px" },
  ],
  snake: [{ key: "padding", label: "内边距", min: 0, max: 60, step: 2, defaultValue: 10, unit: "px" }],
  fishbone: [{ key: "padding", label: "内边距", min: 0, max: 60, step: 2, defaultValue: 10, unit: "px" }],
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

/**
 * 用当前 layoutOptions 计算某个字段的显示值（未设置时回落到默认值）
 */
export const valueOf = (
  options: Record<string, unknown> | undefined,
  field: LayoutSettingField,
): number => {
  const v = options?.[field.key];
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : field.defaultValue;
};
