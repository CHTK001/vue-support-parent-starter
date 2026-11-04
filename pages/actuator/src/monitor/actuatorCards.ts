/**
 * Actuator 卡片注册（pages/actuator 贡献给监控大屏的目录项）
 *
 * <p>与首页 widget 同一套模型：本包只提供「元数据 + 组件加载器」，
 * 由应用入口 {@code createContextApp(...).widgets([defineMonitorCardContribution(actuatorCards)])}
 * 在 mount 时注册进监控大屏，宿主大屏（{@code pages/system}）不需要认识这里任何一张卡片。</p>
 *
 * <p>每张卡片对应一个 Actuator 端点，UI 按端点语义单独设计（不共用一张「万能表格」）：</p>
 * <ul>
 *   <li>{@code health} —— 总体状态 + 组件清单</li>
 *   <li>{@code metrics} —— Micrometer 关键指标（内存 / 线程 / GC / HTTP）</li>
 *   <li>{@code prometheus} —— 文本 exposition 解析与家族聚合</li>
 *   <li>{@code info / env / loggers / threads / beans / mappings / scheduledtasks} —— 各自的结构化视图</li>
 * </ul>
 *
 * <p>没有加载器的卡片会被注册表当场报错（DEV 下），因此这里每一项都必须给
 * {@code component}。端点不存在时卡片自己显示「怎么开启」的指引（见 useCardResource 的
 * {@code unavailable} 状态），不是空白也不是假装重试。</p>
 */
import { markRaw } from "vue";
import {
  AlarmClock,
  CircleCheck,
  Collection,
  Connection,
  Cpu,
  DataLine,
  Document,
  Odometer,
  Setting,
  Tickets,
} from "@element-plus/icons-vue";
import type { MonitorCardRegistration } from "@pages/system";

/** 贡献来源标识（写入卡片的 source，占位卡片据此显示「由 xx 提供」） */
const SOURCE = "actuator";

/** 本包贡献的全部卡片 */
export const actuatorCards: MonitorCardRegistration[] = [
  {
    type: "actuator-health",
    title: "健康状态",
    description: "总体 UP/DOWN 与各组件（db、diskSpace、ping…）状态",
    icon: "CircleCheck",
    iconComponent: markRaw(CircleCheck),
    category: "actuator",
    defaultSize: { w: 4, h: 5 },
    maxCount: 1,
    source: SOURCE,
    component: () => import("../cards/ActuatorHealthCard.vue"),
  },
  {
    type: "actuator-metrics",
    title: "关键指标",
    description: "堆内存、线程、GC 暂停、HTTP 请求量/耗时、CPU 等一组核心 Micrometer 指标",
    icon: "Odometer",
    iconComponent: markRaw(Odometer),
    category: "actuator",
    defaultSize: { w: 8, h: 4 },
    maxCount: 2,
    source: SOURCE,
    defaultConfig: { intervalSec: 30 },
    component: () => import("../cards/ActuatorMetricsCard.vue"),
  },
  {
    type: "actuator-prometheus",
    title: "Prometheus 指标",
    description: "解析 /actuator/prometheus 文本：家族数、样本数、Top 家族与 JVM 关键样本",
    icon: "DataLine",
    iconComponent: markRaw(DataLine),
    category: "actuator",
    defaultSize: { w: 6, h: 5 },
    maxCount: 2,
    source: SOURCE,
    defaultConfig: { intervalSec: 60, limit: 8 },
    component: () => import("../cards/ActuatorPrometheusCard.vue"),
  },
  {
    type: "actuator-info",
    title: "应用信息",
    description: "info 端点内容（git / build / 自定义 info.* 属性）",
    icon: "Document",
    iconComponent: markRaw(Document),
    category: "actuator",
    defaultSize: { w: 4, h: 4 },
    maxCount: 1,
    source: SOURCE,
    defaultConfig: { intervalSec: 60 },
    component: () => import("../cards/ActuatorInfoCard.vue"),
  },
  {
    type: "actuator-env",
    title: "环境属性",
    description: "属性源结构：配置来自 yml / 环境变量 / 启动参数各多少项",
    icon: "Tickets",
    iconComponent: markRaw(Tickets),
    category: "actuator",
    defaultSize: { w: 4, h: 4 },
    maxCount: 1,
    source: SOURCE,
    defaultConfig: { intervalSec: 60 },
    component: () => import("../cards/ActuatorEnvCard.vue"),
  },
  {
    type: "actuator-loggers",
    title: "日志级别",
    description: "显式配置过的 logger 与级别分布（排障时临时调过的会露出来）",
    icon: "Setting",
    iconComponent: markRaw(Setting),
    category: "actuator",
    defaultSize: { w: 4, h: 4 },
    maxCount: 1,
    source: SOURCE,
    defaultConfig: { intervalSec: 60 },
    component: () => import("../cards/ActuatorLoggersCard.vue"),
  },
  {
    type: "actuator-threads",
    title: "线程快照",
    description: "线程状态分布与阻塞最久的线程（不铺整份 threaddump）",
    icon: "Cpu",
    iconComponent: markRaw(Cpu),
    category: "actuator",
    defaultSize: { w: 6, h: 4 },
    maxCount: 1,
    source: SOURCE,
    defaultConfig: { intervalSec: 30 },
    component: () => import("../cards/ActuatorThreadsCard.vue"),
  },
  {
    type: "actuator-beans",
    title: "Bean 统计",
    description: "Bean 总数、作用域与按包名前缀的分布",
    icon: "Collection",
    iconComponent: markRaw(Collection),
    category: "actuator",
    defaultSize: { w: 6, h: 4 },
    maxCount: 1,
    source: SOURCE,
    defaultConfig: { intervalSec: 120 },
    component: () => import("../cards/ActuatorBeansCard.vue"),
  },
  {
    type: "actuator-mappings",
    title: "请求映射",
    description: "已注册的 HTTP 路由与方法分布（可按路径关键字过滤）",
    icon: "Connection",
    iconComponent: markRaw(Connection),
    category: "actuator",
    defaultSize: { w: 6, h: 4 },
    maxCount: 1,
    source: SOURCE,
    defaultConfig: { intervalSec: 120 },
    component: () => import("../cards/ActuatorMappingsCard.vue"),
  },
  {
    type: "actuator-scheduledtasks",
    title: "定时任务",
    description: "cron / fixedDelay / fixedRate 三类已注册任务",
    icon: "AlarmClock",
    iconComponent: markRaw(AlarmClock),
    category: "actuator",
    defaultSize: { w: 6, h: 4 },
    maxCount: 1,
    source: SOURCE,
    defaultConfig: { intervalSec: 120 },
    component: () => import("../cards/ActuatorScheduledTasksCard.vue"),
  },
];
