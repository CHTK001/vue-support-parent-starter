/**
 * @pages/datasource —— 数据源模块向 home 仪表板贡献的 widget
 *
 * <p>模块自带「系统组件」的接线处。宿主 app 在 {@code main.ts} 里登记：</p>
 *
 * <pre>{@code
 * import { createContextApp } from "@repo/app";
 * import { defineWidgetContribution } from "@repo/theme/koi/views/home/registry";
 * import { datasourceWidgets } from "@pages/datasource/src/widgets/datasourceWidgets";
 *
 * createContextApp({ appName: "xxx" })
 *   .widgets([defineWidgetContribution(datasourceWidgets)])
 *   .mount("#app");
 * }</pre>
 *
 * <p>约定见 {@code @pages/collect} 的 collectWidgets：{@code type} 全局唯一加模块前缀、
 * {@code source} 必填（随布局持久化）、组件懒加载、图标用 {@code iconComponent}
 * 直给（WidgetLibrary 的内置 ICON_MAP 不认识模块图标名，只传字符串会静默退化）。</p>
 *
 * <p>注意：宿主请从本文件深路径导入，而不要从 {@code @pages/datasource} 包根导入 ——
 * 包根求值会执行 {@code registerMenuViewModules} 并连带拖入台账页与全部 API。</p>
 */
import { Coin } from "@element-plus/icons-vue";
import type { WidgetRegistration } from "@repo/theme/koi/views/home/registry.ts";

/** 数据源侧贡献的全部 widget */
export const datasourceWidgets: WidgetRegistration[] = [
  {
    type: "datasource-overview",
    title: "数据源概览",
    description: "数据源总数、启用中数量与接入类型数",
    icon: "Coin",
    iconComponent: Coin,
    defaultSize: { w: 4, h: 3 },
    category: "common",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    source: "datasource",
    component: () => import("./DatasourceOverviewWidget.vue"),
  },
];
