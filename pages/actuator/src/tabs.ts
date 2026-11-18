/**
 * Actuator 单页工作台的页签表。
 *
 * <p>11 个页签各自对应一个原生 Actuator 端点。这里只放「页签是什么」，
 * 不放「怎么渲染」：路由在 `routes/index.ts`，URL 同步与页签保活在
 * `views/ActuatorPage.vue`，两者共用本表的 {@code name}，所以「页签名」
 * 与「URL 上的 tab」永远是同一个值，不会出现半套映射。</p>
 *
 * <p>页签顺序与中文名直接来自 {@code ../endpoints.ts} 的 {@link ACTUATOR_ENDPOINTS}：
 * 卡片目录与页面页签共用同一份元数据，这里只补两样页面才需要的东西 ——
 * 页签图标与视图组件。新增端点时改 endpoints.ts 一处即可。</p>
 *
 * @since 4.0.0.51
 */
import { defineAsyncComponent, type Component } from "vue";
import { ACTUATOR_ENDPOINTS, type ActuatorTab } from "./endpoints";

/** 单个页签的定义 */
export interface ActuatorTabDef {
  /**
   * 页签标识：同时是 URL 上的 {@code ?tab=} 值与 localStorage 里记的值。
   *
   * <p>已经发出去就不再改名 —— 旧链接、用户本地记忆都按它对齐。</p>
   */
  name: ActuatorTab;
  /** 原生端点路径（相对 {@code /actuator}） */
  path: string;
  /** 页签文案（也用于界面标题） */
  label: string;
  /** 端点用途说明（页签 title 提示） */
  description: string;
  /** 图标名（Element Plus 图标） */
  icon: string;
  /**
   * 视图组件。
   *
   * <p>用 {@code defineAsyncComponent} 而不是裸的 {@code () => import(...)}：
   * 后者交给 {@code <component :is>} 会被当成函数式组件渲染出空白，
   * 只有路由表里的 {@code component} 字段才接受裸加载函数。</p>
   */
  component: Component;
}

/**
 * 页签图标。
 *
 * <p>按「这一页在排障动线里扮演什么」选，不追求字面贴切：
 * 健康是结论（勾）、线程是资源（CPU）、定时任务是时间（闹钟）。</p>
 */
const TAB_ICONS: Record<ActuatorTab, string> = {
  health: "CircleCheck",
  info: "Document",
  metrics: "Odometer",
  env: "Tickets",
  loggers: "Setting",
  mappings: "Connection",
  beans: "Collection",
  conditions: "MagicStick",
  threaddump: "Cpu",
  configprops: "SetUp",
  scheduledtasks: "AlarmClock",
};

/**
 * 页签视图。
 *
 * <p>懒加载：11 个页签各自带着自己的表格与解析逻辑，一次性打进主 chunk
 * 会让 /actuator 的首屏只为「健康状态」付全部代价。</p>
 */
const TAB_VIEWS: Record<ActuatorTab, Component> = {
  health: defineAsyncComponent(() => import("./views/tabs/HealthView.vue")),
  info: defineAsyncComponent(() => import("./views/tabs/InfoView.vue")),
  metrics: defineAsyncComponent(() => import("./views/tabs/MetricsView.vue")),
  env: defineAsyncComponent(() => import("./views/tabs/EnvView.vue")),
  loggers: defineAsyncComponent(() => import("./views/tabs/LoggersView.vue")),
  mappings: defineAsyncComponent(() => import("./views/tabs/MappingsView.vue")),
  beans: defineAsyncComponent(() => import("./views/tabs/BeansView.vue")),
  conditions: defineAsyncComponent(() => import("./views/tabs/ConditionsView.vue")),
  threaddump: defineAsyncComponent(() => import("./views/tabs/ThreadsView.vue")),
  configprops: defineAsyncComponent(() => import("./views/tabs/ConfigPropsView.vue")),
  scheduledtasks: defineAsyncComponent(() => import("./views/tabs/ScheduledTasksView.vue")),
};

/** 全部页签，顺序即界面顺序（来自 endpoints.ts，不在这里另抄一份） */
export const ACTUATOR_TABS: ActuatorTabDef[] = ACTUATOR_ENDPOINTS.map((endpoint) => ({
  name: endpoint.key,
  path: endpoint.path,
  label: endpoint.label,
  description: endpoint.description,
  icon: TAB_ICONS[endpoint.key],
  component: TAB_VIEWS[endpoint.key],
}));

/** 工作台在 {@code ReTabs} 里的持久化标识（存储键是 `re-tabs:<id>`） */
export const ACTUATOR_WORKBENCH_ID = "actuator-workbench";

/** 记忆键：与 {@code ReTabs} 的 id 派生规则保持一致 */
export const ACTUATOR_TAB_STORAGE_KEY = `re-tabs:${ACTUATOR_WORKBENCH_ID}`;

/** 进页面时的默认页签（既没有 URL 参数、也没有本地记忆时才用它） */
export const ACTUATOR_DEFAULT_TAB: ActuatorTab = "health";

/** 全部页签名，用于校验 URL / 存储里的值是否还合法 */
export const ACTUATOR_TAB_NAMES: string[] = ACTUATOR_TABS.map((tab) => tab.name);

/**
 * 按 name 找页签。
 *
 * @param name 页签名（可能来自 URL，因此不信任其类型与合法性）
 * @returns 找到的页签；name 为空或不认识时返回 undefined
 */
export function findActuatorTab(name?: string | null): ActuatorTabDef | undefined {
  if (!name) return undefined;
  return ACTUATOR_TABS.find((tab) => tab.name === name);
}

/**
 * 这个 name 是不是一个合法页签。
 *
 * <p>URL 是外部输入：`?tab=whatever` 不能把工作台打成白屏，一律退回默认页签。</p>
 *
 * @param name 待校验的值
 */
export function isActuatorTabName(name?: string | null): boolean {
  return !!findActuatorTab(name);
}

/**
 * 页签被切到前台的事件名。
 *
 * <p>为什么不靠 {@code onActivated}：工作台用的是 {@code v-show} 常驻面板，
 * 页签视图没有被 {@code <KeepAlive>} 包住，激活钩子不会触发。而端点数据是
 * 会变的（例如别处刚改过日志级别），切回来重取一次比显示旧快照更接近事实。</p>
 *
 * <p>监听方只做静默刷新：失败不打断当前视图，也不闪加载态。</p>
 */
export const ACTUATOR_TAB_ACTIVATED_EVENT = "actuator:tab-activated";
