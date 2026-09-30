/**
 * Widget 注册表 —— **全仓唯一事实来源**
 *
 * <p>此前 widget 的信息散在两处：{@code widgets.ts} 的 {@code WIDGET_CATALOG}（元数据）与
 * {@code useWidgetLoader.ts} 的 {@code LOADER_MAP}（组件）。两处各写一份必然漂移 ——
 * 实际已经漂移过一次：旧 home 组件下线后 {@code isWidgetType} 仍放行 6 个历史类型，
 * 放行 → 找不到组件 → 渲染成「加载失败 + 重试」，且重试必然再失败。
 * 现在合并为**一条注册项同时携带元数据与组件**，漂移在构造上不再可能。</p>
 *
 * <p>并且注册表是<b>运行时可扩展</b>的：各 {@code pages/xx} 模块可在
 * {@code main.ts} 里通过 {@code createContextApp().widgets(...)} 贡献自己的 widget，
 * 无需改动本文件。内置 widget 在本模块被 import 时即完成自注册。</p>
 *
 * <p><b>为什么 {@code WidgetType} 是开放的 string 而不是封闭联合：</b>
 * TypeScript 的模块增强（declaration merging）只对 interface / namespace 生效，
 * <b>对联合类型无效</b>，所以 {@code pages/xx} 无法用 {@code .d.ts} 扩展
 * {@code type WidgetType = "calendar" | ...}。要让模块贡献自定义 type，唯一办法是
 * 开放为 string 并在运行时校验注册表 —— 这正是本文件承担的角色。</p>
 */
import { computed, shallowRef, type Component } from "vue";
import type { WidgetCatalogItem, WidgetPermission } from "./widgets";

/**
 * widget 注册项：元数据 + 组件加载器。
 *
 * <p>模块贡献示例：</p>
 * <pre>{@code
 * export const collectWidgets: WidgetRegistration[] = [{
 *   type: "collect-task-stats",
 *   title: "采集任务概览",
 *   description: "运行中 / 失败 / 已完成的采集任务数",
 *   icon: "DataAnalysis",          // 内置图标名；不认识时回退到默认图标
 *   iconComponent: DataAnalysis,   // 或直接给组件，绕开 WidgetLibrary 的静态 ICON_MAP
 *   defaultSize: { w: 6, h: 4 },
 *   category: "common",
 *   environment: "prod",
 *   requiredPermission: "user",
 *   maxCount: 1,
 *   source: "collect",              // 占位卡片文案用：未启用该模块时显示「由 collect 模块提供」
 *   component: () => import("./CollectTaskStatsWidget.vue"),
 * }];
 * }</pre>
 */
export interface WidgetRegistration extends WidgetCatalogItem {
  /**
   * 组件加载器。
   *
   * <p>允许三种返回值，运行期统一归一：</p>
   * <ol>
   *   <li>{@code () => import("./X.vue")} → 动态 import，产出模块对象，取 {@code .default}</li>
   *   <li>{@code () => defineAsyncComponent(...)}</li>
   *   <li>{@code () => X}（同步组件）</li>
   * </ol>
   */
  component: () => Component | { default: Component } | Promise<Component | { default: Component }>;
  /**
   * 图标组件（可选）。
   *
   * <p>{@code WidgetLibrary} 的 {@code ICON_MAP} 是文件私有映射，只能解析 9 个内置图标名；
   * 模块贡献的图标名多半不在其中，会静默退化成默认图标。传本字段即可直接指定组件。</p>
   */
  iconComponent?: Component;
  /**
   * 贡献该 widget 的模块标识（如 {@code "collect"}）。
   *
   * <p>写入 {@code WidgetItem.source} 持久化。未启用该模块的 app 读到存档里的
   * {@code source} 时，渲染成占位卡片并显示「该组件由 collect 模块提供，当前应用未启用」，
   * 而不是把 widget 丢弃 —— 位置得以保留，切回有该模块的 app 即可复原。</p>
   */
  source?: string;
}

/** 注册表：type → 注册项（保留插入顺序，决定面板视觉顺序） */
const registry = new Map<string, WidgetRegistration>();

/** 版本号：每次注册变更 +1，供 computed 建立响应式依赖 */
const version = shallowRef(0);

/**
 * 注册一批 widget。
 *
 * <p>由 {@link defineWidgetContribution} 包装后交给 app 的 {@code .widgets()} 调用；
 * 内置 widget 在 {@code widgets.ts} 模块求值时自注册。幂等：同 type 重复注册以
 * <b>最后一次</b>为准（便于测试与临时覆盖），开发环境会打印覆盖警告。</p>
 *
 * @param list 待注册的 widget 列表
 */
export function registerWidgets(list: readonly WidgetRegistration[]): void {
  for (const reg of list) {
    if (typeof reg?.type !== "string" || reg.type.trim() === "") {
      console.error("[widget-registry] 忽略缺少 type 的注册项：", reg);
      continue;
    }
    // component 由类型系统保证必填，但 JS 侧或 as any 的注册项绕得过编译检查。
    // 缺它会在渲染时变成「加载失败 + 重试」，而重试必然再失败 —— 很难反推到原因，
    // 故在登记当场就报出来（生产环境不打，这类内部一致性问题不必打扰线上用户）。
    if (import.meta.env?.DEV && typeof reg.component !== "function") {
      console.error(`[widget-registry] type "${reg.type}" 的注册项缺少 component 加载函数`);
    }
    const prev = registry.get(reg.type);
    if (prev && import.meta.env?.DEV) {
      console.warn(
        `[widget-registry] type "${reg.type}" 被覆盖（来源：${prev.source ?? "内置"} → ${reg.source ?? "未声明"}）`,
      );
    }
    registry.set(reg.type, reg);
  }
  version.value += 1;
}

/** 按 type 取注册项；未注册返回 undefined（调用方据此渲染占位卡片） */
export function getWidgetRegistration(type: string): WidgetRegistration | undefined {
  return registry.get(type);
}

/** 该 type 在当前应用是否已注册 */
export function isWidgetRegistered(type: string): boolean {
  return registry.has(type);
}

/** 全部注册项（含组件与图标，顺序即面板顺序） */
export function getWidgetRegistrations(): readonly WidgetRegistration[] {
  version.value; // 建立响应式依赖
  return [...registry.values()];
}

/** 目录元数据（剥离组件与图标，仅供面板 / 权限过滤 / 位置计算使用） */
export function getWidgetCatalog(): WidgetCatalogItem[] {
  version.value; // 建立响应式依赖
  return [...registry.values()].map(({ component: _c, iconComponent: _i, source: _s, ...meta }) => meta);
}

/**
 * 响应式目录：注册变化时自动失效。
 *
 * <p>面板、权限过滤、{@code maxCount} 过滤都应基于它，而不是模块求值期就固定下来的
 * 静态数组 —— 各 {@code pages} 模块是在 {@code main.ts → mount()} 期间注册的，
 * 晚于本模块求值，早期冻结的数组看不到它们。</p>
 */
export const widgetCatalog = computed<WidgetCatalogItem[]>(() => getWidgetCatalog());

/**
 * 构造一个「app 级贡献」，供 {@code createContextApp().widgets(...)} 接线。
 *
 * <p>{@code @repo/app} 刻意<b>不</b>反向依赖本主题（主题可插拔，仓内共 26 个），
 * 所以 app 侧只认一个结构最小的 {@code AppContribution}（namespace + register），
 * 由本函数把 widget 列表适配成它。这样各主题/模块各自实现自己那一份 register，
 * app 只负责按顺序调用。</p>
 *
 * @param list 本模块贡献的 widget 列表
 * @returns 可交给 app 构建器的贡献对象
 */
export function defineWidgetContribution(list: readonly WidgetRegistration[]): {
  namespace: string;
  register: () => void;
} {
  return {
    namespace: "home-widgets",
    register: () => registerWidgets(list),
  };
}

/** 便捷重导出：模块作者只需从本文件 import 类型 */
export type { WidgetCatalogItem, WidgetPermission };
