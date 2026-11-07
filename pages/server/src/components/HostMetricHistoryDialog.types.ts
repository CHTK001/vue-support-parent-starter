/**
 * 主机指标历史弹窗的类型。
 *
 * <p>单独成文件的原因：`<script setup>` 里不允许出现 ES 模块导出语句，
 * 而调用方（底部状态条 / 指标监控页）需要这个联合类型。</p>
 *
 * @author CH
 * @since 4.0.0.54
 */

/** 可查看历史的指标：cpu/mem/disk 为百分比，diskio/net 为双序列速率 */
export type HostMetricKind = "cpu" | "mem" | "disk" | "diskio" | "net";
