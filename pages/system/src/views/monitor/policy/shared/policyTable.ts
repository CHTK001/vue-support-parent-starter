/**
 * 策略控制台 —— 表格通用件
 *
 * <p>原先 TABLE_TOOLBAR 与 rowKeyOf 埋在 PolicyTask.vue 里，被 7 个页签的表格共用。
 * 抽到这里后各页签组件直接 import，不再由父组件层层透传。</p>
 */

/** 工具栏配置：策略页的表格都是单一视图，关掉列设置与表设置 */
export const TABLE_TOOLBAR = {
  refresh: false,
  columnSettings: true,
  tableSettings: true,
  position: "bottom",
} as const;

/**
 * 取一行的业务标识，供操作按钮的 aria-label / tooltip 用
 *
 * <p>七个表格的行类型各不相同（热更新 SysSetting、限流 RateLimitRule、IP SysIpBlackwhite、
 * 账号 AccountBlackwhite、灰度/功能开关/接口管控 PolicyConfig），标识字段也不一样。
 * 逐个插槽硬写字段名既啰嗦又容易漏，所以这里按优先级兜一次。</p>
 *
 * <p><b>为什么必须有它</b>：{@code ReButton} 的 {@code aria-label} 取自插槽文字。
 * 只写「编辑」「删除」时，同一列所有行的 aria-label 完全一致，屏幕阅读器
 * 只能报「编辑按钮」，用户无法知道要编辑哪一行。</p>
 *
 * @param row 表格行
 * @return 业务标识，取不到返回空串
 */
export function rowKeyOf(row: unknown): string {
  const r = (row ?? {}) as Record<string, unknown>;
  const candidates = [
    r.bizKey,
    r.target,
    r.sysIpIp,
    r.account,
    r.sysSettingCode,
    r.sysSettingName,
  ];
  for (const v of candidates) {
    if (null != v && "" !== v) {
      return String(v);
    }
  }
  return "";
}
