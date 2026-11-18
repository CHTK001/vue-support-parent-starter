/**
 * 监控大屏卡片注册表（宿主门面）—— 全仓唯一事实来源在 {@code @repo/monitor-cards}。
 *
 * <p>{@code @pages/system} 只做一层引用：它自己的 {@code builtin.ts} / {@code pageBlocks.ts}
 * 通过这里拿到注册函数与注册项类型，把自定义卡片与页面区块自注册进共享注册表。</p>
 *
 * <p><b>注册表本身（类型 + 运行时状态）不在本包</b> —— 放在 {@code @repo/monitor-cards} 是为了让
 * 领域包（{@code @pages/actuator}、{@code @pages/apm}）不必反向依赖本宿主包：卡片契约是宿主与
 * 贡献方的共同语言，按依赖方向必须低于双方。这里只保留宿主侧的引用面，不复制一份实现。</p>
 *
 * @since 4.0.0.51
 */
export type {
  MonitorCardCatalogItem,
  MonitorCardRegistration,
  MonitorCardType,
} from "@repo/monitor-cards";

export {
  defineMonitorCardContribution,
  getMonitorCardCatalog,
  getMonitorCardRegistration,
  getMonitorCardRegistrations,
  isMonitorCardRegistered,
  monitorCardCatalog,
  registerMonitorCards,
} from "@repo/monitor-cards";
