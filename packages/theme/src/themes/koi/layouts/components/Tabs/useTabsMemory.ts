/**
 * 页签内存占用估算（app.yaml other.tabsBar.memoryTip）
 *
 * <p><b>为什么是估算而不是精确值：</b>浏览器不提供「某个组件占多少内存」的 API。
 * 唯一可用的观测是 Chromium 的 {@code performance.memory}（非标准，其它浏览器没有），
 * 它给的是整个页面的 JS 堆用量。本模块的做法是：</p>
 *
 * <ol>
 *   <li>页签激活期间每 2 秒采一次堆用量；</li>
 *   <li>页签「激活 → 切走」这一段，取<b>峰值 − 刚激活时的基线</b>作为该页签的估算值
 *       （这段区间里长出来的堆基本都是这个页面挂载 / 拉数据带来的）；</li>
 *   <li>只增不减：同一页签多次访问取历史最大值 —— 页签切走后堆不会立刻回收，
 *       当前值反而会偏低。</li>
 * </ol>
 *
 * <p>因此这个数字只能用来<b>横向比较哪个页签更重</b>（差一个数量级是可信的），
 * 不能当精确值引用。悬浮提示里也按「估算」措辞。</p>
 *
 * <p>采样只在有页签悬浮时才会被读到，但定时器常开 —— 所以这里做了两件事控制开销：
 * 页面不可见（切到别的窗口 / 别的 tab）时暂停采样，恢复可见后重新取基线。</p>
 */
import { onBeforeUnmount, ref, watch, type Ref } from "vue";

/** Chromium 专有的 performance.memory */
interface ChromiumMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/** 采样间隔（毫秒） */
const SAMPLE_INTERVAL = 2000;

/** 单个页签的采样基线 */
interface SampleState {
  base: number;
  peak: number;
}

export interface TabsMemoryHandle {
  /** 是否支持采样（非 Chromium 为 false，提示里显示「不支持采样」） */
  supported: Ref<boolean>;
  /** 读取某页签的估算内存（字节）；没采到过返回 null */
  getMemory: (path: string) => number | null;
  /** 格式化（1.2 MB / 840 KB）；无数据返回空串 */
  formatMemory: (path: string) => string;
}

function readHeap(): number | null {
  if (typeof performance === "undefined") return null;
  const memory = (performance as Performance & { memory?: ChromiumMemory }).memory;
  if (!memory || typeof memory.usedJSHeapSize !== "number") return null;
  return memory.usedJSHeapSize;
}

/** 字节 → 人类可读（保留一位小数，KB 以下按 B 显示） */
export function formatBytes(bytes: number | null): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

export function useTabsMemory(activePath: Ref<string>, enabled: Ref<boolean>): TabsMemoryHandle {
  const supported = ref(readHeap() !== null);
  /** path → 估算内存（字节） */
  const memoryMap = ref<Record<string, number>>({});
  const samples = new Map<string, SampleState>();

  let timer: ReturnType<typeof setInterval> | null = null;

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  /** 取一次样：更新当前激活页签的峰值 */
  const sample = () => {
    const heap = readHeap();
    if (heap == null) {
      supported.value = false;
      stop();
      return;
    }
    supported.value = true;
    const path = activePath.value;
    if (!path) return;
    const state = samples.get(path);
    if (!state) {
      // 首次见到这个页签：当下即基线，估算从 0 起
      samples.set(path, { base: heap, peak: heap });
      return;
    }
    if (heap > state.peak) {
      state.peak = heap;
      const estimate = Math.max(0, state.peak - state.base);
      // 小于 64KB 的增量是噪声（一次 GC 抖动就能差这么多），不写进 map
      if (estimate >= 64 * 1024) {
        memoryMap.value = { ...memoryMap.value, [path]: estimate };
      }
    }
  };

  const restart = () => {
    stop();
    if (!enabled.value) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    sample();
    timer = setInterval(sample, SAMPLE_INTERVAL);
  };

  const onVisibility = () => {
    if (typeof document === "undefined") return;
    if (document.visibilityState === "hidden") {
      stop();
      return;
    }
    // 回前台：堆已经变过，旧基线不再有意义，重新取
    const path = activePath.value;
    if (path) samples.delete(path);
    restart();
  };

  // 切页签：旧页签的估算已经记在 map 里，新页签重新取基线
  watch(
    () => activePath.value,
    (path) => {
      if (!path) return;
      const heap = readHeap();
      if (heap != null) samples.set(path, { base: heap, peak: heap });
    },
  );

  watch(
    () => enabled.value,
    () => {
      if (enabled.value) restart();
      else stop();
    },
    { immediate: true },
  );

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibility);
  }

  onBeforeUnmount(() => {
    stop();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibility);
    }
  });

  return {
    supported,
    getMemory: (path: string) => memoryMap.value[path] ?? null,
    formatMemory: (path: string) => formatBytes(memoryMap.value[path] ?? null),
  };
}
