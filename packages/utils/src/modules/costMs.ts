/**
 * 耗时毫秒数归一（@repo/utils）
 *
 * 供全平台耗时展示统一走 `<ReTime :value="costMs(raw)" format="duration" />`。
 *
 * <h3>为什么必须先归一再交给 ReTime</h3>
 * <p>{@link ReTime} 的 {@code duration} 分支只认 {@code number}，非数字会先走
 * {@code toMs} 的时间戳解析。后端的耗时字段（{@code collectTaskCost} /
 * {@code sysLogCost} / {@code sysMessageCost} …）在不同 Mapper 里可能是数字，也可能是
 * 数字字符串；字符串 {@code "800"} 进 {@code toMs} 会被当成<b>秒级</b>时间戳放大 1000 倍，
 * 800 毫秒显示成 13 分钟。所以必须先转 number。</p>
 *
 * <h3>为什么空值返回 undefined 而不是 0</h3>
 * <p>{@code Number(null)} 是 0，直接透传会让「没跑过 / 没统计」的记录显示成「0 毫秒」，
 * 读起来像「跑得极快」。返回 {@code undefined} 让 ReTime 走自己的 {@code placeholder}。</p>
 *
 * @author CH
 * @since 2026/9/28
 */

/**
 * 把后端返回的耗时归一成可交给 ReTime 的毫秒数。
 *
 * @param ms 后端返回的耗时（毫秒，可能是数字或数字字符串）
 * @return 可用的毫秒数；空值或非数字返回 undefined
 *
 * @example
 * ```ts
 * <ReTime :value="costMs(row.sysLogCost)" format="duration" placeholder="—" />
 * ```
 */
export function costMs(ms: unknown): number | undefined {
  if (ms == null || ms === "") {
    return undefined;
  }
  const value = Number(ms);
  return Number.isFinite(value) ? value : undefined;
}
