/**
 * CDP 客户端通道（@pages/cdp）
 *
 * <p>从 {@code @pages/debug} 下沉的 CDP 客户端核心：REST {@code /ms/cdp/**}、
 * WebSocket {@code /ws/cdp}（JSON-RPC 透传 + 事件推送）与 SSE 事件流的统一入口。
 * CDP 的 UI 组件（{@code CdpWorkbench}）与宿主壳层（{@code @pages/debug} 的
 * 浏览器式工作台）都从这里取客户端能力，保证通道状态只有一份来源。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
export * from "./cdpApi";
