/**
 * APM Store — 薄转发层。
 *
 * <p>实现在 {@code @pages/hotsport} 包内（含 Agent 状态 / 告警数 / 接口源配置等
 * 全部状态逻辑）。本文件只做 re-export，保持视图与 {@code App.vue} 现有的
 * {@code ./stores/apmStore} 相对导入不破，消除双份维护。</p>
 *
 * @since 2.0.0
 */
export * from "@pages/hotsport/src/stores/apmStore";