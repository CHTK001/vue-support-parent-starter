/**
 * @pages/actuator —— Actuator 观测包
 *
 * <p>本包只管一件事：把宿主应用 {@code /actuator/**} 的原始 JSON 读出来，变成两种形态</p>
 * <ul>
 *   <li><b>独立页面</b>（{@code /actuator}）：11 个端点各自的视图，供排障时逐项查看、修改日志级别；
 *       路由与视图同源，见 {@link ./routes}；</li>
 *   <li><b>监控大屏卡片</b>：同一批端点做成卡片，拖动摆放在大屏网格里。</li>
 * </ul>
 *
 * <p>卡片由应用入口显式接线（同首页 widget 的做法）：</p>
 *
 * <pre>{@code
 * import { actuatorContribution } from "@pages/actuator";
 *
 * createContextApp({ ... })
 *   .widgets([actuatorContribution])
 *   .mount("#app");
 * }</pre>
 *
 * <p>为什么不像宿主内置卡片那样「import 即注册」：监控大屏是可选能力，卡片注册时机应当由
 * 应用说了算（见 {@code @repo/monitor-cards} 的 {@code defineMonitorCardContribution}）。
 * 显式接线也让「这个应用装了哪些卡片」在 main.ts 一眼可查。</p>
 *
 * <p>依赖方向：本包<b>不</b>依赖 {@code @pages/system}。卡片契约与注册表在
 * {@code @repo/monitor-cards}（更低一层），页面视图自带数据通道（{@link ./api/actuatorApi}）。</p>
 *
 * @since 4.0.0.51
 */
import { defineMonitorCardContribution } from "@repo/monitor-cards";
import { actuatorCards } from "./monitor/actuatorCards";

export { actuatorCards };
export { getActuatorEndpoint } from "./api/actuatorApi";
export { actuatorRoutes } from "./routes";

/** Actuator 各端点的中文名与说明（页面页签、卡片目录共用一份） */
export { ACTUATOR_ENDPOINTS, type ActuatorEndpointMeta, type ActuatorTab } from "./endpoints";

/** 交给 {@code createContextApp(...).widgets([...])} 的贡献项 */
export const actuatorContribution = defineMonitorCardContribution(actuatorCards);
