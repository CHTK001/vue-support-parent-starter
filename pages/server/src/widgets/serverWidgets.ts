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
import { Warning } from "@element-plus/icons-vue";
import type { WidgetRegistration } from "@repo/theme/koi/views/home/registry.ts";

/** 主机侧贡献的全部 widget */
export const serverWidgets: WidgetRegistration[] = [
  {
    type: "host-offline",
    title: "离线主机",
    description: "不在线的主机列表，重点关注意外下线的资产",
    icon: "Warning",
    // 直接给组件：WidgetLibrary 的内置 ICON_MAP 只认 9 个内置图标名，
    // 模块贡献的图标名不在其中，只传 icon 字符串会静默退化成默认图标
    iconComponent: Warning,
    defaultSize: { w: 6, h: 4 },
    category: "common",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    source: "server",
    component: () => import("./ServerHostOfflineWidget.vue"),
  },
];

/** 目录项，便于 app 侧单独引用 */
export { default as ServerHostOfflineWidget } from "./ServerHostOfflineWidget.vue";
