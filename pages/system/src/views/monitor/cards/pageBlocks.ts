/**
 * 监控大屏的「页面区块」注册项
 *
 * <p>页头以下是<b>整页</b>可自定义的：KPI、RESTful 趋势、JVM 内存池、磁盘 &amp; 网络、
 * GC 统计、资源趋势、网络流量、磁盘分区、系统信息 —— 这 9 块原本是页面里写死的
 * {@code <section>}，现在和注册表里的外围卡片（Actuator / OTel / 自定义）住在<b>同一张
 * 网格</b>里，都能拖、都能缩放、都能删掉再从目录里加回来。</p>
 *
 * <p><b>为什么不像外围卡片那样写成一个 .vue</b>：这些区块直接吃页面里的实时状态
 * （SSE 每秒推送的 {@code info}、各种图表 option、分段切换的 ref…）。抽成组件等于把这
 * 几十个绑定重新接一遍线，收益为零、风险极高。所以它们只登记<b>元数据</b>
 * （标题 / 图标 / 默认尺寸 / 分类），正文由 {@code ServerMonitor.vue} 通过
 * {@code MonitorCardBoard} 的 {@code #block} 插槽渲染。<b>没有 component 加载器</b>，
 * 注册表也据此（{@code pageBlock: true}）跳过「缺加载器」的告警。</p>
 *
 * <p>默认尺寸与默认坐标写在 {@code useMonitorCards.ts} 的 {@code DEFAULT_LAYOUT} 里 ——
 * 那里是布局的唯一事实来源，这里只管「有哪些区块」。</p>
 */
import { markRaw } from "vue";
import {
  Coin,
  Connection,
  Cpu,
  Document,
  FolderOpened,
  Odometer,
  Share,
  TrendCharts,
} from "@element-plus/icons-vue";
import { registerMonitorCards, type MonitorCardRegistration } from "./registry";
import { MONITOR_PAGE_BLOCK_PREFIX } from "./types";

/**
 * 页面区块 type（带 {@link MONITOR_PAGE_BLOCK_PREFIX} 前缀）。
 *
 * <p>渲染层靠前缀决定「走页面插槽」还是「走注册表组件加载」，两处判断同一个常量。</p>
 */
export const MONITOR_PAGE_BLOCK_TYPE = {
  kpi: `${MONITOR_PAGE_BLOCK_PREFIX}kpi`,
  restful: `${MONITOR_PAGE_BLOCK_PREFIX}restful`,
  mem: `${MONITOR_PAGE_BLOCK_PREFIX}mem`,
  diskNet: `${MONITOR_PAGE_BLOCK_PREFIX}disk-net`,
  gc: `${MONITOR_PAGE_BLOCK_PREFIX}gc`,
  trend: `${MONITOR_PAGE_BLOCK_PREFIX}trend`,
  netflow: `${MONITOR_PAGE_BLOCK_PREFIX}netflow`,
  disks: `${MONITOR_PAGE_BLOCK_PREFIX}disks`,
  sysinfo: `${MONITOR_PAGE_BLOCK_PREFIX}sysinfo`,
} as const;

/** 页面区块注册项（顺序即「组件目录」里的顺序） */
export const MONITOR_PAGE_BLOCKS: MonitorCardRegistration[] = [
  {
    type: MONITOR_PAGE_BLOCK_TYPE.kpi,
    title: "概览指标",
    description: "CPU / 内存 / 磁盘 / 网络等 6 个 KPI 统计卡",
    icon: "Odometer",
    iconComponent: markRaw(Odometer),
    category: "page",
    defaultSize: { w: 12, h: 3 },
    maxCount: 1,
    pageBlock: true,
  },
  {
    type: MONITOR_PAGE_BLOCK_TYPE.restful,
    title: "RESTful 趋势",
    description: "窗口请求 / QPS / 成败比 / 平均耗时 + 常规、QPS、Top、IP 四种视图",
    icon: "TrendCharts",
    iconComponent: markRaw(TrendCharts),
    category: "page",
    defaultSize: { w: 5, h: 11 },
    maxCount: 1,
    pageBlock: true,
  },
  {
    type: MONITOR_PAGE_BLOCK_TYPE.mem,
    title: "JVM 内存池",
    description: "堆 / 非堆各内存池占用、已用总量与 GC 累计",
    icon: "Coin",
    iconComponent: markRaw(Coin),
    category: "page",
    defaultSize: { w: 4, h: 11 },
    maxCount: 1,
    pageBlock: true,
  },
  {
    type: MONITOR_PAGE_BLOCK_TYPE.diskNet,
    title: "磁盘 & 网络",
    description: "磁盘使用率与主网卡实时出入流量",
    icon: "Share",
    iconComponent: markRaw(Share),
    category: "page",
    defaultSize: { w: 3, h: 5 },
    maxCount: 1,
    pageBlock: true,
  },
  {
    type: MONITOR_PAGE_BLOCK_TYPE.gc,
    title: "GC 统计",
    description: "GC 次数 / 平均与累计耗时 / 收集器明细",
    icon: "Cpu",
    iconComponent: markRaw(Cpu),
    category: "page",
    defaultSize: { w: 3, h: 6 },
    maxCount: 1,
    pageBlock: true,
  },
  {
    type: MONITOR_PAGE_BLOCK_TYPE.trend,
    title: "资源趋势",
    description: "RESTful / 堆内存 / CPU / 系统内存 / 负载五视图切换的趋势图",
    icon: "TrendCharts",
    iconComponent: markRaw(TrendCharts),
    category: "page",
    defaultSize: { w: 8, h: 6 },
    maxCount: 1,
    pageBlock: true,
  },
  {
    type: MONITOR_PAGE_BLOCK_TYPE.netflow,
    title: "网络流量",
    description: "主网卡收发流量趋势",
    icon: "Connection",
    iconComponent: markRaw(Connection),
    category: "page",
    defaultSize: { w: 4, h: 6 },
    maxCount: 1,
    pageBlock: true,
  },
  {
    type: MONITOR_PAGE_BLOCK_TYPE.disks,
    title: "磁盘分区",
    description: "各分区文件系统、已用 / 总量与使用率条形",
    icon: "FolderOpened",
    iconComponent: markRaw(FolderOpened),
    category: "page",
    defaultSize: { w: 7, h: 5 },
    maxCount: 1,
    pageBlock: true,
  },
  {
    type: MONITOR_PAGE_BLOCK_TYPE.sysinfo,
    title: "系统信息",
    description: "主机 / 运行时长 / 线程 / 类加载 + Spring 核心参数",
    icon: "Document",
    iconComponent: markRaw(Document),
    category: "page",
    defaultSize: { w: 5, h: 5 },
    maxCount: 1,
    pageBlock: true,
  },
];

// 自注册：本模块被挂载看板 import 时即完成登记（早于用户点「组件目录」）
registerMonitorCards(MONITOR_PAGE_BLOCKS);
