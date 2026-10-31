/**
 * @pages/debug —— 调试中心（Chrome DevTools Protocol 面板）
 *
 * <p>基于 {@code spring-support-cdp-starter}（{@code /ms/cdp/**} REST +
 * {@code /ws/cdp} WebSocket）实现的一个轻量级 DevTools 面板，覆盖：</p>
 * <ul>
 *   <li>Console：浏览器 {@code Console.messageAdded} 事件实时回显；</li>
 *   <li>Network：{ @code Network.requestWillBeSent / responseReceived } 事件；</li>
 *   <li>DOM：当前页面的 URL / title / HTML 内容；</li>
 *   <li>Screenshot：截屏（PNG，base64）；</li>
 *   <li>Evaluate：在选中页面上执行 {@code Runtime.evaluate}。</li>
 * </ul>
 *
 * <p>页面组件（{@link DebugCenter}）自动挂载到 {@code /debug} 路由，
 * 路由与菜单由 {@link createCdpRoutes} 工厂产出，宿主只需展开：</p>
 * <pre>{@code
 * ...createCdpRoutes({ showLink: true })
 * }</pre>
 *
 * @author CH
 * @since 4.0.0.51
 */
import "./styles/debug.css";

export { default as DebugCenter } from "./views/DebugCenter.vue";

export { createCdpRoutes } from "./routes";
export * from "./api/cdpApi";
export type {
  CdpStatus,
  CdpTarget,
  CdpTargetPage,
  CdpConsoleMessage,
  CdpNetworkRequest,
} from "./api/cdpApi";
