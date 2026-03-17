/**
 * 时钟 Web Worker
 * 每秒向主线程发送当前时间戳，避免主线程繁忙时计时漂移
 */

let timer: ReturnType<typeof setInterval> | null = null;

// 立即发送一次，再每秒发送
self.postMessage({ now: Date.now() });
timer = setInterval(() => {
  self.postMessage({ now: Date.now() });
}, 1000);
