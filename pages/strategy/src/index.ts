/**
 * 策略管理模块
 * 提供限流、熔断、降级等策略配置管理界面
 *
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

// 导出页面组件
export { default as StrategyLimitIndex } from "./views/limit/LimitConfigurationIndex.vue";
export { default as StrategyLimitRecordIndex } from "./views/limit/LimitRecordIndex.vue";

// 导出 API
export * from "./api";

// 导出路由
export * from "./router";
