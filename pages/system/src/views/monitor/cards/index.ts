/**
 * 监控大屏动态卡片 —— 模块出口
 *
 * <p>对外只暴露「扩展点」与「宿主组件」两类东西：</p>
 * <ul>
 *   <li>{@link registerMonitorCards} / {@link defineMonitorCardContribution} ——
 *       各业务模块在 {@code main.ts} 里贡献自己的卡片；</li>
 *   <li>{@link MonitorCardBoard} —— 页面挂载用；</li>
 *   <li>类型与目录查询 —— 便于测试与其他模块做二次开发。</li>
 * </ul>
 *
 * <p>内置卡片随本模块求值自动注册（{@code ./builtin}），调用方无需手动登记。</p>
 */
import "./builtin";
import "./pageBlocks";

export { default as MonitorCardBoard } from "./MonitorCardBoard.vue";
export {
  registerMonitorCards,
  defineMonitorCardContribution,
  getMonitorCardRegistration,
  getMonitorCardRegistrations,
  getMonitorCardCatalog,
  isMonitorCardRegistered,
  monitorCardCatalog,
  type MonitorCardRegistration,
} from "./registry";
export {
  MONITOR_CARD_CATEGORY_HINT,
  MONITOR_CARD_CATEGORY_LABEL,
  MONITOR_CARD_CATEGORY_ORDER,
  MONITOR_GRID_COLS,
  MONITOR_GRID_MARGIN,
  MONITOR_MIN_H,
  MONITOR_MIN_W,
  MONITOR_PAGE_BLOCK_PREFIX,
  MONITOR_ROW_HEIGHT,
  isPageBlockType,
  type MonitorCardCatalogItem,
  type MonitorCardCategory,
  type MonitorCardItem,
  type MonitorCardSize,
  type MonitorCardSourceConfig,
  type MonitorCardType,
  type MonitorGridItem,
  type MonitorLayoutState,
} from "./types";
export { MONITOR_PAGE_BLOCKS, MONITOR_PAGE_BLOCK_TYPE } from "./pageBlocks";
export { isOverMax, migrateLegacyLayout, parseLayout, useMonitorCards } from "./useMonitorCards";
export { unavailableHint, useCardResource, useActuatorResource } from "./useCardResource";
export { useMetricRows, humanBytes } from "./useMetricRows";
