/**
 * ReRelationGraphV2 布局清单与类型
 *
 * <p>布局分两类：</p>
 * <ul>
 *   <li><b>group（分组布局）</b>：本组件自研的确定性布局。每个 {@code group}
 *       （势力）被分配到画布上独立的一块区域，组内节点按黄金角螺旋铺满，
 *       组与组之间留白 —— 保证「同组自动聚到一处、不同组各占一侧」，不靠力导向飘移；</li>
 *   <li><b>G6 5.1.1 内置布局</b>：force / d3-force / circular / concentric / grid /
 *       radial / mds / fruchterman / dagre / antv-dagre / force-atlas2 /
 *       combo-combined / snake / fishbone / random，全部按 G6 原样透传。</li>
 * </ul>
 *
 * <p>布局参数通过组件 {@code layoutOptions} 传入（分组布局支持 spacing / gap / minRadius，
 * 其余布局的选项见 G6 布局文档）。</p>
 */

/** 布局类型：分组布局 + G6 5.1.1 全部内置布局 */
export type V2LayoutType =
  | "group"
  | "force"
  | "d3-force"
  | "force-atlas2"
  | "fruchterman"
  | "circular"
  | "concentric"
  | "grid"
  | "radial"
  | "mds"
  | "dagre"
  | "antv-dagre"
  | "combo-combined"
  | "snake"
  | "fishbone"
  | "random";

/** 布局选项（下拉/文档用） */
export interface V2LayoutOption {
  label: string;
  value: V2LayoutType;
  /** 一句话说明 */
  hint?: string;
  /** 图标（el-icon 组件名，方形选择器用） */
  icon?: string;
}

/** 全部布局（顺序即参数面板顺序，分组布局置顶） */
export const LAYOUT_OPTIONS: V2LayoutOption[] = [
  { label: "分组布局 group", value: "group", hint: "每组自动占据独立区域（推荐）", icon: "Files" },
  { label: "力导向 force", value: "force", hint: "弹簧模型，节点斥力 + 连线拉力", icon: "Share" },
  { label: "D3 力导向 d3-force", value: "d3-force", hint: "d3-force 模拟", icon: "Connection" },
  { label: "ForceAtlas2 force-atlas2", value: "force-atlas2", hint: "大型网络聚类力导向", icon: "Aim" },
  { label: "Fruchterman fruchterman", value: "fruchterman", hint: "经典力导向（带 grid 加速）", icon: "Compass" },
  { label: "环形 circular", value: "circular", hint: "节点均布在圆周上", icon: "RefreshRight" },
  { label: "同心圆 concentric", value: "concentric", hint: "按度数分环", icon: "Odometer" },
  { label: "网格 grid", value: "grid", hint: "等距网格排列", icon: "Grid" },
  { label: "辐射 radial", value: "radial", hint: "以中心节点向四周辐射", icon: "Position" },
  { label: "MDS mds", value: "mds", hint: "多维尺度降维", icon: "Histogram" },
  { label: "Dagre 分层 dagre", value: "dagre", hint: "有向分层（需边有方向）", icon: "Sort" },
  { label: "AntV Dagre 分层 antv-dagre", value: "antv-dagre", hint: "AntV 版分层布局", icon: "SortDown" },
  { label: "Combo 组合 combo-combined", value: "combo-combined", hint: "按 combo 分组组合", icon: "Menu" },
  { label: "蛇形 snake", value: "snake", hint: "蛇形排布（偏树/链）", icon: "Guide" },
  { label: "鱼骨 fishbone", value: "fishbone", hint: "鱼骨排布（偏树/链）", icon: "DataLine" },
  { label: "随机 random", value: "random", hint: "随机位置（对照用）", icon: "MagicStick" },
];

/** 默认布局 */
export const DEFAULT_LAYOUT: V2LayoutType = "group";

/** 判断布局名是否是分组布局 */
export const isGroupLayout = (type: string): boolean => type === "group";

/**
 * 分组轮廓的包裹方式：
 * - {@code "bubble"} BubbleSets 云状气泡集（默认）
 * - {@code "hull"} Hull 凹包轮廓，贴合节点集形状
 * - {@code "none"} 不画轮廓，只保留势力配色
 */
export type V2GroupType = "bubble" | "hull" | "none";
