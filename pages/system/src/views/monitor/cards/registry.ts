/**
 * 监控大屏卡片注册表 —— 全仓唯一事实来源
 *
 * <p>元数据与组件加载器<b>写在同一条注册项里</b>，避免首页早期那种「目录一份、加载器一份」
 * 的双写漂移（漂移过一次：旧组件下线后目录仍放行，点添加 → 找不到组件 → 坏卡片）。</p>
 *
 * <p>注册表是<b>运行时可扩展</b>的：各 {@code pages/xx} 模块可以在 {@code main.ts} 里通过
 * {@code registerMonitorCards([...])} 贡献自己的卡片，无需改动监控大屏本体。
 * 内置卡片（Actuator / OpenTelemetry / 自定义）在 {@code ./builtin.ts} 模块求值时自注册。</p>
 *
 * <p>用法示例（模块贡献一张卡片）：</p>
 * <pre>{@code
 * registerMonitorCards([{
 *   type: "collect-stats",
 *   title: "采集任务概览",
 *   description: "运行中 / 失败 / 已完成的采集任务数",
 *   icon: "DataAnalysis",
 *   category: "actuator",
 *   defaultSize: { w: 4, h: 4 },
 *   maxCount: 1,
 *   source: "collect",
 *   component: () => import("./CollectStatsCard.vue"),
 * }]);
 * }</pre>
 */
import { computed, shallowRef, type Component } from "vue";
import type { MonitorCardCatalogItem, MonitorCardType } from "./types";

/** 卡片注册项：元数据 + 组件加载器 */
export interface MonitorCardRegistration extends MonitorCardCatalogItem {
  /**
   * 组件加载器，允许三种返回值（运行期统一归一）：
   * <ol>
   *   <li>{@code () => import("./X.vue")} → 动态 import 的模块对象，取 {@code .default}</li>
   *   <li>{@code () => defineAsyncComponent(...)}</li>
   *   <li>{@code () => X}（同步组件）</li>
   * </ol>
   *
   * <p><b>页面区块（{@link MonitorCardCatalogItem.category} = {@code page}）没有加载器</b>：
   * 它们由页面通过 {@code #block} 插槽自行渲染（要复用页面里现成的实时数据绑定），
   * 所以本字段对它们可缺省。</p>
   */
  component?: () => Component | { default: Component } | Promise<Component | { default: Component }>;
  /**
   * 页面区块标记：为 {@code true} 时本项不加载组件，改由页面插槽渲染。
   *
   * <p>不靠 {@code type} 前缀反推，是因为注册表还要给「目录面板」提供分组与上限；
   * 显式标记让渲染层的判断只有一处事实来源。</p>
   */
  pageBlock?: boolean;
  /**
   * 图标组件（可选）。
   *
   * <p>面板里的图标名映射只覆盖内置图标，模块贡献的名字多半不在其中；
   * 直接给组件可绕开该映射，避免图标静默退化成默认图标。</p>
   */
  iconComponent?: Component;
  /**
   * 贡献该卡片的模块标识（如 {@code "collect"}），写入 {@code MonitorCardItem.source} 持久化。
   * 当前应用未启用该模块时，卡片渲染为占位而不是被丢弃。
   */
  source?: string;
}

/** 注册表：type → 注册项（保留插入顺序，决定面板视觉顺序） */
const registry = new Map<string, MonitorCardRegistration>();

/** 版本号：每次注册变更 +1，供 computed 建立响应式依赖 */
const version = shallowRef(0);

/**
 * 注册一批卡片。
 *
 * <p>内置卡片在 {@code ./builtin.ts} 模块求值时自注册；各 {@code pages/xx} 模块可在
 * {@code main.ts} 追加。幂等：同 type 重复注册以<b>最后一次</b>为准（便于测试与临时覆盖），
 * 开发环境打印覆盖警告。</p>
 *
 * @param list 待注册的卡片列表
 */
export function registerMonitorCards(list: readonly MonitorCardRegistration[]): void {
  for (const reg of list) {
    if (typeof reg?.type !== "string" || reg.type.trim() === "") {
      console.error("[monitor-card-registry] 忽略缺少 type 的注册项：", reg);
      continue;
    }
    // component 对普通卡片必填，但 JS 侧 / as any 的注册项绕得过编译检查。
    // 缺它会在渲染时变成「加载失败 + 重试」，而重试必然再失败 —— 当场报出来。
    // 页面区块（pageBlock）没有加载器，由页面插槽渲染，不在此列。
    if (import.meta.env?.DEV && !reg.pageBlock && typeof reg.component !== "function") {
      console.error(`[monitor-card-registry] type "${reg.type}" 的注册项缺少 component 加载函数`);
    }
    const prev = registry.get(reg.type);
    if (prev && import.meta.env?.DEV) {
      console.warn(
        `[monitor-card-registry] type "${reg.type}" 被覆盖（来源：${prev.source ?? "内置"} → ${reg.source ?? "未声明"}）`,
      );
    }
    registry.set(reg.type, reg);
  }
  version.value += 1;
}

/** 按 type 取注册项；未注册返回 undefined（调用方据此渲染占位卡片） */
export function getMonitorCardRegistration(type: MonitorCardType): MonitorCardRegistration | undefined {
  return registry.get(type);
}

/** 该 type 在当前应用是否已注册 */
export function isMonitorCardRegistered(type: MonitorCardType): boolean {
  return registry.has(type);
}

/** 全部注册项（含组件与图标，顺序即面板顺序） */
export function getMonitorCardRegistrations(): readonly MonitorCardRegistration[] {
  version.value; // 建立响应式依赖
  return [...registry.values()];
}

/** 目录元数据（剥离组件与图标） */
export function getMonitorCardCatalog(): MonitorCardCatalogItem[] {
  version.value;
  return [...registry.values()].map(({ component: _c, iconComponent: _i, source: _s, ...meta }) => meta);
}

/**
 * 响应式目录：注册变化时自动失效。
 *
 * <p>面板、{@code maxCount} 过滤都应基于它，而不是模块求值期固定下来的静态数组 ——
 * 各 {@code pages} 模块是在 {@code main.ts → mount()} 期间注册的，晚于本模块求值。</p>
 */
export const monitorCardCatalog = computed<MonitorCardCatalogItem[]>(() => getMonitorCardCatalog());

/**
 * 构造「app 级贡献」的便捷包装。
 *
 * <p>{@code @repo/app} 刻意不反向依赖业务页面包，所以它只认一个结构最小的
 * {@code AppContribution}（namespace + register）；本函数把卡片列表适配成它，
 * 让模块不用关心接线细节，也避免各模块自己发明 namespace。</p>
 *
 * @param list 本模块贡献的卡片列表
 */
export function defineMonitorCardContribution(list: readonly MonitorCardRegistration[]): {
  namespace: string;
  register: () => void;
} {
  return {
    namespace: "monitor-cards",
    register: () => registerMonitorCards(list),
  };
}

export type { MonitorCardCatalogItem, MonitorCardType };
