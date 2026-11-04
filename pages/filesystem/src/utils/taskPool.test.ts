/**
 * 并发任务池的单元测试
 *
 * <p>缩略图调度是「页面看起来是不是一卡一卡地亮」的直接原因，而它出错不会报错、
 * 只会变慢或漏图。所以把并发上限、不漏项、单张失败不连坐这几条钉成用例。</p>
 *
 * @author Buffy
 * @since 2026/11/04
 */
import { describe, expect, it } from "vitest";
import { runPool } from "./taskPool";

/**
 * 造一个可控的延迟
 *
 * @param ms 毫秒
 * @returns Promise
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("runPool（固定并发任务池）", () => {
  it("跑完所有任务且每项恰好一次", async () => {
    const items = Array.from({ length: 17 }, (_, i) => i);
    const seen: number[] = [];
    await runPool(items, 4, async (n) => {
      await delay(1);
      seen.push(n);
    });
    expect(seen.slice().sort((a, b) => a - b)).toEqual(items);
  });

  it("并发数从不超过上限", async () => {
    let running = 0;
    let peak = 0;
    await runPool(Array.from({ length: 20 }, (_, i) => i), 3, async () => {
      running += 1;
      peak = Math.max(peak, running);
      await delay(2);
      running -= 1;
    });
    expect(peak).toBeLessThanOrEqual(3);
  });

  it("并发真的被用满（不是串行跑）", async () => {
    let running = 0;
    let peak = 0;
    await runPool(Array.from({ length: 8 }, (_, i) => i), 4, async () => {
      running += 1;
      peak = Math.max(peak, running);
      await delay(5);
      running -= 1;
    });
    expect(peak).toBe(4);
  });

  it("单个任务抛错不影响其余任务", async () => {
    const done: number[] = [];
    await runPool(Array.from({ length: 6 }, (_, i) => i), 2, async (n) => {
      if (n === 1 || n === 4) {
        throw new Error(`boom ${n}`);
      }
      await delay(1);
      done.push(n);
    });
    expect(done.slice().sort((a, b) => a - b)).toEqual([0, 2, 3, 5]);
  });

  it("空列表直接返回；上限大于任务数也能跑完", async () => {
    let calls = 0;
    await runPool([], 4, async () => {
      calls += 1;
    });
    expect(calls).toBe(0);

    const seen: number[] = [];
    await runPool([1, 2], 99, async (n) => {
      seen.push(n);
    });
    expect(seen.slice().sort((a, b) => a - b)).toEqual([1, 2]);
  });

  it("非法并发上限（0 / 负数）按 1 处理，不会一个都不跑", async () => {
    for (const limit of [0, -3]) {
      const seen: number[] = [];
      await runPool([1, 2, 3], limit, async (n) => {
        seen.push(n);
      });
      expect(seen.length).toBe(3);
    }
  });
});
