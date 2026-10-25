/**
 * 主线程调度器（@repo/utils）
 *
 * 用途：把「一段可能较重的同步计算」切成小片，每片之间把主线程**让回浏览器**，
 * 于是动画（CSS 过渡 / 关键帧）能在两片之间正常出帧，不会因为一段长任务把界面冻住。
 *
 * 典型场景：远程表格一次刷新回来几百上千行，行格式化、列状态序列化、
 * 选中态恢复等都是纯 JS 的同步循环 —— 一口气跑完就是一个几百毫秒的 Long Task，
 * 期间浏览器既不能出帧、也处理不了用户输入，表现为「刷新时整页卡死」。
 *
 * 三个函数按场景选用：
 *  - {@link yieldToMain}：让出**一帧**（rAF + setTimeout），保证动画真的画出来。
 *  - {@link scheduleIdle}：交给浏览器的空闲时段（requestIdleCallback），能拖多久拖多久。
 *  - {@link chunkedMap}：把数组逐项处理，每处理 {@link chunkedMap} 的 budget 个就让一帧。
 */

/** 是否支持 requestIdleCallback（Safari 16.4+ / Chrome / Firefox 暂无） */
const hasIdleCallback = typeof requestIdleCallback === "function";

/**
 * 让出主线程一帧。
 *
 * 内部用 rAF + setTimeout 组合：rAF 保证「让出的这一帧」里浏览器会先跑完动画绘制，
 * setTimeout 保证 rAF 回调被节流或跳过时（页面在后台）也能继续往下走。
 * 两者都不可用时退化成 setTimeout(0)，至少保证宏任务让出。
 *
 * @returns Promise，在下一帧绘制完成后 resolve
 */
export function yieldToMain(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        // 再排一个宏任务：rAF 回调本身在「渲染前」执行，
        // 直接 resolve 的话这一帧的动画还没画出去。
        setTimeout(resolve, 0);
      });
      return;
    }
    setTimeout(resolve, 0);
  });
}

/**
 * 交给浏览器的空闲时段执行。
 *
 * 没有 requestIdleCallback 时退化为 {@link yieldToMain}（Safari 走这条）。
 *
 * @param callback 空闲时执行的回调
 * @param timeout  最长等待时间（ms）：浏览器一直忙时靠它兜底，避免任务饿死
 */
export function scheduleIdle(
  callback: () => void,
  timeout: number = 200,
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (hasIdleCallback) {
      requestIdleCallback(
        () => {
          callback();
          resolve();
        },
        { timeout },
      );
      return;
    }
    void yieldToMain().then(() => {
      callback();
      resolve();
    });
  });
}

/** {@link chunkedMap} 的默认每片处理条数 */
const DEFAULT_CHUNK_SIZE = 200;

/**
 * 分片处理数组：每片处理 {@link chunkSize} 项，片与片之间让出主线程。
 *
 * <p>用于「拿到一批远程数据 → 逐行做格式化/派生」这类纯计算：
 * 拆成小片后，每片之间的空档浏览器能出帧，动画不再被冻住，
 * 用户也能在中途操作界面（滚动、点击）。</p>
 *
 * <p>顺序保证：结果数组下标与输入一一对应，**不会重排**。
 * 某一项处理抛错时，该项结果为 {@link onError} 的返回值（缺省 undefined），
 * 不影响其余项 —— 单条脏数据不该让整批失败。</p>
 *
 * @param items   输入数组
 * @param fn      单项处理函数
 * @param options chunkSize 每片条数；onError 单项出错时的兜底值
 */
export async function chunkedMap<T, R>(
  items: readonly T[],
  fn: (item: T, index: number) => R,
  options: { chunkSize?: number; onError?: (error: unknown, index: number) => R } = {},
): Promise<R[]> {
  const chunkSize = Math.max(1, options.chunkSize ?? DEFAULT_CHUNK_SIZE);
  const result: R[] = new Array(items.length);
  for (let start = 0; start < items.length; start += chunkSize) {
    const end = Math.min(start + chunkSize, items.length);
    for (let i = start; i < end; i++) {
      try {
        result[i] = fn(items[i], i);
      } catch (error) {
        if (options.onError) {
          result[i] = options.onError(error, i);
        } else {
          throw error;
        }
      }
    }
    // 最后一片之后不用再让（让了也是空等）
    if (end < items.length) {
      await yieldToMain();
    }
  }
  return result;
}
