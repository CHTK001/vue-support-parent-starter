/**
 * APM 卡片的「轻入口」
 *
 * <p>应用入口只要监控大屏上的 APM 卡片时，应当 import 本文件而不是包根：
 * 包根会连带引入整页组件（{@code ApmGate}、{@code MetricChart}）与页面样式，
 * 而这里只包含卡片清单与注册包装，卡片组件本身仍是懒加载。</p>
 *
 * <pre>{@code
 * import { apmContribution } from "@pages/apm/src/monitor";
 *
 * createContextApp({ ... })
 *   .widgets([apmContribution])
 *   .mount("#app");
 * }</pre>
 *
 * @since 4.0.0.51
 */
import { defineMonitorCardContribution } from "@pages/system";
import { apmCards } from "./apmCards";
// 卡片版式（ac- 前缀）：只在需要卡片的应用加载，整页 apm.css 不跟着进来
import "../styles/apm-cards.css";

export { apmCards };

/** 交给 {@code createContextApp(...).widgets([...])} 的贡献项 */
export const apmContribution = defineMonitorCardContribution(apmCards);
