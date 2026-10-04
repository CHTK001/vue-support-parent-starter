import type { DataSourceInfo } from "./api";

/**
 * 数据源状态口径与左栏筛选（纯函数，无框架依赖）。
 *
 * <p>抽成独立模块的原因：这些判定原先内联在 `ScDataSourceView.vue` 里，
 * 只能靠端到端跑页面验证，而「异常」这一档当时根本没有判定分支——
 * 页签渲染出来、点了却永远为空，且没有任何测试能发现。纯函数可被
 * `node --test` 直接覆盖（见 `tests/datasourceStatus.test.mjs`）。</p>
 *
 * <p>三个互斥口径（对「启用/停用」这条轴做完整划分，计数可加）：
 * <ul>
 *   <li>{@link isOnline}：启用且最近一次连通性测试未失败（含从未测试）；</li>
 *   <li>{@link isAbnormal}：启用且最近一次连通性测试失败（`lastTestOk === 0`）；</li>
 *   <li>{@link isOffline}：停用（`status === 0`）。</li>
 * </ul>
 * 即 `online + abnormal + offline === all`。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */

/** 左栏状态过滤键 */
export type DataSourceStatusKey = "all" | "online" | "abnormal" | "offline";

/**
 * 启用口径：`status` 为 0 表示停用，其余（含 null 未标注）视为启用。
 *
 * <p>与 API 层保持一致（见 `api/index.ts` 的 `fetchDatasourceOptions`）。</p>
 *
 * @param item 数据源
 * @returns 启用返回 true
 */
export const isEnabled = (item: DataSourceInfo): boolean => item.status !== 0;

/**
 * 异常口径：启用且最近一次连通性测试**失败**。
 *
 * <p>`lastTestOk` 的三态语义：`1` 连通、`0` 失败、`null` 从未测试。
 * 只有 `0` 能证明「测过且没连上」；把 `null` 也算异常会把「没测过」误报成「故障」。</p>
 *
 * @param item 数据源
 * @returns 异常返回 true
 */
export const isAbnormal = (item: DataSourceInfo): boolean => isEnabled(item) && item.lastTestOk === 0;

/**
 * 在线口径：启用且不异常。
 *
 * <p>把「测过并失败」的从在线里剔除，在线 / 异常 / 离线三类互斥，
 * 左栏三个计数才可加、不会出现「在线 3 异常 1 全部 3」这种对不上的数。</p>
 *
 * @param item 数据源
 * @returns 在线返回 true
 */
export const isOnline = (item: DataSourceInfo): boolean => isEnabled(item) && !isAbnormal(item);

/**
 * 离线口径：停用。
 *
 * @param item 数据源
 * @returns 离线返回 true
 */
export const isOffline = (item: DataSourceInfo): boolean => !isEnabled(item);

/**
 * 判断一条数据源是否匹配给定的状态过滤键。
 *
 * @param item 数据源
 * @param key  过滤键
 * @returns 匹配返回 true
 */
export const matchStatusKey = (item: DataSourceInfo, key: DataSourceStatusKey): boolean => {
  if (key === "online") {
    return isOnline(item);
  }
  if (key === "abnormal") {
    return isAbnormal(item);
  }
  if (key === "offline") {
    return isOffline(item);
  }
  return true;
};

/**
 * 关键词匹配：名称 / 类型 / 地址 / 备注，大小写不敏感；空关键词视为全部匹配。
 *
 * @param item    数据源
 * @param keyword 关键词
 * @returns 匹配返回 true
 */
export const matchKeyword = (item: DataSourceInfo, keyword: string): boolean => {
  const key = keyword.trim().toLowerCase();
  if (!key) {
    return true;
  }
  return [item.name, item.type, item.host, item.remark]
    .filter(value => value != null && value !== "")
    .some(value => String(value).toLowerCase().includes(key));
};

/**
 * 左栏列表派生：状态过滤 + 关键词过滤。
 *
 * @param list      全量数据源
 * @param statusKey 状态过滤键
 * @param keyword   关键词
 * @returns 过滤后的列表
 */
export const filterDataSources = (
  list: readonly DataSourceInfo[],
  statusKey: DataSourceStatusKey,
  keyword: string,
): DataSourceInfo[] => list.filter(item => matchStatusKey(item, statusKey) && matchKeyword(item, keyword));

/**
 * 各状态计数（互斥，可加）。
 *
 * @param list 全量数据源
 * @returns 四个口径的数量
 */
export const statusCounts = (list: readonly DataSourceInfo[]): Record<DataSourceStatusKey, number> => ({
  all: list.length,
  online: list.filter(isOnline).length,
  abnormal: list.filter(isAbnormal).length,
  offline: list.filter(isOffline).length,
});
