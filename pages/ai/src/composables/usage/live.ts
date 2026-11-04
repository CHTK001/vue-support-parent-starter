/**
 * 用量看板 · 实时用量（SSE）
 *
 * <p>后端 `/v2/usage/live/stream` 按秒合并推送快照。这里管三件事：
 * 连接生命周期（建连 / 重连 / 暂停 / 卸载断开）、帧解析、以及速率滑窗。</p>
 */

import { ref, computed, watch, onBeforeUnmount } from "vue";
import { http } from "@repo/utils";
import type { TimeParams } from "./types";

/** 速率滑窗长度：60 秒 */
const RATE_WINDOW_MS = 60_000;

export function useUsageLive(getTimeParams: () => TimeParams) {
  /** 实时开关：默认开启。关掉必须由用户主动操作，否则用户可能不知道数字在实时跳 */
  const liveEnabled = ref(true);
  /** connecting | live | paused | error */
  const liveState = ref<"connecting" | "live" | "paused" | "error">("connecting");
  const liveTodayTokens = ref(0);
  const liveRangeTokens = ref(0);
  /** 每分钟 token 速率（滑窗计算）；0 表示当前没有活动 */
  const liveRate = ref(0);

  let liveEs: { close: () => void } | null = null;
  /** 上一次收到快照的时刻与区间 token，用于算速率 */
  let lastSample = { at: 0, tokens: 0 };
  /** 速率滑窗样本：保留最近 60 秒的增量 */
  const rateWindow: Array<{ at: number; delta: number }> = [];

  const liveLabel = computed(() => {
    switch (liveState.value) {
      case "connecting": return "实时连接中…";
      case "live": return "实时";
      case "paused": return "已暂停";
      default: return "连接失败，已退回定时刷新";
    }
  });

  function closeLiveStream() {
    if (liveEs) {
      liveEs.close();
      liveEs = null;
    }
  }

  function resetRateWindow() {
    rateWindow.length = 0;
    lastSample = { at: 0, tokens: 0 };
  }

  /**
   * 速率按 60 秒滑窗算，而不是「上一帧差值」。
   *
   * <p>后端是**按秒合并**推送的，单帧差值在两次推送间隔抖动时会剧烈跳动
   * （这一秒 8k、下一秒 0、下一秒 30k），读数根本没法看。滑窗给出的是
   * 「最近一分钟大致烧了多少」，这才是人真正想知道的量。</p>
   */
  function pushRateSample(now: number, total: number) {
    if (lastSample.at > 0 && total >= lastSample.tokens) {
      rateWindow.push({ at: now, delta: total - lastSample.tokens });
    }
    lastSample = { at: now, tokens: total };
    const cutoff = now - RATE_WINDOW_MS;
    while (rateWindow.length && rateWindow[0].at < cutoff) rateWindow.shift();
    liveRate.value = rateWindow.reduce((s, x) => s + x.delta, 0);
  }

  function handleLiveFrame(d: any) {
    if (!d || typeof d !== "object") return;
    const today = Number(d.todayTokens);
    if (Number.isFinite(today)) liveTodayTokens.value = today;
    const range = Number(d.totalTokens);
    if (Number.isFinite(range)) {
      pushRateSample(Date.now(), range);
      liveRangeTokens.value = range;
    }
    liveState.value = "live";
  }

  function openLiveStream() {
    closeLiveStream();
    liveState.value = "connecting";
    /**
     * 用共享的 {@code http().sse()} 而不是裸 {@code EventSource}。
     *
     * <p>裸 EventSource **不能带自定义 header**，而本项目所有 /v2/** 都靠
     * {@code x-oauth-token} 鉴权 —— 建连会直接 401，控制台只留一条不显眼的报错，
     * 页面表现是「实时灯一直闪、数字永远不动」。共享客户端走 fetch-based SSE，
     * 鉴权头与自动重连都已经在里面。</p>
     *
     * <p>必须把当前筛选的时间窗带上：否则实时条的「区间 Token」永远是**全时段**总量，
     * 选「今天」时它却显示几个月的数 —— 与同页 KPI 卡片自相矛盾。空对象即「全部时间」。</p>
     */
    liveEs = http()
      // 参数走链式的 .query()，sse() 会把 config.params 拼进最终 URL。
      .get("/v2/usage/live/stream")
      .query({ ...getTimeParams() })
      .sse<unknown>({
        onOpen: () => {
          liveState.value = "live";
        },
        onMessage: (ev) => {
          // 后端事件名：首帧 snapshot、后续 update。两者载荷同构，统一处理。
          if (ev.event !== "snapshot" && ev.event !== "update") return;
          handleLiveFrame(ev.data);
        },
        onError: () => {
          liveState.value = "error";
        },
        onClose: () => {
          // 只有主动 close 才是 paused；被动断开走 onError，这里不动状态
        },
        // 后端重启/网关抖动后重连；给足次数，避免短暂抖动就永久断流
        maxReconnectAttempts: 10,
        reconnectInterval: 3000,
      });
  }

  // 暂停/恢复：只有开关真的变了才重连，避免每次渲染都建一条新连接
  watch(liveEnabled, (on) => {
    if (on) {
      resetRateWindow();
      openLiveStream();
    } else {
      closeLiveStream();
      liveRate.value = 0;
      liveState.value = "paused";
    }
  });

  /**
   * 时间窗变化时重订阅。
   *
   * <p>SSE 的时间窗是<b>建连时固化</b>的：不重连的话，切「今天」之后实时条还在推
   * 全时段的口径，而且速率滑窗会把两个时间窗的增量混在一起算出一个毫无意义的数字。</p>
   */
  watch(getTimeParams, () => {
    if (!liveEnabled.value) return;
    resetRateWindow();
    openLiveStream();
  }, { deep: true });

  /** 离开页面必须显式断开：连接数只增不减，服务端的订阅列表也会膨胀 */
  onBeforeUnmount(closeLiveStream);

  return {
    liveEnabled,
    liveState,
    liveTodayTokens,
    liveRangeTokens,
    liveRate,
    liveLabel,
    openLiveStream,
    closeLiveStream,
  };
}
