/**
 * 自动刷新策略的门禁。
 *
 * <p>自动刷新是为了修一个具体的坑：服务管理列表原先只在 mounted 拉一次，
 * 节点因为端口被占或进程被杀变成 ERROR 之后，页面仍然显示 RUNNING。
 * 「过期的好消息比没有消息更危险」—— 运维盯着一屏绿灯，实际服务已经挂了。</p>
 *
 * <p>但裸 {@code setInterval} 会引入三个新问题，所以这里逐条钉住策略：</p>
 * <ol>
 *   <li><b>请求重叠</b>：接口慢于轮询间隔时响应乱序到达，列表会闪回旧数据。</li>
 *   <li><b>后台空转</b>：标签页切走时轮询纯属给后端加压；但重新可见时又必须
 *       立刻补一次，否则用户切回来先看到一份过期几分钟的列表。</li>
 *   <li><b>故障打爆</b>：后端挂了以后每次失败都立即重试会让它更难恢复。</li>
 * </ol>
 *
 * <p>全部用<b>注入的假调度器</b>而不是真实计时器：真实 setTimeout 会让用例
 * 依赖墙钟时间，在 CI 负载高时随机变红，而这类随机红会迅速让整个门禁被忽略。</p>
 */
import { describe, expect, it, vi } from "vitest";
import {
  createAutoRefresh,
  DEFAULT_AUTO_REFRESH,
  type AutoRefreshDeps,
  type AutoRefreshOptions,
} from "../utils/autoRefresh";

/** 可手动推进的假调度器 */
function fakeDeps(initialVisible = true) {
  let pending: Array<{ fn: () => void; ms: number }> = [];
  const deps: AutoRefreshDeps = {
    setTimer: (fn, ms) => {
      pending.push({ fn, ms });
      return () => {
        pending = pending.filter(p => p.fn !== fn);
      };
    },
    isVisible: () => initialVisible,
  };
  return {
    deps,
    /** 推进一轮：取出当前排队的第一个回调并执行 */
    async fireOnce() {
      const next = pending[0];
      if (!next) {
        return false;
      }
      pending = pending.filter(p => p !== next);
      next.fn();
      // 让 tick 内部的 await 有机会落地
      await Promise.resolve();
      await Promise.resolve();
      return true;
    },
    /** 当前排队的定时器间隔 */
    scheduledMs: () => pending.map(p => p.ms),
    pendingCount: () => pending.length,
    setVisible(v: boolean) {
      initialVisible = v;
    },
  };
}

/** 短间隔配置，让退避倍数在断言里可读 */
const OPTS: AutoRefreshOptions = {
  intervalMs: 1000,
  backoffFactor: 2,
  maxIntervalMs: 10000,
  maxBackoffCount: 3,
};

describe("启动与停止", () => {
  it("start 后排一个定时器，但不立刻执行任务（挂载时已经在拉第一屏了）", () => {
    const f = fakeDeps();
    const task = vi.fn().mockResolvedValue(undefined);
    const h = createAutoRefresh(task, OPTS, f.deps);

    h.start();
    expect(task).not.toHaveBeenCalled();
    expect(f.pendingCount()).toBe(1);

    void f.fireOnce();
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("重复 start 不会产生第二个循环", () => {
    const f = fakeDeps();
    const task = vi.fn().mockResolvedValue(undefined);
    const h = createAutoRefresh(task, OPTS, f.deps);

    h.start();
    h.start();
    h.start();
    expect(f.pendingCount()).toBe(1);
  });

  it("stop 之后定时器被清掉，且不再执行任务", async () => {
    const f = fakeDeps();
    const task = vi.fn().mockResolvedValue(undefined);
    const h = createAutoRefresh(task, OPTS, f.deps);

    h.start();
    h.stop();
    expect(f.pendingCount()).toBe(0);

    const fired = await f.fireOnce();
    expect(fired).toBe(false);
    expect(task).not.toHaveBeenCalled();
  });

  it("stop 可重复调用（onUnmounted 可能与页面守卫叠加）", () => {
    const f = fakeDeps();
    const h = createAutoRefresh(vi.fn().mockResolvedValue(undefined), OPTS, f.deps);
    h.start();
    expect(() => {
      h.stop();
      h.stop();
    }).not.toThrow();
  });

  it("stop 之后重新 start 能恢复轮询", async () => {
    const f = fakeDeps();
    const task = vi.fn().mockResolvedValue(undefined);
    const h = createAutoRefresh(task, OPTS, f.deps);

    h.start();
    h.stop();
    h.start();
    await f.fireOnce();
    expect(task).toHaveBeenCalledTimes(1);
  });
});

describe("单飞：不允许请求重叠", () => {
  it("上一轮未返回时，后续 tick 不发新请求，但循环必须仍然活着", async () => {
    const f = fakeDeps();
    // 用对象持有 resolver：写成 `let release: (() => void) | null = null` 时，
    // TypeScript 的控制流分析看不到「赋值发生在 Promise executor 里」，
    // 到使用点会把 release 收窄成 never 并报 TS2349
    const gate: { release: () => void } = { release: () => {} };
    const task = vi.fn(
      () =>
        new Promise<void>(resolve => {
          gate.release = resolve;
        }),
    );
    const h = createAutoRefresh(task, OPTS, f.deps);
    h.start();

    await f.fireOnce();
    expect(task).toHaveBeenCalledTimes(1);

    // 再触发三轮。第一轮仍在飞，task 调用数不得增加。
    await f.fireOnce();
    await f.fireOnce();
    await f.fireOnce();
    expect(task).toHaveBeenCalledTimes(1);

    // 【判别性断言】循环必须还在排程。
    // 只断言「task 没被再次调用」是不够的：若把 schedule() 放在 await 之后，
    // 第一轮挂住时循环已经死了，task 自然也不会再被调用 —— 那样这条用例
    // 在「有单飞锁」和「没有单飞锁」两种实现下都通过，判别力为零。
    // 敏感性对照实测：删掉单飞锁后本断言仍成立，但下面「循环存活」那条会红。
    expect(f.pendingCount()).toBe(1);

    // 第一轮返回后，下一轮恢复请求
    gate.release();
    await Promise.resolve();
    await Promise.resolve();
    await f.fireOnce();
    expect(task).toHaveBeenCalledTimes(2);
  });

  it("任务挂住不返回时，循环仍持续排程（不会静默死掉）", async () => {
    const f = fakeDeps();
    // 永不 settle 的任务：模拟 HTTP 无超时的挂死
    const task = vi.fn(() => new Promise<void>(() => {}));
    const h = createAutoRefresh(task, OPTS, f.deps);
    h.start();

    for (let i = 0; i < 5; i++) {
      await f.fireOnce();
      expect(f.pendingCount()).toBe(1);
    }
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("任务挂住期间间隔不放大（跳过的轮次不是失败，不该触发退避）", async () => {
    const f = fakeDeps();
    const task = vi.fn(() => new Promise<void>(() => {}));
    const h = createAutoRefresh(task, OPTS, f.deps);
    h.start();

    await f.fireOnce();
    await f.fireOnce();
    await f.fireOnce();
    expect(h.currentIntervalMs()).toBe(OPTS.intervalMs);
  });

  it("任务抛错也要释放单飞锁，否则一次失败后轮询永久卡死", async () => {
    const f = fakeDeps();
    const task = vi.fn().mockRejectedValue(new Error("boom"));
    const h = createAutoRefresh(task, OPTS, f.deps);
    h.start();

    await f.fireOnce();
    expect(task).toHaveBeenCalledTimes(1);
    await f.fireOnce();
    expect(task).toHaveBeenCalledTimes(2);
  });
});

describe("页面不可见时暂停", () => {
  it("不可见时 tick 被跳过，不发请求，但循环继续排程", async () => {
    const f = fakeDeps(false);
    const task = vi.fn().mockResolvedValue(undefined);
    const h = createAutoRefresh(task, OPTS, f.deps);
    h.start();

    const fired = await f.fireOnce();
    expect(fired).toBe(true);
    expect(task).not.toHaveBeenCalled();
    expect(f.pendingCount()).toBe(1);
  });

  it("重新可见后下一轮恢复请求（这就是「切回标签页立刻补一次」的落点）", async () => {
    const f = fakeDeps(false);
    const task = vi.fn().mockResolvedValue(undefined);
    const h = createAutoRefresh(task, OPTS, f.deps);
    h.start();

    await f.fireOnce();
    expect(task).not.toHaveBeenCalled();

    f.setVisible(true);
    await f.fireOnce();
    expect(task).toHaveBeenCalledTimes(1);
  });
});

describe("失败退避", () => {
  /**
   * 退避的生效时点：schedule() 在 await task() **之前**执行，所以第 N 轮
   * 用的是「进入第 N 轮时已知的失败次数」。也就是说过一轮失败之后，
   * **下一轮**才用放大后的间隔 —— 当前这一轮的间隔在失败被观测到之前
   * 就已经定下来了，无法追溯修改。
   *
   * 下面是 OPTS(interval=1000, factor=2, maxCount=3) 下的真实序列：
   *   fire#1 -> 1000   (进入时 failures=0，失败后 failures=1)
   *   fire#2 -> 2000   (进入时 failures=1，失败后 failures=2)
   *   fire#3 -> 4000   (进入时 failures=2，失败后 failures=3)
   *   fire#4 -> 8000   (进入时 failures=3，已达计数上限)
   *   fire#5 -> 8000
   * 断言必须按这个偏移写。把这套断言挪前一轮会让「退避生效」变成假象。
   */
  it("成功后间隔回到基准值", async () => {
    const f = fakeDeps();
    let fail = true;
    const task = vi.fn(() => (fail ? Promise.reject(new Error("x")) : Promise.resolve()));
    const h = createAutoRefresh(task, OPTS, f.deps);
    h.start();

    await f.fireOnce();
    expect(h.currentIntervalMs()).toBe(1000);

    fail = false;
    // 这一轮成功后 failures 归零，但本轮间隔是在 await 之前就定下的
    await f.fireOnce();
    expect(h.currentIntervalMs()).toBe(2000);
    // 下一轮才真正用回基准间隔
    await f.fireOnce();
    expect(h.currentIntervalMs()).toBe(1000);
  });

  it("连续失败按倍数拉长间隔", async () => {
    const f = fakeDeps();
    const task = vi.fn().mockRejectedValue(new Error("x"));
    const h = createAutoRefresh(task, OPTS, f.deps);
    h.start();

    await f.fireOnce();
    expect(h.currentIntervalMs()).toBe(1000);
    await f.fireOnce();
    expect(h.currentIntervalMs()).toBe(2000);
    await f.fireOnce();
    expect(h.currentIntervalMs()).toBe(4000);
    await f.fireOnce();
    expect(h.currentIntervalMs()).toBe(8000);
  });

  it("达到退避计数上限后间隔停住，不再继续放大", async () => {
    const f = fakeDeps();
    const task = vi.fn().mockRejectedValue(new Error("x"));
    const h = createAutoRefresh(task, OPTS, f.deps);
    h.start();

    // 封顶的是【失败计数】，不是间隔本身。因此可达的最大间隔是
    // intervalMs * backoffFactor^maxBackoffCount = 1000 * 2^3 = 8000，
    // 它可能小于 maxIntervalMs（10000）—— 断言必须写这个真实上限，
    // 写成 maxIntervalMs 就会把「计数封顶」误读成「间隔封顶」。
    const reachableMax = OPTS.intervalMs * OPTS.backoffFactor ** OPTS.maxBackoffCount;
    expect(reachableMax).toBeLessThan(OPTS.maxIntervalMs);

    for (let i = 0; i < 8; i++) {
      await f.fireOnce();
    }
    expect(h.currentIntervalMs()).toBe(reachableMax);
  });

  it("maxBackoffCount 限制计数本身，超出后间隔不再变化", async () => {
    const f = fakeDeps();
    const task = vi.fn().mockRejectedValue(new Error("x"));
    // 上限给 3：failures 到 3 后不再增长，间隔稳定在 1000*2^3 = 8000
    const h = createAutoRefresh(task, OPTS, f.deps);
    h.start();

    await f.fireOnce();
    await f.fireOnce();
    await f.fireOnce();
    expect(h.currentIntervalMs()).toBe(4000);

    await f.fireOnce();
    const atCap = h.currentIntervalMs();
    expect(atCap).toBe(8000);

    await f.fireOnce();
    await f.fireOnce();
    expect(h.currentIntervalMs()).toBe(atCap);
  });

  it("间隔上限 maxIntervalMs 确实生效（把 maxBackoffCount 调大时才会触及）", async () => {
    const f = fakeDeps();
    const task = vi.fn().mockRejectedValue(new Error("x"));
    // 计数上限 10 时 1000*2^4=16000 会超过 10000，必须被 maxIntervalMs 截断
    const h = createAutoRefresh(task, { ...OPTS, maxBackoffCount: 10 }, f.deps);
    h.start();

    for (let i = 0; i < 6; i++) {
      await f.fireOnce();
    }
    expect(h.currentIntervalMs()).toBe(OPTS.maxIntervalMs);
  });

  it("基准间隔本身超过上限时被封顶（配置写错也不会导致永不刷新）", () => {
    const f = fakeDeps();
    const h = createAutoRefresh(vi.fn().mockResolvedValue(undefined), {
      ...OPTS,
      intervalMs: 999999,
      maxIntervalMs: 5000,
    }, f.deps);
    h.start();
    expect(h.currentIntervalMs()).toBe(5000);
  });
});

describe("默认值本身是合理的", () => {
  it("默认配置下首轮间隔不为 0（间隔 0 会变成忙等，把浏览器标签页打死）", () => {
    expect(DEFAULT_AUTO_REFRESH.intervalMs).toBeGreaterThan(0);
  });

  it("默认退避因子大于 1（等于 1 意味着失败后间隔不变，等于没退避）", () => {
    expect(DEFAULT_AUTO_REFRESH.backoffFactor).toBeGreaterThan(1);
  });

  it("默认上限不小于基准间隔（否则配置自相矛盾，永远只会用上限值）", () => {
    expect(DEFAULT_AUTO_REFRESH.maxIntervalMs).toBeGreaterThanOrEqual(
      DEFAULT_AUTO_REFRESH.intervalMs,
    );
  });

  it("默认 backoff 上限为正（0 会让 failures 恒为 0，退避完全失效）", () => {
    expect(DEFAULT_AUTO_REFRESH.maxBackoffCount).toBeGreaterThan(0);
  });
});