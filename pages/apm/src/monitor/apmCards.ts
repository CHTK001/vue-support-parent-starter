/**
 * APM 卡片注册（pages/apm 贡献给监控大屏的目录项）
 *
 * <p>与首页 widget 同一套模型：本包只声明「元数据 + 组件加载器」，由应用入口
 * {@code createContextApp(...).widgets([apmContribution])} 在 mount 时注册。
 * 监控大屏（{@code @pages/system}）不认识这里的任何一张卡片，也不需要 import APM 的代码。</p>
 *
 * <p>卡片走统一 APM 接口 {@code /api/apm/v1/**}，因此 <b>SkyWalking 与 OpenTelemetry
 * 共用同一套卡片</b>：引擎差异由后端归一，卡片只在「能力缺失」时显示提示
 * （例如引擎没有告警能力时，告警卡片不会发请求，也不会显示 0）。</p>
 *
 * @since 4.0.0.51
 */
import { markRaw } from "vue";
import { Bell, Connection, DataLine, Link, TrendCharts } from "@element-plus/icons-vue";
import type { MonitorCardRegistration } from "@pages/system";

/** 贡献来源标识（写入卡片的 source，占位卡片据此显示「由 xx 提供」） */
const SOURCE = "apm";

/** 本包贡献的全部卡片 */
export const apmCards: MonitorCardRegistration[] = [
  {
    type: "apm-overview",
    title: "APM 服务概览",
    description: "健康度、QPS、错误率、平均 / P99 耗时、服务与告警规模",
    icon: "TrendCharts",
    iconComponent: markRaw(TrendCharts),
    category: "apm",
    defaultSize: { w: 8, h: 4 },
    maxCount: 1,
    source: SOURCE,
    defaultConfig: { intervalSec: 30 },
    component: () => import("./cards/ApmOverviewCard.vue"),
  },
  {
    type: "apm-services",
    title: "服务目录",
    description: "按调用量排列的服务，右侧显示错误率与耗时",
    icon: "Connection",
    iconComponent: markRaw(Connection),
    category: "apm",
    defaultSize: { w: 5, h: 5 },
    maxCount: 2,
    source: SOURCE,
    defaultConfig: { intervalSec: 30, limit: 6 },
    component: () => import("./cards/ApmServicesCard.vue"),
  },
  {
    type: "apm-traces",
    title: "慢链路",
    description: "最近 30 分钟耗时最长的链路，含错误标记与所属服务",
    icon: "Link",
    iconComponent: markRaw(Link),
    category: "apm",
    defaultSize: { w: 5, h: 5 },
    maxCount: 2,
    source: SOURCE,
    defaultConfig: { intervalSec: 30, limit: 6 },
    component: () => import("./cards/ApmTracesCard.vue"),
  },
  {
    type: "apm-alarms",
    title: "告警动态",
    description: "最近 24 小时的告警，按新到旧排列；引擎无告警能力时给出提示",
    icon: "Bell",
    iconComponent: markRaw(Bell),
    category: "apm",
    defaultSize: { w: 4, h: 5 },
    maxCount: 1,
    source: SOURCE,
    defaultConfig: { intervalSec: 60, limit: 6 },
    component: () => import("./cards/ApmAlarmsCard.vue"),
  },
  {
    type: "apm-metrics",
    title: "指标趋势",
    description: "自动挑选服务级核心指标（响应时间 / 吞吐 / 成功率）画时序",
    icon: "DataLine",
    iconComponent: markRaw(DataLine),
    category: "apm",
    defaultSize: { w: 6, h: 5 },
    maxCount: 3,
    source: SOURCE,
    defaultConfig: { intervalSec: 30 },
    component: () => import("./cards/ApmMetricsCard.vue"),
  },
];
