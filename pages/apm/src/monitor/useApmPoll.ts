/**
 * APM 卡片的轮询取数
 *
 * <p>与 Actuator 卡片的 {@code useCardResource} 同一套节奏：页面隐藏时跳过、
 * 静默刷新不闪 loading、配置里的间隔变化时重建定时器。差异只有一处：
 * <b>只有闸门放行（{@code enabled}）才发请求</b> —— 服务器没接 APM 时，
 * 卡片不该继续按秒打 {@code /api/apm/v1/**}。</p>
 *
 * @since 4.0.0.51
 */
import { onBeforeUnmount, ref, watch, type Ref } from "vue";

/** 轮询结果 */
export interface ApmPoll<T> {
  /** 最近一次成功的数据，null 表示还没有 */
  data: Ref<T | null>;
  /** 请求中（静默刷新不置位） */
  loading: Ref<boolean>;
  /** 最近一次失败原因 */
  error: Ref<string>;
  /** 最近成功时间戳（毫秒） */
  updatedAt: Ref<number>;
  /** 立即拉取；silent = 不闪 loading */
  reload: (silent?: boolean) => Promise<void>;
}

/** 最小间隔：再小就变成对后端做压测了 */
const MIN_INTERVAL_SEC = 5;

/**
 * 建一个轮询。
 *
 * @param getEnabled   闸门是否放行（传 getter，状态变化时自动启停）
 * @param fetcher      取数函数
 * @param getIntervalSec 轮询间隔（秒），0 / 非法值 = 不轮询
 */
export function useApmPoll<T>(
  getEnabled: () => boolean,
  fetcher: () => Promise<T>,
  getIntervalSec: () => number,
): ApmPoll<T> {
  const data = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const error = ref("");
  const updatedAt = ref(0);

  let timer: number | undefined;
  /** 请求序号：闸门关闭 / 新请求发起后，旧响应直接丢弃 */
  let ticker = 0;

  function stop(): void {
    if (timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  }

  function start(): void {
    stop();
    const sec = Number(getIntervalSec());
    if (!Number.isFinite(sec) || sec <= 0) return;
    timer = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void reload(true);
    }, Math.max(MIN_INTERVAL_SEC, sec) * 1000);
  }

  async function reload(silent = false): Promise<void> {
    if (!getEnabled()) return;
    const tag = ++ticker;
    if (!silent) {
      loading.value = true;
      error.value = "";
    }
    try {
      const res = await fetcher();
      if (tag !== ticker) return;
      data.value = res;
      updatedAt.value = Date.now();
      error.value = "";
    } catch (e) {
      if (tag !== ticker) return;
      error.value = (e as Error)?.message || String(e);
    } finally {
      if (tag === ticker) loading.value = false;
    }
  }

  // 闸门开关（首次挂载时 immediate 触发一次）：放行才开始取数 + 轮询
  watch(
    getEnabled,
    (on) => {
      if (on) {
        void reload();
        start();
      } else {
        stop();
        ticker += 1;
      }
    },
    { immediate: true },
  );

  // 间隔变化：重建定时器（当前数据保留，下一次按新间隔刷新）
  watch(getIntervalSec, () => {
    if (getEnabled()) start();
  });

  onBeforeUnmount(stop);

  return { data, loading, error, updatedAt, reload };
}
