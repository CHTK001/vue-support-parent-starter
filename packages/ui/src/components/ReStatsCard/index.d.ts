/**
 * ReStatsCard 组件默认导出类型声明
 */
import type { Component } from "vue";

export type ReStatsLevel = "ok" | "info" | "warn" | "danger";

export interface ReStatsCardItem {
  key?: string | number;
  title: string;
  value?: string | number;
  unit?: string;
  desc?: string;
  sub?: string;
  icon?: Component;
  iconColor?: string;
  valueColor?: string;
  payload?: unknown;
  target?: string | null;
  /** 右侧粗环进度 0~100（有值时替代图标） */
  ringPercent?: number;
  /** 粗环颜色（CSS color） */
  ringColor?: string;
  /** 告警级别（有值时驱动告警态视觉） */
  level?: ReStatsLevel;
  /** 迷你趋势数据（按时间正序） */
  series?: number[];
  /** 数值变化是否做 count-up 过渡 */
  animate?: boolean;
  /** count-up 时长（ms） */
  duration?: number;
  /** 数值保留小数位 */
  precision?: number;
}

declare const ReStatsCard: import("vue").DefineComponent<{
  list: ReStatsCardItem[];
  columns?: number | "auto";
  clickable?: boolean;
  /** 数值 count-up 时长（ms），默认 600 */
  duration?: number;
}, {}, {}, {
  /** 整卡接管渲染：传入即优先，内置骨架不再渲染 */
  card: (props: {
    item: ReStatsCardItem;
    index: number;
    /** 告警态类名数组（is-warn / is-danger） */
    levelClass: string[];
    ariaLabel: string;
    /** 当前展示值（已格式化，可直接用） */
    displayValue: string;
    hasRing: boolean;
    ringPercent: number;
    iconStyle: Record<string, string>;
    ringStyle: Record<string, string>;
    sparkPoints: string;
    sparkAreaPoints: string;
    sparkColor: string;
    sparkGradientId: string;
  }) => any;
  /** 内置骨架下追加内容（告警徽标、底部说明等） */
  "card-extra": (props: { item: ReStatsCardItem; index: number }) => any;
}>;
export default ReStatsCard;
export const component: () => Promise<typeof ReStatsCard>;
export const install: (app: import("vue").App) => Promise<void>;
