/**
 * ReSeamlessScroll 类型定义
 */

/** 滚动方向 */
export type ReSeamlessDirection = "top" | "bottom" | "left" | "right";

/** classOption 配置项 */
export interface ReSeamlessScrollOptions {
  /** 步长 */
  step?: number;
  /** 启动无缝滚动的最小数据条数 */
  limitMoveNum?: number;
  /** hover 时是否暂停 */
  hoverStop?: boolean;
  /** 滚动方向 */
  direction?: ReSeamlessDirection;
  /** 是否开启移动端 touch */
  openTouch?: boolean;
  /** 单条数据高度（开启单步滚动） */
  singleHeight?: number;
  /** 单条数据宽度（开启单步滚动） */
  singleWidth?: number;
  /** 单步停止等待时间 */
  waitTime?: number;
  /** 左右切换按钮偏移量 */
  switchOffset?: number;
  /** 自动滚动 */
  autoPlay?: boolean;
  /** 是否显示左右切换按钮 */
  navigation?: boolean;
  /** 左右单步距离 */
  switchSingleStep?: number;
  /** 切换动画时长（autoPlay=false 时） */
  switchDelay?: number;
  /** 左右按钮不可用时的 class */
  switchDisabledClass?: string;
  /** singleWidth/singleHeight 是否使用 rem 度量 */
  isSingleRemUnit?: boolean;
  /** 内部使用的 key（多实例防冲突） */
  key?: number | string;
}