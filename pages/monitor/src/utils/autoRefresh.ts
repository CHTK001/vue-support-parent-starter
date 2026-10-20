/**
 * 列表页自动刷新策略。
 *
 * <p><b>要解决的问题</b>：服务管理列表原先只在 mounted 时拉一次。此后节点
 * 因为端口被占、进程被杀、配置漂移而变成 {@code ERROR} 时，页面仍显示
 * {@code RUNNING} —— 运维盯着一屏绿灯，实际服务已经挂了。这是「状态显示」
 * 类页面的硬伤：<b>过期的好消息比没有消息更危险</b>。</p>
 *
 * <p><b>为什么不直接 setInterval</b>：裸的定时器会引入三个新问题，
 * 所以这里把策略显式写出来，并且全部依赖都允许注入：</p>
 * <ol>
 *   <li><b>请求重叠</b>：接口慢于轮询间隔时，定时器会不断叠加并发请求，
 *       响应乱序到达还会让列表闪回旧数据。这里用「单飞」——上一次没回来
 *       就跳过本次 tick。</li>
 *   <li><b>后台空转</b>：标签页切走时没人看，轮询纯属给后端加压。
 *       这里在页面不可见时暂停，并在<b>重新可见的那一次立即补一次</b> ——
 *       否则用户切回来会先看到一份可能已经过期几分钟的列表。</li>
 *   <li><b>故障打爆</b>：后端挂了以后，每次失败都立即重试会让它更难恢复，
 *       并把刷屏的错误提示灌满界面。这里连续失败时按退避倍数拉长间隔，
 *       一次成功即复位。</li>
 * </ol>
 */

/** 自动刷新可配置项 */
export interface AutoRefreshOptions {
  /** 基础间隔，毫秒 */
  intervalMs: number;
  /** 连续失败时间隔的放大倍数 */
  backoffFactor: number;
  /** 间隔上限，毫秒；退避不会超过它 */
  maxIntervalMs: number;
  /** 达到该连续失败次数后停止退避增长 */
  maxBackoffCount: number;
}

/** 默认策略：10s 起步，失败 2 倍退避，最多 6 次后停在 5min 上限 */
export const DEFAULT_AUTO_REFRESH: AutoRefreshOptions = {
  intervalMs: 10_000,
  backoffFactor: 2,
  maxIntervalMs: 300_000,
  maxBackoffCount: 6,
};

/** 调度与可见性来源，测试时注入假实现以摆脱真实计时器 */
export interface AutoRefreshDeps {
  /** 安排一次延时回调，返回取消函数 */
  setTimer: (fn: () => void, ms: number) => () => void;
  /** 当前页面是否可见 */
  isVisible: () => boolean;
}

/** 自动刷新句柄 */
export interface AutoRefreshHandle {
  /** 开始轮询（幂等：重复调用不会产生第二个循环） */
  start: () => void;
  /** 停止轮询并清理定时器（幂等） */
  stop: () => void;
  /** 当前生效的间隔，供界面展示与测试断言 */
  currentIntervalMs: () => number;
}

/** 浏览器默认依赖；在无 document 的环境（SSR/测试）下退化为「始终可见 + setTimeout」 */
export function browserDeps(): AutoRefreshDeps {
  return {
    setTimer: (fn, ms) => {
      const id = setTimeout(fn, ms);
      return () => clearTimeout(id);
    },
    isVisible: () => {
      // 老浏览器没有 hidden 属性时按「可见」处理，宁可多刷也不要静默停更
      if (typeof document === "undefined") {
        return true;
      }
      return document.visibilityState !== "hidden";
    },
  };
}

/**
 * 创建自动刷新句柄。
 *
 * @param task 每轮要执行的拉取；返回值用于判定成功/失败
 * @param options 策略配置
 * @param deps 调度依赖
 * @returns 句柄
 */
export function createAutoRefresh(
  task: () => Promise<unknown>,
  options: AutoRefreshOptions = DEFAULT_AUTO_REFRESH,
  deps: AutoRefreshDeps = browserDeps(),
): AutoRefreshHandle {
  let cancelTimer: (() => void) | null = null;
  let running = false;
  let inFlight = false;
  let failures = 0;
  let interval = options.intervalMs;

  /** 计算下一轮间隔；成功次数为 0 时按退避放大并封顶 */
  function nextInterval(): number {
    if (failures <= 0) {
      return Math.min(options.intervalMs, options.maxIntervalMs);
    }
    const grown = Math.round(options.intervalMs * options.backoffFactor ** failures);
    return Math.min(grown, options.maxIntervalMs);
  }

  function schedule(): void {
    cancelTimer?.();
    interval = nextInterval();
    cancelTimer = deps.setTimer(() => {
      void tick();
    }, interval);
  }

  async function tick(): Promise<void> {
    if (!running) {
      return;
    }
    // 页面不可见时直接跳过本轮，不发请求；等到重新可见时补一次
    if (!deps.isVisible()) {
      schedule();
      return;
    }
    // 单飞：上一轮还没回来就跳过，避免响应乱序把列表刷回旧值
    if (inFlight) {
      schedule();
      return;
    }
    inFlight = true;
    // 【关键】在 await 之前就排下一轮，而不是等任务结束后再排。
    // 排在 await 之后的话，任务一旦挂住（HTTP 无超时、网络黑洞），
    // 尾部就永远执行不到，**轮询循环会静默死掉**，页面从此不再刷新 ——
    // 那等于把「状态过期」这个原始缺陷换了个更隐蔽的形态。
    // 循环由定时器驱动、inFlight 只决定「这一轮要不要真发请求」，
    // 两者解耦后，任务挂住最多是让若干轮被跳过，循环本身不会消失。
    schedule();
    try {
      await task();
      failures = 0;
    } catch {
      failures = Math.min(failures + 1, options.maxBackoffCount);
    } finally {
      inFlight = false;
    }
  }

  return {
    start() {
      if (running) {
        return;
      }
      running = true;
      // 首次不立刻跑：页面挂载时已经在拉第一屏了，
      // 紧接着再打一次会造成两个相同请求
      schedule();
    },
    stop() {
      running = false;
      cancelTimer?.();
      cancelTimer = null;
    },
    currentIntervalMs() {
      return interval;
    },
  };
}