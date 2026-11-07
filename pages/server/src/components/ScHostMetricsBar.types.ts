/**
 * 主机工作区底部状态条的类型。
 *
 * <p>抽成独立 .ts 而不是写在 {@code ScHostMetricsBar.vue} 的 {@code <script setup>} 里：
 * {@code <script setup>} 不允许出现 ES 模块导出语句，而调用方（主机工作区）
 * 需要这个类型来构造概要行，故单列一个文件供两侧共同引用。</p>
 *
 * @author CH
 * @since 4.0.0
 */

/** 概要浮层里的一行 */
export interface MetricRow {
  /** 字段名（操作系统 / 架构 / 内存 …） */
  label: string;
  /** 字段值，空值约定用「—」表示 */
  value: string;
  /** 是否用等宽字体（IP / MAC / 编码这类逐字符比对的字段） */
  mono?: boolean;
  /** hover 提示（如端口扫描结果明细，title 气泡展示） */
  tip?: string;
  /**
   * 该行下方额外渲染的占用率进度条（0-100）。
   *
   * <p>只有「总量 + 当前占用」都拿得到才有意义（内存 / 磁盘），
   * 没有该值时整条不出现，不渲染空外壳。</p>
   */
  percent?: number;
  /** 进度条右侧的用量说明（如「12.3 GB / 32.0 GB」） */
  percentText?: string;
}
