import { describe, it, expect } from "vitest";
import {
  applyHit,
  calcDistance,
  resolveBeaverState,
  resolveCrackLevel
} from "../game/beaverClamLogic";

describe("beaverClamLogic", () => {
  it("calcDistance should work", () => {
    expect(calcDistance(0, 0, 3, 4)).toBe(5);
    expect(calcDistance(10, 10, 10, 10)).toBe(0);
  });

  it("resolveBeaverState changes with distance", () => {
    expect(resolveBeaverState("idle", 100, 80)).toBe("walk");
    expect(resolveBeaverState("idle", 50, 80)).toBe("idle");
    expect(resolveBeaverState("hit", 50, 80)).toBe("hit");
  });

  it("resolveCrackLevel by hp", () => {
    expect(resolveCrackLevel(100)).toBe("intact");
    expect(resolveCrackLevel(60)).toBe("medium");
    expect(resolveCrackLevel(30)).toBe("heavy");
    expect(resolveCrackLevel(0)).toBe("broken");
  });

  it("applyHit reduces hp and returns crack level", () => {
    const res1 = applyHit(100, 10, 1);
    expect(res1.nextHp).toBeLessThan(100);
    expect(res1.crackLevel === "intact" || res1.crackLevel === "medium").toBe(
      true
    );

    const res2 = applyHit(20, 50, 2);
    expect(res2.nextHp).toBe(0);
    expect(res2.isBroken).toBe(true);
    expect(res2.crackLevel).toBe("broken");
  });
});


