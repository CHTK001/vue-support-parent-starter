/**
 * 卡片内部小组件的公共类型
 *
 * <p>刻意放在独立 .ts 里而不是 {@code <script setup>}：Vue 的 {@code <script setup>}
 * <b>不允许 ES module 导出</b>（"cannot contain ES module exports"），
 * 在组件里写 {@code export interface} 会直接编译失败。</p>
 */

/** 语义色 */
export type CardTone = "ok" | "warn" | "danger" | "muted";

/** KPI 项 */
export interface CardKpiItem {
  label: string;
  value: string;
  /** ok = 正常 / warn = 预警 / danger = 异常 / muted = 次要 */
  tone?: CardTone;
}

/** 「名称 → 数值」列表行 */
export interface CardListRow {
  key: string;
  value: string;
  /** 占比（0-100）；给了才画进度条 */
  pct?: number;
  tone?: CardTone;
}
