/**
 * 固定并发的任务池
 *
 * <p><b>为什么不用「分批 + Promise.all」</b>：目录里只要有一张 4MB 的 PNG，
 * 它所在的那一批就会把所有其它图都堵在门口 —— 用户看到的是「一批一批地亮」，
 * 而不是「谁先回来谁先亮」。这里每个 worker 一空就接下一个，慢的那张只拖自己。</p>
 *
 * <p>单条链路（远端带宽只有 ~40KB/s）上并发不是越高越好：6 个并发已经能吃满，
 * 再多只是让每个请求都变慢、首屏更晚。所以并发上限由调用方给。</p>
 *
 * @author Buffy
 * @since 2026/11/04
 */

/**
 * 以固定并发跑完所有任务
 *
 * <p>单个任务抛错只影响它自己：其余任务照跑，调用方拿到的是「尽力而为」的结果。
 * 这符合缩略图的语义 —— 一张取不到就渲染类型图标，不该让整个目录都空着。</p>
 *
 * @param items  任务输入
 * @param limit  并发上限（≥1；大于任务数时按任务数算）
 * @param worker 单个任务
 */
export async function runPool<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) {
    return;
  }
  let cursor = 0;
  const size = Math.max(1, Math.min(Math.floor(limit), items.length));
  const runners = Array.from({ length: size }, async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) {
        return;
      }
      try {
        await worker(items[index]);
      } catch {
        // 单张失败不影响其余
      }
    }
  });
  await Promise.all(runners);
}
