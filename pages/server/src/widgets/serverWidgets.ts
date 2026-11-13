/**
 * @pages/server —— 主机资产管理模块向 home 仪表板贡献的 widget
 *
 * <p>模块自带「系统组件」的接线处。宿主 app 在 {@code main.ts} 里登记
 * （与 {@code serverRoutes} 等一样从包根 {@code @pages/server} 导入）：</p>
 *
 * <pre>{@code
 * import { createContextApp } from "@repo/app";
 * import { defineWidgetContribution } from "@repo/theme/koi/views/home/registry";
 * import { serverRoutes, serverWidgets } from "@pages/server";
 *
 * createContextApp({ appName: "xxx" })
 *   .routes(serverRoutes)
 *   .widgets([defineWidgetContribution(serverWidgets)])
 *   .mount("#app");
 * }</pre>
 *
 * <p>几点约定：</p>
 * <ul>
 *   <li>{@code type} 必须<b>全局唯一</b>，建议加模块前缀（如 {@code host-offline}），
 *       否则会与内置或其他模块的 type 撞名；开发环境重复注册会打印覆盖警告。</li>
 *   <li>{@code source} 必填 —— 它随布局持久化，未启用本模块的 app 靠它显示
 *       「该组件由 server 模块提供」并保留卡片与网格位置。</li>
 *   <li>{@code requiredPermission} 走 app.yaml 的 {@code permissionConfig}，
 *       不要硬编码角色字面量。</li>
 *   <li>组件默认懒加载（{@code component: () => import(...)}），与内置 widget 一致。</li>
 * </ul>
 */
import type { WidgetRegistration } from "@repo/theme/koi/views/home/registry.ts";

/**
 * 主机侧贡献的全部 widget
 *
 * <p>「离线主机」已从首页组件库下线（生产按需再看，避免首页堆监控类卡片），
 * 数组留空但保留注册入口，后续要加回时直接补条目即可。</p>
 */
export const serverWidgets: WidgetRegistration[] = [];

/** 目录项，便于 app 侧单独引用 */
export { default as ServerHostOfflineWidget } from "./ServerHostOfflineWidget.vue";
