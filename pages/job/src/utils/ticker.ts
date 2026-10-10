/**
 * 秒级共享心跳。
 *
 * <p>「下次触发」这类每秒都在变的文本不能放进页面级响应式状态：在 JobView 里用一个
 * ref 当"当前时刻"，每次 tick 都会让父组件重渲染，整张 ReTable 跟着重新 diff 一遍，
 * 行数一多就和表格自带的自动刷新叠在一起。改成行内组件各自订阅这个共享心跳后，
 * 重渲染范围只有那一个文本节点，且整页只跑一个定时器。</p>
 *
 * <p>订阅者归零时定时器一并停掉：切走页面 / 关掉弹层后不该有空转的定时器。</p>
 */

/** 订阅者集合，每个订阅者收到当前时刻（毫秒） */
const subscribers = new Set<(now: number) => void>();

let timer: ReturnType<typeof setInterval> | null = null;

function startTimer(): void {
  if (timer !== null) {
    return;
  }
  timer = setInterval(() => {
    const now = Date.now();
    for (const listener of subscribers) {
      listener(now);
    }
  }, 1000);
}

function stopTimerIfIdle(): void {
  if (timer === null || subscribers.size > 0) {
    return;
  }
  clearInterval(timer);
  timer = null;
}

/**
 * 订阅秒级心跳。
 *
 * @param listener 每秒回调一次，参数为当前时刻（毫秒）
 * @returns 退订函数；组件卸载时必须调用，否则定时器会一直空转
 */
export function onTick(listener: (now: number) => void): () => void {
  subscribers.add(listener);
  startTimer();
  return () => {
    subscribers.delete(listener);
    stopTimerIfIdle();
  };
}
