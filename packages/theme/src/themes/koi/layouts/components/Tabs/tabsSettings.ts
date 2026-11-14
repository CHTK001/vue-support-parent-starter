/**
 * 多标签页栏的「部署默认 + 用户偏好」解析层
 *
 * <p>与顶栏同一套双开关口径（见 Header/toolbarPrefs.ts）：</p>
 * <ul>
 *   <li>部署侧 app.yaml 的 {@code other.tabsBar} 是默认值 —— 决定「这个应用默认长什么样」；</li>
 *   <li>用户在主题配置抽屉里改的存本机 localStorage（globalStore 的 tabs* 字段），
 *       刷新 / 重登保持，不影响其他账号；</li>
 *   <li>用户没改过的项留 {@code undefined}，取值时回落到部署默认 ——
 *       换 app.yaml 后未改过的项自动跟着变，不会因为一次落盘就永久钉住。</li>
 * </ul>
 *
 * <p>读值一律走本模块的 {@code useTabsBarSettings()}：它把 yaml 里可能的脏值
 * （字符串、超范围、缺节）统一收敛成合法值，组件里不再各自做兜底。</p>
 */
import { computed, type ComputedRef } from "vue";
import { getConfig, type TabsBarConfig } from "@repo/config";
import useGlobalStore from "@repo/pinia/modules/global";

/** 页签最小宽度的可配置区间（px） */
export const TAB_MIN_WIDTH_RANGE = { min: 0, max: 240 } as const;

/** 休眠延迟的上限（毫秒）：1 小时。超过按 1 小时算，避免写错单位导致永不触发 */
export const TAB_SLEEP_DELAY_MAX = 3600000;

/** 与 defaultAppConfig.other.tabsBar 保持一致（yaml 未加载时的兜底） */
const FALLBACK: TabsBarConfig = {
  inactiveDimmed: true,
  minWidth: 96,
  wheelSwitch: true,
  sleep: { enable: true, delay: 300000, exclude: [] },
  memoryTip: { enable: true },
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function toNumber(value: unknown, fallback: number): number {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** 部署侧 yaml 的归一化结果（缺节 / 脏值都收敛掉） */
function resolveDeployed(): Required<TabsBarConfig> {
  const raw = (getConfig()?.other?.tabsBar ?? {}) as Partial<TabsBarConfig>;
  const sleep = (raw.sleep ?? {}) as Partial<TabsBarConfig["sleep"]>;
  const memoryTip = (raw.memoryTip ?? {}) as Partial<TabsBarConfig["memoryTip"]>;
  return {
    inactiveDimmed: toBool(raw.inactiveDimmed, FALLBACK.inactiveDimmed),
    minWidth: clamp(
      toNumber(raw.minWidth, FALLBACK.minWidth),
      TAB_MIN_WIDTH_RANGE.min,
      TAB_MIN_WIDTH_RANGE.max,
    ),
    wheelSwitch: toBool(raw.wheelSwitch, FALLBACK.wheelSwitch),
    sleep: {
      enable: toBool(sleep.enable, FALLBACK.sleep.enable),
      delay: clamp(toNumber(sleep.delay, FALLBACK.sleep.delay), 0, TAB_SLEEP_DELAY_MAX),
      exclude: Array.isArray(sleep.exclude) ? sleep.exclude.map((item) => String(item)) : [],
    },
    memoryTip: {
      enable: toBool(memoryTip.enable, FALLBACK.memoryTip.enable),
    },
  };
}

/** 用户偏好字段（globalStore 上的键） */
export type TabsPrefKey =
  | "tabsInactiveDimmed"
  | "tabsMinWidth"
  | "tabsWheelSwitch"
  | "tabsSleepEnabled"
  | "tabsSleepDelay"
  | "tabsMemoryTip";

export interface TabsBarSettings {
  /** 未激活页签置灰 */
  inactiveDimmed: ComputedRef<boolean>;
  /** 页签最小宽度（px，0=不限制） */
  minWidth: ComputedRef<number>;
  /** 滚轮切换页签 */
  wheelSwitch: ComputedRef<boolean>;
  /** 未激活页签自动休眠 */
  sleepEnabled: ComputedRef<boolean>;
  /** 休眠延迟（毫秒） */
  sleepDelay: ComputedRef<number>;
  /** 不休眠的路由前缀 */
  sleepExclude: ComputedRef<string[]>;
  /** 悬浮显示内存占用 */
  memoryTip: ComputedRef<boolean>;
  /** 写用户偏好（主题配置抽屉用） */
  setPref: (key: TabsPrefKey, value: boolean | number | undefined) => void;
  /** 恢复默认（清掉全部用户偏好，回到 app.yaml 口径） */
  resetPrefs: () => void;
}

/**
 * 读取运行时页签栏配置。
 *
 * <p>必须在组件 setup 内调用（依赖 pinia 实例）。返回的都是 computed，
 * 抽屉里改完立即生效，不需要刷新。</p>
 */
export function useTabsBarSettings(): TabsBarSettings {
  const globalStore = useGlobalStore();

  const deployed = computed(() => resolveDeployed());

  const fromPref = <T extends boolean | number>(
    pref: unknown,
    fallback: T,
  ): T => (typeof pref === typeof fallback ? (pref as T) : fallback);

  return {
    inactiveDimmed: computed(() =>
      fromPref(globalStore.tabsInactiveDimmed, deployed.value.inactiveDimmed),
    ),
    minWidth: computed(() =>
      clamp(
        fromPref(globalStore.tabsMinWidth, deployed.value.minWidth),
        TAB_MIN_WIDTH_RANGE.min,
        TAB_MIN_WIDTH_RANGE.max,
      ),
    ),
    wheelSwitch: computed(() =>
      fromPref(globalStore.tabsWheelSwitch, deployed.value.wheelSwitch),
    ),
    sleepEnabled: computed(() =>
      fromPref(globalStore.tabsSleepEnabled, deployed.value.sleep.enable),
    ),
    sleepDelay: computed(() =>
      clamp(
        fromPref(globalStore.tabsSleepDelay, deployed.value.sleep.delay),
        0,
        TAB_SLEEP_DELAY_MAX,
      ),
    ),
    sleepExclude: computed(() => deployed.value.sleep.exclude),
    memoryTip: computed(() => fromPref(globalStore.tabsMemoryTip, deployed.value.memoryTip.enable)),
    setPref: (key, value) => {
      globalStore.setGlobalState(key, value);
    },
    resetPrefs: () => {
      globalStore.setGlobalState("tabsInactiveDimmed", undefined);
      globalStore.setGlobalState("tabsMinWidth", undefined);
      globalStore.setGlobalState("tabsWheelSwitch", undefined);
      globalStore.setGlobalState("tabsSleepEnabled", undefined);
      globalStore.setGlobalState("tabsSleepDelay", undefined);
      globalStore.setGlobalState("tabsMemoryTip", undefined);
    },
  };
}
