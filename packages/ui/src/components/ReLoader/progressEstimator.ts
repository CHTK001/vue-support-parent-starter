/**
 * 进度自适应估算（无真实进度时用）。
 *
 * <p>为什么需要：绝大多数后端接口不回报进度（只有上传/下载能拿到字节数）。
 * 纯"不确定态"（转圈/条纹）在长耗时任务上会让人怀疑卡死；而**假进度**走完
 * 100% 又不结束则是欺骗。折中做法是业界常用的"渐近估算"：</p>
 *
 * <ul>
 *   <li>进度按时间推进，但**永远逼近而不到达** 90%（上限由 {@code ceiling} 控制）；</li>
 *   <li>推进速度随进度递减（越接近上限越慢），避免"前 3 秒冲到 80%、然后僵住"；</li>
 *   <li>真实进度到达时立刻接管，估算器自动停用；</li>
 *   <li>任务结束时由调用方 {@code finish()} 补到 100%（可带一段短动画）。</li>
 * </ul>
 *
 * <p>实现用指数衰减：{@code p(t) = ceiling * (1 - e^(-t/tau))}。
 * 选指数而非线性，是因为人对"接近完成"的等待更敏感 —— 线性在末尾会显得停滞。</p>
 */

/** 估算器配置 */
export interface ProgressEstimatorOptions {
  /** 进度上限（默认 90） */
  ceiling?: number;
  /**
   * 时间常数（毫秒）。越大越慢。
   * 默认 8000：约 1 个 tau 到 63% 上限，3 个 tau 接近 95% 上限。
   */
  tau?: number;
  /** 更新频率（毫秒，默认 200）。太快没有意义，还会频繁触发渲染 */
  interval?: number;
  /** 每次估算结果回调 */
  onTick?: (percent: number) => void;
  /** 真实进度接管后是否停止估算（默认 true） */
  stopOnRealProgress?: boolean;
}

/** 估算器句柄 */
export interface ProgressEstimator {
  /** 当前估算值 */
  readonly percent: number;
  /** 是否仍在估算 */
  readonly active: boolean;
  /**
   * 上报真实进度：估算器立即停用并把当前值设为该进度。
   * @param percent 0-100
   */
  setReal(percent: number): void;
  /**
   * 结束：补到 100 并停止。
   * @param immediate true 表示直接跳 100（无动画）
   */
  finish(immediate?: boolean): void;
  /** 停止估算（不补 100，用于中途取消） */
  stop(): void;
}

/**
 * 创建一个进度估算器。
 *
 * @param options 配置
 * @returns 估算器句柄
 */
export function createProgressEstimator(options: ProgressEstimatorOptions = {}): ProgressEstimator {
  const ceiling = clamp(options.ceiling ?? 90, 1, 99);
  const tau = Math.max(200, options.tau ?? 8000);
  const interval = Math.max(50, options.interval ?? 200);
  const stopOnReal = options.stopOnRealProgress !== false;

  const startedAt = Date.now();
  let current = 0;
  let active = true;
  let timer: ReturnType<typeof setInterval> | null = null;

  const emit = (v: number) => {
    current = v;
    options.onTick?.(v);
  };

  const clear = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const compute = () => {
    const elapsed = Date.now() - startedAt;
    // 指数逼近：t=0 → 0，t→∞ → ceiling
    return ceiling * (1 - Math.exp(-elapsed / tau));
  };

  timer = setInterval(() => {
    if (!active) return;
    // 只增不减，避免抖动
    const next = Math.max(current, compute());
    emit(Math.min(next, ceiling));
  }, interval);
  // Node/SSR 环境下 setInterval 返回值可能带 unref，浏览器下无所谓
  (timer as unknown as { unref?: () => void })?.unref?.();

  return {
    get percent() {
      return current;
    },
    get active() {
      return active;
    },
    setReal(percent: number) {
      const v = clamp(percent, 0, 100);
      if (stopOnReal) {
        active = false;
        clear();
      }
      // 真实进度可能回退（如重试），这里尊重真实值
      emit(v);
    },
    finish(immediate = false) {
      active = false;
      clear();
      if (immediate) {
        emit(100);
      } else {
        // 补最后一段：从当前值快速线性到 100（约 200ms）
        const from = current;
        const t0 = Date.now();
        const dur = 200;
        const t = setInterval(() => {
          const k = Math.min(1, (Date.now() - t0) / dur);
          emit(from + (100 - from) * k);
          if (k >= 1) clearInterval(t);
        }, 30);
      }
    },
    stop() {
      active = false;
      clear();
    },
  };
}

/** 数值限幅 */
function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}
