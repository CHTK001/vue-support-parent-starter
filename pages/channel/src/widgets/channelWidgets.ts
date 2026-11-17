/**
 * @pages/channel —— 渠道模块向 home 仪表板贡献的 widget
 *
 * <p>模块自带「系统组件」的接线处。宿主 app 在 {@code main.ts} 里登记
 * （与渠道路由等一样由 app 侧导入）：</p>
 *
 * <pre>{@code
 * import { createContextApp } from "@repo/app";
 * import { defineWidgetContribution } from "@repo/theme/koi/views/home/registry";
 * import { channelWidgets } from "@pages/channel/widgets/channelWidgets";
 *
 * createContextApp({ appName: "xxx" })
 *   .widgets([defineWidgetContribution(channelWidgets)])
 *   .mount("#app");
 * }</pre>
 *
 * <p>注意：宿主请从本文件深路径导入，而不要从 {@code @pages/channel} 包根导入 ——
 * 包根会连带把 {@code ChannelManagementPage.vue} 整页拖进宿主入口 chunk；
 * 本路径中 {@code @pages/channel} 由 vite alias 映射到 {@code pages/channel/src}，
 * 与 tsconfig paths 同一口径。</p>
 */
import { Connection } from "@element-plus/icons-vue";
import type { WidgetRegistration } from "@repo/theme/koi/views/home/registry.ts";

/** 渠道侧贡献的全部 widget */
export const channelWidgets: WidgetRegistration[] = [
  {
    type: "channel-overview",
    title: "渠道概览",
    description: "渠道总数、启用渠道、已绑定连接与模型清单数",
    icon: "Connection",
    iconComponent: Connection,
    defaultSize: { w: 4, h: 4 },
    category: "common",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    source: "channel",
    component: () => import("./ChannelOverviewWidget.vue"),
  },
];
