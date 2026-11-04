/**
 * @pages/apm 入口。
 *
 * <p>一套按 SkyWalking 语义组织的 APM 观测台（总览 / 服务 / 端点 / 链路 / 拓扑 /
 * 指标 / 告警 / 日志），数据来自后端 {@code spring-support-apm-starter} 的统一接口
 * {@code /api/apm/v1/**} —— 它内部自动选择 SkyWalking / hotspot / OpenTelemetry 引擎，
 * 因此本包对「接的是哪个 APM」无感，也没有 {@code none} 分支：
 * 没有 APM 时由 {@code ApmGate} 统一渲染降级视图。</p>
 *
 * <p>样式在这里统一引入：{@code styles/apm.css} 里的类全部带 {@code apm-} 前缀，
 * 颜色只用宿主主题变量，不会污染宿主、也不需要主题作用域包装。</p>
 *
 * @since 4.0.0.51
 */
import "./styles/apm.css";
import "./styles/apm-cards.css";
import { defineMonitorCardContribution } from "@pages/system";
import { apmCards } from "./monitor/apmCards";

export { apmCards };

/**
 * 交给 {@code createContextApp(...).widgets([...])} 的贡献项。
 *
 * <p>注册动作由应用入口显式执行（与首页 widget 一致），而不是「import 即注册」：
 * 同一个 APM 包既可能内嵌在控制台里，也可能作为独立观测台运行 ——
 * 只有需要监控大屏卡片的应用才装它们。</p>
 */
export const apmContribution = defineMonitorCardContribution(apmCards);

export { apmRoutes, apmMenus } from "./routes";
export * from "./config";
export * from "./api/apmApi";
export { useApmStatus, loadApmStatus, refreshApmStatus } from "./composables/useApmStatus";
export { default as ApmGate } from "./components/ApmGate.vue";
export { default as MetricChart } from "./components/MetricChart.vue";
export * from "./utils/format";
