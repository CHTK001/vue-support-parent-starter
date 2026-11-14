/**
 * 页签自动休眠（app.yaml other.tabsBar.sleep）
 *
 * <p>「休眠」= 把该页签的组件名从 keep-alive 的 include 里摘掉。Vue 的 KeepAlive
 * 会 watch include，摘掉的缓存实例随即被卸载，其中一切状态（表格数据、表单草稿、
 * 定时器）一并释放。用户再次点开时组件按新页面挂载 —— 这是「用状态换内存」的取舍，
 * 所以默认延迟给到 5 分钟，且固定页签（isAffix=1）与 exclude 命中的路由永不休眠。</p>
 *
 * <p>时序上有一处必须注意：<b>先唤醒再导航</b>。用户点回休眠页签时，
 * 组件要在本次渲染就进 include，否则 KeepAlive 会先把它当普通组件挂载、
 * 下一次切换又整块重挂 —— 表现是「点了两次才对」。因此这里同时 watch
 * 页签列表（点回时 activePath 变更前 tabList 不会变，靠 wake 保证幂等）
 * 与 activePath（变更即 wake）。</p>
 */
import { computed, onBeforeUnmount, ref, watch, type InjectionKey, type Ref } from "vue";
import useKeepAliveStore from "@repo/pinia/modules/keepAlive";
import useTabsStore from "@repo/pinia/modules/tabs";

/**
 * 休眠能力的注入键。
 *
 * <p>右键菜单是页签栏（Tabs/index.vue）的子组件，两条链路共用一个休眠实例：
 * 菜单里「立即休眠」调的是同一个 handle，页面点的「唤醒」也走它 ——
 * 各建一份会各自记 sleepingPaths，标记就闪掉了。</p>
 */
export const TABS_SLEEP_KEY: InjectionKey<TabsSleepHandle> = Symbol("koi-tabs-sleep");

export interface TabsSleepOptions {
  /** 当前激活页签的 path */
  activePath: Ref<string>;
  /** 是否启用自动休眠 */
  enabled: Ref<boolean>;
  /** 切走后多久休眠（毫秒，0=切走即休眠） */
  delay: Ref<number>;
  /** 常驻路由（path 前缀），命中的页签不休眠 */
  exclude: Ref<string[]>;
}

export interface TabsSleepHandle {
  /** 当前处于休眠态的 path 列表（模板用） */
  sleepingPaths: Ref<string[]>;
  /** 某个 path 是否休眠中 */
  isSleeping: (path: string) => boolean;
  /** 立即让某个 path 休眠（右键菜单「立即休眠」用） */
  sleepNow: (path: string) => void;
  /** 唤醒某个 path（点回页签 / 恢复固定时用） */
  wake: (path: string) => void;
  /** 清掉全部休眠态（关闭所有页签后统一复位） */
  wakeAll: () => void;
}

/** 前缀匹配：`/ai` 命中 `/ai` 与 `/ai/chat`，不命中 `/ai2` */
function matchPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => {
    if (!prefix) return false;
    if (path === prefix) return true;
    const normalized = prefix.endsWith("/") ? prefix : `${prefix}/`;
    return path.startsWith(normalized);
  });
}

export function useTabsSleep(options: TabsSleepOptions): TabsSleepHandle {
  const keepAliveStore = useKeepAliveStore();
  const tabsStore = useTabsStore();

  const sleepingPaths = ref<string[]>([]);
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const findTab = (path: string) =>
    (tabsStore.tabList as any[]).find((item) => item?.path === path) ?? null;

  const isSleeping = (path: string) => sleepingPaths.value.includes(path);

  const clearTimer = (path: string) => {
    const timer = timers.get(path);
    if (timer) {
      clearTimeout(timer);
      timers.delete(path);
    }
  };

  const wake = (path: string) => {
    if (!path) return;
    clearTimer(path);
    if (!isSleeping(path)) return;
    sleepingPaths.value = sleepingPaths.value.filter((item) => item !== path);
    const tab = findTab(path);
    // 只有 isKeepAlive 的页签本来在 include 里；其它页签从没被缓存过，无需恢复
    if (tab?.isKeepAlive) {
      const name = tab.keepAliveName ?? tab.name;
      if (name && !keepAliveStore.keepAliveName.includes(name)) {
        keepAliveStore.addKeepAliveName(name);
      }
    }
  };

  const sleep = (path: string) => {
    clearTimer(path);
    if (!path || path === options.activePath.value) return;
    if (!options.enabled.value) return;
    const tab = findTab(path);
    // 固定页签（首页、常驻入口）不参与休眠
    if (!tab || tab.isAffix === "1") return;
    if (matchPrefix(path, options.exclude.value)) return;
    const name = tab.keepAliveName ?? tab.name;
    if (!name) return;
    // 没有缓存可释放时什么都不做，避免给没开缓存的页签留下假的「休眠中」
    if (!keepAliveStore.keepAliveName.includes(name)) return;
    keepAliveStore.removeKeepAliveName(name);
    if (!isSleeping(path)) sleepingPaths.value = [...sleepingPaths.value, path];
  };

  const sleepNow = (path: string) => {
    clearTimer(path);
    sleep(path);
  };

  const schedule = (path: string) => {
    clearTimer(path);
    if (!path) return;
    if (!options.enabled.value) {
      wake(path);
      return;
    }
    const delay = Math.max(0, Number(options.delay.value) || 0);
    timers.set(
      path,
      setTimeout(() => {
        timers.delete(path);
        sleep(path);
      }, delay),
    );
  };

  // 切走 → 给旧页签排定时器；切回 → 立刻唤醒（先于组件渲染）
  watch(
    () => options.activePath.value,
    (now, prev) => {
      if (now) wake(now);
      if (prev && prev !== now) schedule(prev);
    },
    { immediate: true },
  );

  // 关掉开关：所有休眠中的页签立刻恢复（下个 tick 重新挂载，与切回一致）
  watch(
    () => options.enabled.value,
    (enabled) => {
      if (enabled) return;
      [...sleepingPaths.value].forEach((path) => wake(path));
      timers.forEach((_, path) => clearTimer(path));
    },
  );

  // 页签被关掉后清掉它的休眠记录，避免 sleepingPaths 里留死路径；
  // 同时「再断言」一次：closeSideTabs / closeManyTabs 会用 tabList 重建 include 列表，
  // 把休眠中的页签又加了回去（组件已卸载，加回去也不会重新挂载，但标记与真实缓存不一致）
  watch(
    () => (tabsStore.tabList as any[]).map((item) => item?.path).join("|"),
    () => {
      const alive = new Set((tabsStore.tabList as any[]).map((item) => item?.path));
      const next = sleepingPaths.value.filter((path) => alive.has(path));
      if (next.length !== sleepingPaths.value.length) sleepingPaths.value = next;
      timers.forEach((_, path) => {
        if (!alive.has(path)) clearTimer(path);
      });
      for (const path of sleepingPaths.value) {
        const tab = findTab(path);
        const name = tab?.keepAliveName ?? tab?.name;
        if (name && keepAliveStore.keepAliveName.includes(name)) {
          keepAliveStore.removeKeepAliveName(name);
        }
      }
    },
  );

  onBeforeUnmount(() => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
  });

  return {
    sleepingPaths,
    isSleeping,
    sleepNow,
    wake,
    wakeAll: () => [...sleepingPaths.value].forEach((path) => wake(path)),
  };
}

/** 休眠中的页签数量（给设置面板提示用） */
export function useSleepingCount(handle: TabsSleepHandle) {
  return computed(() => handle.sleepingPaths.value.length);
}
