/**
 * @pages/apm 单页工作台的页签表。
 *
 * <p>为什么从「一个功能一个菜单」改成「一个菜单 + 页签」：APM 的 12 个视图
 * 本来是同一个使用场景里的不同切面（先看总览，再钻服务，再翻链路，最后看告警），
 * 拆成 12 条侧边栏会让导航比内容还长，而且每次切页都要重新走一次路由、
 * 重建整页。收成一条菜单后，页签条只做「当前看哪一面」的定位。</p>
 *
 * <p>这里只放「页签是什么」，不放「怎么渲染」：路由、URL 同步、记忆与弹窗
 * 都在 {@code views/Workbench.vue} 里，两者共用本表的 {@code name}，
 * 所以「页签名」与「URL 上的 tab」永远是同一个值，不会出现半套映射。</p>
 *
 * @since 4.0.0.51
 */
import { defineAsyncComponent, type Component } from "vue";

/** 单个页签的定义 */
export interface ApmTabDef {
  /**
   * 页签标识：同时是 URL 上的 {@code ?tab=} 值与 localStorage 里记的值。
   *
   * <p>已经发出去就不再改名 —— 旧链接、用户本地记忆都按它对齐。</p>
   */
  name: string;
  /** 页签文案（也用于侧边栏之外的界面标题） */
  label: string;
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
 * 12 个页签，顺序即界面顺序。
 *
 * <p>顺序按使用动线排：整体状况 → 服务下钻 → 链路与拓扑 → 指标与剖析 → 告警与日志。
 * 「告警」与「告警分析」保持两个页签：前者是事件流水，后者按规则聚合，
 * 默认时间窗和筛选维度都不同，合成一个反而两边都别扭。</p>
 */
export const APM_TABS: ApmTabDef[] = [
  {
    name: "overview",
    label: "总览",
    icon: "DataLine",
    component: defineAsyncComponent(() => import("./views/Overview.vue")),
  },
  {
    name: "services",
    label: "服务",
    icon: "List",
    component: defineAsyncComponent(() => import("./views/Services.vue")),
  },
  {
    name: "endpoints",
    label: "端点",
    icon: "Aim",
    component: defineAsyncComponent(() => import("./views/Endpoints.vue")),
  },
  {
    name: "traces",
    label: "链路",
    icon: "Document",
    component: defineAsyncComponent(() => import("./views/Traces.vue")),
  },
  {
    name: "topology",
    label: "拓扑",
    icon: "Share",
    component: defineAsyncComponent(() => import("./views/Topology.vue")),
  },
  {
    name: "infra-3d",
    label: "3D 基础设施",
    icon: "Box",
    component: defineAsyncComponent(() => import("./views/Infra3D.vue")),
  },
  {
    name: "compare",
    label: "多实体对比",
    icon: "DataAnalysis",
    component: defineAsyncComponent(() => import("./views/Compare.vue")),
  },
  {
    name: "metrics",
    label: "指标",
    icon: "TrendCharts",
    component: defineAsyncComponent(() => import("./views/Metrics.vue")),
  },
  {
    name: "profiles",
    label: "剖析",
    icon: "Timer",
    component: defineAsyncComponent(() => import("./views/Profiles.vue")),
  },
  {
    name: "alarms",
    label: "告警",
    icon: "Bell",
    component: defineAsyncComponent(() => import("./views/Alarms.vue")),
  },
  {
    name: "alerts",
    label: "告警分析",
    icon: "Warning",
    component: defineAsyncComponent(() => import("./views/Alerts.vue")),
  },
  {
    name: "logs",
    label: "日志",
    icon: "Tickets",
    component: defineAsyncComponent(() => import("./views/Logs.vue")),
  },
];

/** 工作台在 {@code ReTabs} 里的持久化标识（存储键是 `re-tabs:<id>`） */
export const APM_WORKBENCH_ID = "apm-workbench";

/** 记忆键：与 {@code ReTabs} 的 id 派生规则保持一致，验收脚本也按这个键校验 */
export const APM_TAB_STORAGE_KEY = `re-tabs:${APM_WORKBENCH_ID}`;

/** 进页面时的默认页签（既没有 URL 参数、也没有本地记忆时才用它） */
export const APM_DEFAULT_TAB = "overview";

/** 全部页签名，用于校验 URL / 存储里的值是否还合法 */
export const APM_TAB_NAMES: string[] = APM_TABS.map(tab => tab.name);

/**
 * 按 name 找页签。
 *
 * @param name 页签名（可能来自 URL，因此不信任其类型与合法性）
 * @returns 找到的页签；name 为空或不认识时返回 undefined
 */
export function findApmTab(name?: string | null): ApmTabDef | undefined {
  if (!name) return undefined;
  return APM_TABS.find(tab => tab.name === name);
}

/**
 * 这个 name 是不是一个合法页签。
 *
 * <p>URL 是外部输入：`?tab=whatever` 不能把工作台打成白屏，一律退回默认页签。</p>
 *
 * @param name 待校验的值
 */
export function isApmTabName(name?: string | null): boolean {
  return !!findApmTab(name);
}

/**
 * 跨视图切页签的事件名。
 *
 * <p>为什么要事件而不是 `router.push`：宿主给路由组件挂了
 * `:key="route.fullPath"`，改 query 会重建整页 —— 页签保活就失去意义了。
 * 事件让「总览点一条服务 → 跳到服务页签」保持在同一个工作台实例里。</p>
 */
export const APM_OPEN_TAB_EVENT = "apm:open-tab";

/**
 * 请求工作台切到某个页签。
 *
 * <p>名字会先校验：调用方可能把 URL 参数直接透传进来，
 * 一个不存在的页签名不应该把工作台打成空白。</p>
 *
 * @param name 页签名
 */
export function openApmTab(name: string): void {
  if (!isApmTabName(name)) return;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(APM_OPEN_TAB_EVENT, { detail: name }));
}
