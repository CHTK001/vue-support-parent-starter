/**
 * useRealtime — 薄转发层。
 *
 * <p>实现在 {@code @pages/hotsport} 包内（实时日志流 / 事件订阅 / 连接状态）。
 * 本文件只做 re-export，保持视图现有的 {@code ../composables/useRealtime}
 * 相对导入不破，消除双份维护。</p>
 *
 * @since 2.0.0
 */
export * from "@pages/hotsport/src/composables/useRealtime";