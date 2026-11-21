/**
 * @pages/datasource-hub — 数据源运行时配置页共享包（全站唯一实现方）。
 *
 * <p>对接后端 spring-support-datasource-starter 的运行期管理接口 {@code /ms/ds-runtime/**}：
 * Calcite 联邦 / 分库分表规则的页面实时配置（保存即重建数据源、不重启生效）、
 * SQL 试跑与分片物理表受限 DDL（幂等补建 / 追加列）。</p>
 *
 * <p>与 {@code @pages/datasource}（台账 + 各类数据源管理页，/ms/datasource）互补：
 * 那边管「有哪些库」，这边管「运行期怎么联邦 / 怎么分片」。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
export { createDatasourceHubRoutes } from "./routes";
export { default as DsHubView } from "./views/DsHubView.vue";
