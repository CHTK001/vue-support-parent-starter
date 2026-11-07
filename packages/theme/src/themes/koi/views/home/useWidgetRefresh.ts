/**
 * 首页 widget 全局刷新调度
 *
 * 主逻辑在 `widgets/refresh.worker.ts`（tick 循环）+ `widgets/refreshRegistry.ts`
 * （tick 领取）。本文件负责：
 *   - 创建 worker 并传入 tick 周期
 *   - 编辑期 / 设置弹窗打开时暂停 worker，退出时恢复
 *   - 页面卸载时回收 worker
 *
 * 使用方式（home/index.vue）：
 * ```
 * useWidgetRefresh(() => editMode.value || settingsVisible.value);
 * ```
 *
 * @param paused    返回页面是否处于编辑/弹窗/保存期
 * @param interval  tick 循环周期（ms），默认 30 s
 */
import { onBeforeUnmount, onMounted, watch } from "vue";
import { refreshTick } from "./widgets/refreshRegistry";

/** 编辑/设置/保存期 worker 不产生 tick */
let pauseDebounce: ReturnType<typeof setTimeout> | null = null;

export function useWidgetRefresh(paused: () => boolean, interval: number = 30_000): void {
  let worker: Worker | null = null;

  function start(): void {
    if (worker) return;
    worker = new Worker(new URL("./widgets/refresh.worker.ts", import.meta.url));
    worker.postMessage({ type: "start", interval });
    worker.onmessage = (e: MessageEvent) => {
      if (e.data?.type === "tick") refreshTick();
    };
  }

  function pause(): void {
    if (pauseDebounce) return;
    pauseDebounce = setTimeout(() => { worker?.postMessage({ type: "pause" }); pauseDebounce = null; }, 0);
  }

  function resume(): void { worker?.postMessage({ type: "resume" }); }

  onMounted(start);

  /** 响应 `editMode` / `settingsVisible` 等翻页状态的变化 */
  watch(paused, (open) => {
    if (open) pause();
    else resume();
  });

  onBeforeUnmount(() => {
    worker?.terminate();
    worker = null;
  });
}
