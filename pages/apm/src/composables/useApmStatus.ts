/**
 * APM 状态的全局共享态。
 *
 * <p>为什么是「模块级单例」而不是每个页面各建一个：</p>
 * <ol>
 *   <li>需求 2.1 要求「前端先请求 APM 接口确认本服务器是否开启 APM」，
 *       这个判断应当全站只有一份结论 —— 两页结论不一致会让用户以为系统在抖；</li>
 *   <li>9 个页面同时挂载时各自探活会把后端 {@code /status} 打穿，
 *       共享态 + {@code api} 层的 15s 缓存保证只发一次请求。</li>
 * </ol>
 *
 * @since 4.0.0.51
 */
import { computed, reactive } from "vue";
import { getApmStatus, resetApmStatusCache, type ApmStatus } from "../api/apmApi";

/** 共享状态 */
interface ApmStatusState {
  /** 后端返回的状态描述，null 表示还没取到 */
  status: ApmStatus | null;
  /** 请求中 */
  loading: boolean;
  /** 请求失败原因（后端不可达等），成功时为空串 */
  error: string;
}

const state = reactive<ApmStatusState>({
  status: null,
  loading: false,
  error: "",
});

/**
 * 拉取状态（并发去重由 api 层保证，这里只维护 loading / error）
 *
 * @param force 忽略缓存强制重探
 */
export async function loadApmStatus(force = false): Promise<void> {
  state.loading = true;
  state.error = "";
  try {
    state.status = await getApmStatus(force);
  } catch (e) {
    state.error = (e as Error)?.message || String(e);
  } finally {
    state.loading = false;
  }
}

/** 重新探测（清缓存 + 强制拉取） */
export async function refreshApmStatus(): Promise<void> {
  resetApmStatusCache();
  await loadApmStatus(true);
}

/**
 * 组合式取状态
 *
 * <p>{@link ensure} 是页面 onMounted 里的标准调用：已经取到就什么都不做，
 * 因此页面之间来回切换不会重复请求。</p>
 */
export function useApmStatus() {
  return {
    state,
    status: computed(() => state.status),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    /** 是否选中了可用的 APM */
    present: computed(() => Boolean(state.status?.present)),
    /** 当前引擎是否支持某能力（services / traces / metrics…） */
    supports: (capability: string) => Boolean(state.status?.capabilities?.includes(capability)),
    /** 懒加载：已有状态则跳过 */
    ensure: () => (state.status ? Promise.resolve() : loadApmStatus(false)),
    /** 强制重探 */
    refresh: refreshApmStatus,
  };
}
