/**
 * 协同自动保存调度的单元测试
 *
 * <p>盯两件事：①输入过程中不发请求（每次编辑都把定时器往后推）；
 * ②连续输入也不会永远不保存（最长等待到点强制写）。</p>
 *
 * @author Buffy
 * @since 2026/11/06
 */
import { describe, expect, it } from "vitest";
import {
  COLLAB_AUTOSAVE_DELAY_MS,
  COLLAB_AUTOSAVE_MAX_WAIT_MS,
  COLLAB_AUTOSAVE_MIN_DELAY_MS,
  nextAutoSaveDelay,
  shouldPollCollab,
} from "./collabAutosave";

describe("nextAutoSaveDelay（空闲延迟 + 最长等待）", () => {
  it("刚变脏：按空闲延迟安排", () => {
    const now = 1_000_000;
    expect(nextAutoSaveDelay(now, now)).toBe(COLLAB_AUTOSAVE_DELAY_MS);
  });

  it("连续输入：每次都往后推，但不越过最长等待", () => {
    const t0 = 5_000_000;
    // 第 1 次编辑
    expect(nextAutoSaveDelay(t0, t0)).toBe(3000);
    // 6 秒后仍在输入：空闲延迟仍是 3s，但距最长等待只剩 9s → 取 3s
    expect(nextAutoSaveDelay(t0, t0 + 6000)).toBe(3000);
    // 13 秒后仍在输入：距上限只剩 2s → 取 2s（这就是「到点强制写」）
    expect(nextAutoSaveDelay(t0, t0 + 13_000)).toBe(2000);
    // 15 秒后：剩余 0 → 落成最小间隔，下一次事件即触发保存
    expect(nextAutoSaveDelay(t0, t0 + 15_000)).toBe(COLLAB_AUTOSAVE_MIN_DELAY_MS);
  });

  it("超过最长等待也不会算出 0 或负数（避免空转定时器）", () => {
    const t0 = 1;
    expect(nextAutoSaveDelay(t0, t0 + 10 * COLLAB_AUTOSAVE_MAX_WAIT_MS)).toBe(
      COLLAB_AUTOSAVE_MIN_DELAY_MS,
    );
  });

  it("自定义参数：空闲延迟大于剩余等待时以剩余为准", () => {
    const t0 = 100;
    expect(nextAutoSaveDelay(t0, t0 + 4_000, 30_000, 5_000)).toBe(1000);
  });
});

describe("shouldPollCollab（轮询门禁）", () => {
  it("可见且空闲才轮询", () => {
    expect(shouldPollCollab(true, false, false)).toBe(true);
  });

  it("后台标签页 / 保存中 / 有未保存改动都不轮询", () => {
    expect(shouldPollCollab(false, false, false)).toBe(false);
    expect(shouldPollCollab(true, true, false)).toBe(false);
    expect(shouldPollCollab(true, false, true)).toBe(false);
  });
});
