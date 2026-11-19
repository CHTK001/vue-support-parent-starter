import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch, type ComputedRef, type Ref } from "vue";
import { createStorage, browserLocalStorage } from "@repo/utils";

/**
 * 自动刷新档位（毫秒），0 表示「不自动刷新」。
 *
 * <p>与 {@code ReTable} 内置自动刷新同一套档位口径（关 / 5s / 10s / 30s / 1min），
 * 目的是让中间件管理页与表格页的刷新控件读起来是同一族，而不是每页自造一套秒数。</p>
 */
export const AUTO_REFRESH_STEPS: readonly number[] = [0, 5000, 10000, 30000, 60000];

/** 用户选择的档位，0 = 关。 */
export type AutoRefreshInterval = number;

/**
 * 把任意输入收敛成合法档位。
 *
 * <p>只认 {@code steps} 里出现的值：localStorage 里可能是旧版本留下的
 * 3000、或者被手改成字符串，直接拿来 setInterval 会得到「每 3 秒」这种页面没暴露的档位。
 * 认不出的一律退回 0（关），宁可少刷新，也不要按未知节奏打接口。</p>
 *
 * <p>{@code steps} 可被页面收窄：像 InfluxDB 这种一次刷新会级联重取度量与最近数据
 * 的重页面，只该暴露 30s / 60s，不该让用户选到 5s。</p>
 *
 * @param raw 原始值
 * @param steps 允许的档位集合，默认 {@link AUTO_REFRESH_STEPS}
 * @returns 合法档位（毫秒），无法识别时为 0
 */
export function normalizeAutoRefreshInterval(
  raw: unknown,
  steps: readonly number[] = AUTO_REFRESH_STEPS,
): AutoRefreshInterval {
  const ms = Number(raw);
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return steps.includes(ms) ? ms : 0;
}

/**
 * 档位的可读文案，作为触发器 tooltip / 无障碍名。
 *
 * <p>关闭态也要给出「已关闭」而不是空串：读屏用户只听到「按钮」时无法判断
 * 当前到底是不是在自动刷新。</p>
 *
 * @param ms 档位（毫秒），0 = 关
 * @returns 形如「自动刷新中：每 30 秒」/「自动刷新：已关闭」
 */
export function autoRefreshLabel(ms: AutoRefreshInterval): string {
  if (ms <= 0) return "自动刷新：已关闭";
  const seconds = Math.round(ms / 1000);
  return `自动刷新中：每 ${seconds} 秒`;
}

/**
 * 选项形态，与 {@code ReSelect} 的 {@code data} 对齐（label + description + icon）。
 *
 * <p>用 {@code type} 而非 {@code interface}：{@code ReOption} 带索引签名
 * {@code [key: string]: unknown}，而 TS 只给类型别名隐式索引签名，interface 会
 * 因「缺少索引签名」被判为不可赋值（实测 TS2322）。这里不 import UI 类型，
 * 是为了让 composable 保持与组件库解耦。</p>
 */
export type AutoRefreshOption = {
  value: number;
  label: string;
  description: string;
  icon: string;
};

/**
 * 档位选项（供 {@code ReSelect layout="square" vertical} 使用）。
 *
 * @param steps 允许的档位集合，默认 {@link AUTO_REFRESH_STEPS}
 * @returns 每档一行主标题 + 一行副说明
 */
export function autoRefreshOptions(steps: readonly number[] = AUTO_REFRESH_STEPS): AutoRefreshOption[] {
  return steps.map(ms => {
    if (ms <= 0) {
      return { value: 0, label: "不自动刷新", description: "仅在点击刷新时更新", icon: "VideoPause" };
    }
    const seconds = Math.round(ms / 1000);
    const description =
      seconds === 5
        ? "高实时，适合监控运行中任务"
        : seconds === 10
          ? "平衡实时性与查询负载"
          : seconds === 30
            ? "常规巡检，推荐默认"
            : "降低数据源压力";
    return { value: ms, label: `每 ${seconds} 秒`, description, icon: "Timer" };
  });
}

export interface UseAutoRefreshOptions {
  /**
   * 一次刷新动作。
   *
   * <p><b>必须返回 Promise</b>：上一拍还在飞时要能跳过这一拍。返回 void 的话
   * 慢接口下会越堆越多请求，最后把后端打穿——这正是本 composable 存在的理由之一。</p>
   */
  onRefresh: () => Promise<unknown> | unknown;
  /**
   * localStorage 键（不含前缀），用于跨会话记住档位。
   *
   * <p>每页给一个独立键（如 {@code datasource.kafka}）：共用一键会让「Kafka 设了 5 秒」
   * 传染到「Elasticsearch」，而这两页的查询代价差一个量级。</p>
   */
  storageKey: string;
  /** 初始档位；未持久化过时使用，默认 0（关）。 */
  defaultInterval?: AutoRefreshInterval;
  /**
   * 允许的档位集合，默认 {@link AUTO_REFRESH_STEPS}。
   *
   * <p>一次刷新代价明显偏高的页面（InfluxDB 会级联重取度量与最近数据）应收窄到
   * {@code [0, 30000, 60000]}：给出 5s 档位等于允许用户把目标实例打穿。</p>
   */
  steps?: readonly number[];
  /**
   * 是否在「切到其它标签页」时暂停。
   *
   * <p>默认 true：中间件管理页的轮询都会打到真实服务，后台标签页继续轮询
   * 只会白白压垮数据源。{@code document.hidden} 期间不触发，回到前台立刻补一拍。</p>
   */
  pauseWhenHidden?: boolean;
}

export interface UseAutoRefreshReturn {
  /** 当前档位（毫秒），0 = 关；可直接 v-model 给 ReSwitch/ReSelect */
  interval: Ref<AutoRefreshInterval>;
  /** 距下次刷新的秒数，关闭态恒为 0 */
  countdown: Ref<number>;
  /** 是否正在自动刷新 */
  active: ComputedRef<boolean>;
  /** 触发器 tooltip / 无障碍名 */
  label: ComputedRef<string>;
  /** 该页可选的档位集合，供控件渲染菜单（已按 {@code steps} 收窄） */
  steps: readonly number[];
  /** 手动补一拍（不改档位），用于「立即刷新」按钮以外的程序化触发 */
  triggerNow: () => Promise<void>;
}

/**
 * 中间件管理页的自动刷新。
 *
 * <p><b>为什么不是直接用 {@code ReTable} 的 {@code autoRefresh}</b>：那套能力绑定在
 * 表格的远程 {@code loader} 上，轮询时内部走 {@code dsReload()} 重取当前页。而
 * {@code pages/datasource} 的中间件管理页是「{@code :data} 静态数组 + 手动 refresh()」
 * 的形态——一次刷新往往要串起能力声明、主题列表、当前选中节点的分区等多个请求，
 * 不是单表重载。所以这里只复用它的<b>档位与交互口径</b>，起停自己管。</p>
 *
 * <p><b>几个刻意的取舍</b>：</p>
 * <ul>
 *   <li><b>上一拍未完成则跳过</b>：不排队、不叠加，慢接口下也不会雪崩。</li>
 *   <li><b>后台标签页暂停</b>：{@code document.hidden} 时不起表，回前台补一拍。</li>
 *   <li><b>keep-alive 感知</b>：管理页在宿主里常被缓存，离开时必须停表，否则后台持续打接口。</li>
 *   <li><b>卸载即清理</b>：{@code onBeforeUnmount} 停表并移除可见性监听。</li>
 *   <li><b>档位持久化</b>：localStorage 记住选择，重进页面不用每次重设。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.52
 */
export function useAutoRefresh(options: UseAutoRefreshOptions): UseAutoRefreshReturn {
  const { onRefresh, storageKey, defaultInterval = 0, pauseWhenHidden = true } = options;
  const steps = options.steps && options.steps.length ? options.steps : AUTO_REFRESH_STEPS;

  const storage = createStorage(browserLocalStorage, { prefix: "koi:auto-refresh:" });
  const persisted = storage.get<number>(storageKey, normalizeAutoRefreshInterval(defaultInterval, steps));
  const interval = ref<AutoRefreshInterval>(normalizeAutoRefreshInterval(persisted, steps));
  const countdown = ref(0);

  /** 上一拍是否还在飞；用于跳过而非排队 */
  let inFlight = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let tickTimer: ReturnType<typeof setInterval> | null = null;
  /** 是否处于「页签隐藏」状态（pauseWhenHidden 时用于抑制轮询） */
  let hidden = typeof document !== "undefined" ? document.hidden : false;
  /** 组件是否已卸载：异步回调返回时据此避免继续动 state */
  let disposed = false;

  const active = computed(() => interval.value > 0);
  const label = computed(() => autoRefreshLabel(interval.value));

  /**
   * 执行一次刷新，带在途保护。
   *
   * <p>异常吞掉不冒泡：轮询里的偶发失败（网络抖动、目标服务重启）不该把页面
   * 顶成未捕获异常，具体错误提示由各页的 {@code onRefresh} 自己负责。</p>
   */
  async function runOnce(): Promise<void> {
    if (inFlight || disposed) return;
    inFlight = true;
    try {
      await onRefresh();
    } catch {
      // 页面自己的 refresh() 已经会写 gap / message，这里只保证轮询不中断
    } finally {
      inFlight = false;
    }
  }

  function stop(): void {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
    countdown.value = 0;
  }

  function start(): void {
    stop();
    if (interval.value <= 0 || disposed) return;
    // 后台标签页不启表：等 visible 事件回来再补
    if (pauseWhenHidden && hidden) return;
    const seconds = Math.max(1, Math.round(interval.value / 1000));
    countdown.value = seconds;
    timer = setInterval(() => {
      if (inFlight) return;
      countdown.value = seconds;
      void runOnce();
    }, interval.value);
    tickTimer = setInterval(() => {
      if (countdown.value > 1) countdown.value -= 1;
    }, 1000);
  }

  /** 可见性变化：隐藏即停，恢复则立刻补一拍并重新起表 */
  function onVisibilityChange(): void {
    const nowHidden = document.hidden;
    if (nowHidden === hidden) return;
    hidden = nowHidden;
    if (hidden) {
      stop();
      return;
    }
    if (interval.value <= 0) return;
    // 回到前台补一拍：用户切回来最想看到的是「现在的」状态，而不是等一个完整周期
    void runOnce();
    start();
  }

  // 换档即换节奏；同时落盘，下次进页面沿用
  watch(interval, value => {
    storage.set(storageKey, value);
    start();
  });

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  onMounted(start);
  // keep-alive：被缓存的页面离开时必须停表
  onActivated(start);
  onDeactivated(stop);

  onBeforeUnmount(() => {
    disposed = true;
    stop();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  });

  return {
    interval,
    countdown,
    active,
    label,
    steps,
    triggerNow: runOnce,
  };
}
