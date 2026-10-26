/**
 * 画像分区组件的公共类型。
 *
 * <p>Vue 的 `<script setup>` 不允许 ES 模块导出，聚合条这类被多个分区共享的
 * 结构必须落在普通 `.ts` 文件里，否则编译期会报
 * 「<script setup> cannot contain ES module exports」。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */

import type { Tone } from "../../utils/hostProfileUi";

/** 分区顶部聚合条的一格 */
export interface StripItem {
  /** 指标名 */
  label: string;
  /** 主数值（已格式化） */
  value: string;
  /** 补充说明，如占比或口径提示 */
  sub?: string;
  /** 语义等级，决定主数值颜色 */
  tone?: Tone;
}
