/**
 * Hotsport 实时通道服务 — 薄转发层。
 *
 * <p>实现在 {@code @pages/hotsport} 包内（含可配置接口源 {@code apiUrl}/{@code wsUrl}，
 * 支持独立部署与平台同源两种形态）。本文件只做 re-export，保持视图现有的
 * {@code ../services/realtimeService} 相对导入不破，消除双份维护。</p>
 *
 * @since 2.0.0
 */
export * from "@pages/hotsport/src/services/realtimeService";