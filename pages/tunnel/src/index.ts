/**
 * @pages/tunnel 内网穿透菜单 + API 入口
 *
 * <p>ngrok / Cloudflare Tunnel 两种（以及后续任何）Provider 都由后端
 * {@code TunnelProvider} SPI 注册，前端只面向一套统一接口 {@code /ms/tunnel}；
 * 配置以 JSON 文件持久化，页面由 @pages/monitor 挂载。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
export { createTunnelRoutes, type TunnelRoutesOptions } from "./routes";
export type { TunnelProvider, TunnelMode, TunnelRecord, TunnelView, TunnelProviderInfo } from "./api/types";
export * from "./api/tunnelApi";
export { default as TunnelPage } from "./views/TunnelPage.vue";
