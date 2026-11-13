/**
 * 顶栏条目注册表（koi Header）
 *
 * <p>把原来写死在 ReToolbar 模板里的 16 个组件收敛成一张有序表，目的是让
 * 「有哪些条目、按什么顺序、窄屏留谁」都能由 app.yaml `other.toolbar.items`
 * 决定，而不是每加一个条目就要动模板 + 设置抽屉 + 4 条 i18n。</p>
 *
 * <p>两种运行模式：</p>
 * <ul>
 *   <li><b>未配 items</b>（存量应用）：按 {@link HEADER_ITEMS} 的固有顺序渲染，
 *       与改造前逐条等价；</li>
 *   <li><b>配了 items</b>：按 yaml 给的顺序渲染，只要列出的条目；
 *       扩展条目（{@link HEADER_EXTRA_ITEMS}，如 envBadge）也只在此模式下出现，
 *       保证新增组件不会意外现身于存量应用。</li>
 * </ul>
 *
 * <p>内置条目的显隐真相仍是 `other.toolbar.<key>` 布尔（`flag`），items 不改变它；
 * 业务条件（天气是否启用、能力是否部署、计时器/大屏开关、汇率/台风等后台能力）由 `enabled` 表达。</p>
 */
import type { Component } from "vue";
import type { AppConfig } from "@repo/config";
import type { HeaderFlagKey } from "./headerKeys";

import ReTopMenus from "@repo/theme/koi/layouts/components/Header/components/ReTopMenus.vue";
import ReSearchMenu from "@repo/theme/koi/layouts/components/Header/components/ReSearchMenu.vue";
import Refresh from "@repo/theme/koi/layouts/components/Header/components/Refresh.vue";
import ReStationMessage from "@repo/ui/re-station-message";
import ReDark from "@repo/theme/koi/layouts/components/Header/components/ReDark.vue";
import ReLanguage from "@repo/theme/koi/layouts/components/Header/components/ReLanguage.vue";
import ReFullScreen from "@repo/theme/koi/layouts/components/Header/components/ReFullScreen.vue";
import ReThemeSetting from "@repo/theme/koi/layouts/components/Header/components/ReThemeSetting.vue";
import ReUser from "@repo/theme/koi/layouts/components/Header/components/ReUser.vue";
import ReBigscreen from "@repo/theme/koi/layouts/components/Header/components/ReBigscreen.vue";
import ReTimer from "@repo/theme/koi/layouts/components/Header/components/ReTimer.vue";
import ReWeather from "@repo/theme/koi/layouts/components/Header/components/ReWeather.vue";
import ReExchangeRate from "@repo/theme/koi/layouts/components/Header/components/ReExchangeRate.vue";
import ReTyphoon from "@repo/theme/koi/layouts/components/Header/components/ReTyphoon.vue";
import ReEnvBadge from "@repo/theme/koi/layouts/components/Header/components/ReEnvBadge.vue";
import ReAlerts from "@repo/theme/koi/layouts/components/Header/components/ReAlerts.vue";
import ReNoteEntry from "@repo/theme/koi/layouts/components/Header/components/ReNoteEntry.vue";

/** 注册表求值上下文（避免各条目自己重复读 getConfig / 能力开关） */
export interface HeaderItemContext {
  toolbar: AppConfig["other"]["toolbar"];
  timer: AppConfig["other"]["timer"];
  weather: AppConfig["other"]["weather"];
  bigscreen: AppConfig["other"]["bigscreen"];
  /** 业务能力是否启用（见 @repo/core BACKEND_CAPABILITIES） */
  capability: (key: string) => boolean;
}

/** 一条顶栏条目 */
export interface HeaderItemDef {
  /** 条目键，app.yaml `other.toolbar.items[].key` 用它引用 */
  key: string;
  /** Vue 组件 */
  component: Component;
  /**
   * 对应的 `other.toolbar.<key>` 布尔键。
   * 不填表示该条目没有独立布尔开关（如 topMenus 恒显示；扩展条目由 items 决定）。
   * 取值必须来自 headerKeys.ts 的 HEADER_FLAG_KEYS，保证设置抽屉能识别它属于顶栏。
   */
  flag?: HeaderFlagKey;
  /**
   * 是否跟随「工具栏折叠」：true（默认）= 折叠时隐藏；false = 始终显示。
   * 历史上 user/bigscreen/timer/weather/typhoon/topMenus 都是始终显示的。
   */
  collapsible?: boolean;
  /** 默认优先级：high=折叠/窄屏也保留（items 未显式声明时使用） */
  priority?: "high" | "normal";
  /** 布尔开关之外的额外显隐条件 */
  enabled?: (ctx: HeaderItemContext) => boolean;
  /**
   * 是否用 v-show 隐藏（保留组件实例）而不是 v-if 卸载。
   * ReSearchMenu 历史上用 v-show，卸载重建会丢搜索态，这里保持原行为。
   */
  keepMounted?: boolean;
  /** 组件是否接受 `options` 这个 prop（不接受就不传，避免落到根元素的 HTML 属性上） */
  acceptsOptions?: boolean;
}

/**
 * 内置条目（顺序 = 改造前 ReToolbar 模板里的顺序）。
 *
 * 改动这里的顺序会改掉所有未配 `items` 的应用的顶栏布局，加条目请优先放进
 * {@link HEADER_EXTRA_ITEMS}。
 */
export const HEADER_ITEMS: readonly HeaderItemDef[] = [
  // 顶部菜单（菜单管理里「菜单位置=顶部」的菜单），历史上恒显示、无布尔开关
  { key: "topMenus", component: ReTopMenus, collapsible: false },
  { key: "searchMenu", component: ReSearchMenu, flag: "searchMenu", keepMounted: true },
  { key: "refresh", component: Refresh, flag: "refresh" },
  { key: "message", component: ReStationMessage, flag: "message" },
  {
    key: "quickNote",
    component: ReNoteEntry,
    flag: "quickNote",
  },
  { key: "dark", component: ReDark, flag: "dark" },
  { key: "language", component: ReLanguage, flag: "language" },
  { key: "fullScreen", component: ReFullScreen, flag: "fullScreen" },
  { key: "themeSetting", component: ReThemeSetting, flag: "themeSetting" },
  { key: "user", component: ReUser, flag: "user", collapsible: false },
  {
    key: "bigscreen",
    component: ReBigscreen,
    collapsible: false,
    enabled: (ctx) => !!ctx.bigscreen?.enable,
  },
  {
    key: "timer",
    component: ReTimer,
    collapsible: false,
    enabled: (ctx) => !!ctx.timer?.enable,
  },
  {
    key: "weather",
    component: ReWeather,
    flag: "weather",
    collapsible: false,
    enabled: (ctx) => ctx.weather?.enable !== false && ctx.capability("weather"),
  },
  {
    key: "exchangeRate",
    component: ReExchangeRate,
    flag: "exchangeRate",
    collapsible: false,
    enabled: (ctx) => ctx.capability("exchangeRate"),
  },
  {
    key: "typhoon",
    component: ReTyphoon,
    flag: "typhoon",
    collapsible: false,
    enabled: (ctx) => ctx.capability("typhoon"),
  },
];

/**
 * 扩展条目：只有 app.yaml 显式写进 `other.toolbar.items` 才会渲染。
 *
 * 之所以与内置条目分开，是为了让「新增一个顶栏组件」不需要同时改
 * 所有存量应用的 app.yaml —— 不写就不出现。
 */
export const HEADER_EXTRA_ITEMS: readonly HeaderItemDef[] = [
  {
    key: "envBadge",
    component: ReEnvBadge,
    collapsible: false,
    priority: "high",
    acceptsOptions: true,
  },
  {
    key: "alerts",
    component: ReAlerts,
    collapsible: false,
    priority: "high",
    acceptsOptions: true,
  },
];

/** 键 → 条目（内置 + 扩展） */
export const HEADER_ITEM_MAP: ReadonlyMap<string, HeaderItemDef> = new Map(
  [...HEADER_ITEMS, ...HEADER_EXTRA_ITEMS].map((def) => [def.key, def]),
);
