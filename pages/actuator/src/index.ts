/**
 * @pages/actuator —— Actuator 观测卡片包
 *
 * <p>把宿主应用 {@code /actuator/**} 的原始 JSON 变成监控大屏上的一组卡片。
 * 本包<b>不</b>自己往注册表里塞东西，而是导出 {@link actuatorCards} 与
 * {@link actuatorContribution}，由应用入口显式接线：</p>
 *
 * <pre>{@code
 * import { actuatorCards, actuatorContribution } from "@pages/actuator";
 *
 * createContextApp({ ... })
 *   .widgets([actuatorContribution])
 *   .mount("#app");
 * }</pre>
 *
 * <p>为什么不像内置卡片那样「import 即注册」：监控大屏是可选能力，卡片注册时机应当由
 * 应用说了算（同首页 widget，见 {@code @repo/theme/koi} 的 {@code defineWidgetContribution}）。
 * 显式接线也让「这个应用装了哪些卡片」在 main.ts 一眼可查，而不是藏在一串副作用导入里。</p>
 *
 * @since 4.0.0.51
 */
import { defineMonitorCardContribution } from "@pages/system";
import { actuatorCards } from "./monitor/actuatorCards";

export { actuatorCards };
export { getActuatorEndpoint } from "./api/actuatorApi";

/** 交给 {@code createContextApp(...).widgets([...])} 的贡献项 */
export const actuatorContribution = defineMonitorCardContribution(actuatorCards);
