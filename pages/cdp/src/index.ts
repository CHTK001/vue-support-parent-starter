/**
 * @pages/cdp —— CDP 实时页面组件
 *
 * <p><strong>边界</strong>：只暴露「后端内嵌浏览器」相关的通用组件与 API，
 * 不依赖 `pages/ai` 的框架上下文：</p>
 * <ul>
 *   <li>{@link CdpWorkbench}：CDP 工作台（页签式目标栏 + 实时画面 + DevTools
 *       面板），供浏览器式壳层（`@pages/debug`）装配驱动；</li>
 *   <li>`client`：CDP 客户端通道（REST `/ms/cdp/**` + WS `/ws/cdp` + SSE 事件流），
 *       自 `@pages/debug` 下沉而来，工作台 UI 与宿主壳层共用同一份通道状态。</li>
 * </ul>
 *
 * <p>「账号登录」自动截获弹窗（原 {@code CreditLoginDialog}）已随供应商余额
 * 令牌的自动截获链路一并下线：余额密钥改为手工填写，历史实现见 git。</p>
 *
 * <p>宿主按深路径导入组件：`@pages/cdp/components/CdpWorkbench.vue`
 * （与本包 tsconfig / 各宿主 vite alias 的 `@pages/cdp` → `pages/cdp/src`
 * 口径一致）。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
export { default as CdpWorkbench } from './components/CdpWorkbench.vue';
export * from './client';
