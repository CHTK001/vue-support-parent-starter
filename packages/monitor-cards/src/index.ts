/**
 * {@code @repo/monitor-cards} —— 监控大屏卡片契约与注册表
 *
 * <p>只导出两样东西：</p>
 * <ul>
 *   <li>类型（{@link MonitorCardItem}、{@link MonitorCardRegistration}…）——
 *       贡献方写卡片组件时只需要这些；</li>
 *   <li>注册表（{@code registerMonitorCards} / {@code monitorCardCatalog} /
 *       {@code defineMonitorCardContribution}）—— 宿主与贡献方共用同一份运行时状态。</li>
 * </ul>
 *
 * <p>本包<b>不含</b>网格布局、目录面板、持久化，也不含任何业务卡片组件 ——
 * 那是监控大屏（{@code @pages/system}）与各领域包自己的事。</p>
 *
 * @since 4.0.0.51
 */
export type {
  MonitorCardCatalogItem,
  MonitorCardCategory,
  MonitorCardItem,
  MonitorCardSize,
  MonitorCardSourceConfig,
  MonitorCardType,
} from "./types";

export {
  defineMonitorCardContribution,
  getMonitorCardCatalog,
  getMonitorCardRegistration,
  getMonitorCardRegistrations,
  isMonitorCardRegistered,
  monitorCardCatalog,
  registerMonitorCards,
  type MonitorCardRegistration,
} from "./registry";
