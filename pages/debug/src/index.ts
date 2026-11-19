/**
 * @pages/debug —— 浏览器式 CDP 工作台（浏览器 + CDP）
 *
 * <p>本包是 CDP 能力的<b>宿主壳</b>：顶部为浏览器地址栏与生命周期控件
 * （启动 / 重启 / 停止 / 新建页面 / sw8 注入开关），下方装配
 * {@code @pages/cdp} 的 {@code CdpWorkbench} 工作台 —— 左侧页签式目标栏、
 * 中间实时画面、右 / 底部 DevTools 面板（元素 / 控制台 / 网络 / SVG 抽取 /
 * 性能火焰图 / 应用存储 / 截屏 / 求值抽屉 / 变化监视 / 实时代理会话）。</p>
 *
 * <p>CDP 的客户端通道与 UI 组件已下沉到 {@code @pages/cdp}，本包不再自带
 * CDP 实现；路由与菜单由 {@link createCdpRoutes} 工厂产出，宿主只需展开：</p>
 * <pre>{@code
 * ...createCdpRoutes({ showLink: true })
 * }</pre>
 *
 * @author CH
 * @since 4.0.0.51
 */
import "./styles/debug.css";

export { default as BrowserWorkbench } from "./views/BrowserWorkbench.vue";

export { createCdpRoutes } from "./routes";
