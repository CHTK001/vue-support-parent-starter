/**
 * @pages/ai —— AI 控制台向 home 仪表板贡献的 widget
 *
 * <p>模块自带「系统组件」的接线处。宿主 app 在 {@code main.ts} 里登记：</p>
 *
 * <pre>{@code
 * import { createContextApp } from "@repo/app";
 * import { defineWidgetContribution } from "@repo/theme/koi/views/home/registry";
 * import { aiWidgets } from "@pages/ai/widgets/aiWidgets";
 *
 * createContextApp({ appName: "xxx" })
 *   .widgets([defineWidgetContribution(aiWidgets)])
 *   .mount("#app");
 * }</pre>
 *
 * <p>约定见 {@code @pages/collect} 的 collectWidgets：{@code type} 全局唯一加模块前缀、
 * {@code source} 必填（随布局持久化）、组件懒加载、图标用 {@code iconComponent}
 * 直给（WidgetLibrary 的内置 ICON_MAP 不认识模块图标名，只传字符串会静默退化）。</p>
 *
 * <p>注意：宿主请从本文件深路径导入（{@code @repo/theme} 的 REPO_ALIAS 把
 * {@code @pages/ai} 指到 {@code pages/ai/src}），不要从包根导入 —— 包根会连带
 * re-export ModelsPage / SystemSettings 等整页组件，拖肥宿主入口 chunk。</p>
 */
import { MagicStick } from "@element-plus/icons-vue";
import type { WidgetRegistration } from "@repo/theme/koi/views/home/registry.ts";

/** AI 控制台侧贡献的全部 widget */
export const aiWidgets: WidgetRegistration[] = [
  {
    type: "ai-model-overview",
    title: "模型服务概览",
    description: "供应商总数、启用供应商与模型总数",
    icon: "MagicStick",
    iconComponent: MagicStick,
    defaultSize: { w: 4, h: 3 },
    category: "common",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    source: "ai",
    component: () => import("./AiModelOverviewWidget.vue"),
  },
];
