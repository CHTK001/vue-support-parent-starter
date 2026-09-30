/**
 * @pages/collect —— 采集模块向 home 仪表板贡献的 widget
 *
 * <p>模块自带「系统组件」的接线处。宿主 app 在 {@code main.ts} 里登记
 * （与 {@code collectRoutes} 等一样从包根 {@code @pages/collect} 导入）：</p>
 *
 * <pre>{@code
 * import { createContextApp } from "@repo/app";
 * import { defineWidgetContribution } from "@repo/theme/koi/views/home/registry";
 * import { collectRoutes, collectWidgets } from "@pages/collect";
 *
 * createContextApp({ appName: "xxx" })
 *   .routes(collectRoutes)
 *   .widgets([defineWidgetContribution(collectWidgets)])
 *   .mount("#app");
 * }</pre>
 *
 * <p>几点约定：</p>
 * <ul>
 *   <li>{@code type} 必须<b>全局唯一</b>，建议加模块前缀（如 {@code collect-overview}），
 *       否则会与内置或其他模块的 type 撞名；开发环境重复注册会打印覆盖警告。</li>
 *   <li>{@code source} 必填 —— 它随布局持久化，未启用本模块的 app 靠它显示
 *       「该组件由 collect 模块提供」并保留卡片与网格位置。</li>
 *   <li>{@code requiredPermission} 走 app.yaml 的 {@code permissionConfig}，
 *       不要硬编码角色字面量。</li>
 *   <li>组件默认懒加载（{@code component: () => import(...)}），与内置 widget 一致。</li>
 * </ul>
 */
import { DataBoard } from "@element-plus/icons-vue";
import type { WidgetRegistration } from "@repo/theme/koi/views/home/registry.ts";

/** 采集侧贡献的全部 widget */
export const collectWidgets: WidgetRegistration[] = [
  {
    type: "collect-overview",
    title: "采集概览",
    description: "采集流程总数与运行中任务数",
    icon: "DataBoard",
    // 直接给组件：WidgetLibrary 的内置 ICON_MAP 只认 9 个内置图标名，
    // 模块贡献的图标名不在其中，只传 icon 字符串会静默退化成默认图标
    iconComponent: DataBoard,
    defaultSize: { w: 4, h: 3 },
    category: "common",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    source: "collect",
    component: () => import("./CollectOverviewWidget.vue"),
  },
];

/** 目录项，便于 app 侧单独引用 */
export { default as CollectOverviewWidget } from "./CollectOverviewWidget.vue";
