/**
 * 单飞（single-flight）去重工具。
 *
 * <p><b>解决什么问题。</b>当同一个「昂贵且不可并发」的动作可能被多个触发源同时触发时，
 * 让后来的调用<b>复用</b>已经在途的那次，而不是各自发起一次。本仓库的典型场景是
 * 令牌刷新（见 {@link TokenManager}）：定时刷新、手动刷新、页面初始化时的续期、
 * 首屏多个请求各触发一次 —— 原先没有任何在途标记，于是并发 N 次请求打到后端，
 * 而 OAuth 服务端通常<b>轮换</b> refreshToken（旧的一签发新令牌就立即作废），
 * 于是只有第 1 次成功，第 2..N 次带着已作废的令牌返回失败；若调用方把「刷新失败」
 * 当作会话失效，用户会被莫名其妙踢回登录页，失败分支的清理逻辑甚至可能把
 * 第 1 次刚写回的新令牌一并清掉。</p>
 *
 * <p><b>为什么按 key 分开而不是全用一个在途 Promise。</b>不同的 key 代表
 * 语义不同的动作（本仓库是 {@code REFRESH} / {@code VERSION} / {@code TIMESTAMP}）。
 * 让「刷新用户信息」去复用一次「换取新令牌」的结果属于另一种 bug —— 请求被顶掉，
 * 拿到的是另一种语义的数据。因此只有<b>同 key</b> 的并发调用才共享。</p>
 *
 * <p><b>依赖说明。</b>本模块刻意不引入任何依赖（无 vue、无网络），
 * 以便在 Node 下直接执行验收脚本验证行为。</p>
 *
 * @since 4.0.0.42
 */

/** 进行中的任务及其来源 key */
interface InflightEntry<R> {
  /** 创建者在途槽位里占位用的自引用引用，用于「只清理自己那一次」的判定 */
  promise: Promise<R>;
}

/**
 * 创建一个单飞包装器。
 *
 * @typeParam K key 类型
 * @typeParam R 任务结果类型
 * @param task 真正的执行逻辑。**任何 key 上都最多只有一个在途实例**；
 *              同 key 的并发调用共享该实例，因此实现必须保证并发安全、
 *              且结果对所有共享者等价。
 * @returns 包装后的调用函数
 */
export function createSingleFlight<K, R>(
  task: (key: K) => Promise<R>,
): (key: K) => Promise<R> {
  const inflight = new Map<K, InflightEntry<R>>();

  return (key: K): Promise<R> => {
    const existing = inflight.get(key);
    if (existing) return existing.promise;

    const promise = task(key);
    inflight.set(key, { promise });

    // 无论成功还是失败都要释放，否则一次网络抖动就会让这个 key 永久卡在
    // 「复用同一个已 reject 的 Promise」的状态里，再也发起不了新的请求。
    const release = (): void => {
      // 只清理自己发起的那一次：期间可能已有一个同 key 的新任务接管
      // （虽然理论上不会，但直接 delete 会把别人的在途标记抹掉）
      if (inflight.get(key)?.promise === promise) {
        inflight.delete(key);
      }
    };
    promise.then(release, release);

    return promise;
  };
}

/**
 * 创建一个<b>无 key</b>的单飞包装器。
 *
 * <p>适用于「同一时刻只允许一个、且所有调用等价」的场合。</p>
 *
 * @typeParam R 任务结果类型
 * @param task 真正的执行逻辑
 * @returns 包装后的调用函数
 */
export function createSingleFlightOnce<R>(task: () => Promise<R>): () => Promise<R> {
  return createSingleFlight<void, R>(() => task());
}