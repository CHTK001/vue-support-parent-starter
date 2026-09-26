/**
 * ReStatsCard —— 统计卡片列表（数组直出）
 */
import type { App, Plugin } from "vue";
import type { Component } from "vue";
import ReStatsCard from "./index.vue";

/** 告警级别：驱动卡片边框/底色/角标与整体色板 */
export type ReStatsLevel = "ok" | "info" | "warn" | "danger";

export interface ReStatsCardItem {
  key?: string | number;
  title: string;
  value?: string | number;
  unit?: string;
  desc?: string;
  /** 次要说明：与 desc 同位，用于承载更长的补充信息 */
  sub?: string;
  icon?: Component;
  iconColor?: string;
  valueColor?: string;
  payload?: unknown;
  /** 业务扩展：点击时透传的目标 */
  target?: string | null;
  /** 右侧粗环进度 0~100（有值时替代图标） */
  ringPercent?: number;
  /** 粗环颜色（CSS color） */
  ringColor?: string;
  /** 告警级别（有值时驱动告警态视觉） */
  level?: ReStatsLevel;
  /**
   * 迷你趋势数据（按时间正序）。
   * 传数组时在卡片底部绘制 sparkline；传 0~1 的比值（0~1）时自动换算为百分比刻度。
   */
  series?: number[];
  /** 数值变化是否做 count-up 过渡（默认 true；同值不重播） */
  animate?: boolean;
  /** count-up 时长（ms），默认 600 */
  duration?: number;
  /** 数值保留小数位（仅对数字型 value 生效，默认保持原样） */
  precision?: number;
}

const plugin: Plugin = {
  install(app: App) {
    app.component("ReStatsCard", ReStatsCard);
  },
};

export { plugin as install };
export default ReStatsCard;
