/**
 * 菜单灌入时机策略（menuSeed）回归测试。
 *
 * 锁定「左侧菜单有时加载不出来」的修复语义。缺陷链路：
 * 侧边栏数据源 recursiveMenuList 只有 authStore.listRouters() 会写，而它此前
 * 只在「openAuth=false 的启动灌入」与「remote/all 的守卫灌入」两条路径触发，
 * 于是 openAuth=true + route.mode=static/module 的应用两条路径都落空，
 * 菜单只能靠用户手动点顶栏刷新才出现。
 *
 * 断言口径：用「出现次数」而非逐条字符串，避免新增用例时把断言改脆；
 * 每个用例都带 why，敏感性对照见文件末尾的 MUTATION 说明。
 */
import { describe, expect, it } from "vitest";
import { isGuardOwnedMenuMode, shouldSeedMenuAtStartup } from "../menuSeed";

interface SeedCase {
  /** 用例名（对照失败时按它定位） */
  name: string;
  openAuth: boolean;
  routeMode?: string;
  hasToken: boolean;
  /** 期望：启动时是否补灌菜单 + 用户信息 */
  expected: boolean;
  /** 语义理由，对照失败时据此判断「是不是因正确的原因失败」 */
  why: string;
}

/** 全组合：3 种鉴权/令牌状态 × 4 种路由模式（含缺省） */
const CASES: SeedCase[] = [
  { name: "openAuth=false / static / 无令牌", openAuth: false, routeMode: "static", hasToken: false, expected: true, why: "无登录流程，启动即灌（历史行为，不能因开了鉴权开关而丢）" },
  { name: "openAuth=false / static / 有令牌", openAuth: false, routeMode: "static", hasToken: true, expected: true, why: "同上，令牌不改变无鉴权应用的启动灌入" },
  { name: "openAuth=false / remote / 无令牌", openAuth: false, routeMode: "remote", hasToken: false, expected: true, why: "无鉴权应用没有登录流程兜底，remote 也必须启动灌" },
  { name: "openAuth=true / static / 有令牌", openAuth: true, routeMode: "static", hasToken: true, expected: true, why: "整页刷新直接进目标路由：登录流程与守卫都不跑，必须灌（本缺陷）" },
  { name: "openAuth=true / module / 有令牌", openAuth: true, routeMode: "module", hasToken: true, expected: true, why: "module 与 static 同为本地路由树模式，守卫不拉菜单" },
  { name: "openAuth=true / 缺省模式 / 有令牌", openAuth: true, hasToken: true, expected: true, why: "框架默认 route.mode=static，缺省必须等同 static" },
  { name: "openAuth=true / static / 无令牌", openAuth: true, routeMode: "static", hasToken: false, expected: false, why: "守卫马上弹登录页，灌了也会被丢弃；登录成功后由 initAuthRouter 灌" },
  { name: "openAuth=true / remote / 有令牌", openAuth: true, routeMode: "remote", hasToken: true, expected: false, why: "菜单归守卫 loadRemoteRoutes 所有，插手会重复拉取并绕开失败降级" },
  { name: "openAuth=true / all / 有令牌", openAuth: true, routeMode: "all", hasToken: true, expected: false, why: "all = 本地+远程合并，仍由守卫拉远程菜单" },
];

describe("isGuardOwnedMenuMode（谁负责拉菜单）", () => {
  it("remote / all 归守卫，static / module / 缺省 归应用", () => {
    const modes = ["remote", "all", "static", "module", undefined];
    const guardOwned = modes.filter((m) => isGuardOwnedMenuMode(m as never));
    // 出现次数口径：只有 remote、all 两个归守卫
    expect(guardOwned.sort()).toEqual(["all", "remote"]);
    expect(modes.length - guardOwned.length).toBe(3);
  });

  it("与 guard.ts 的 isRemote 判定同源（大小写/空串不误判）", () => {
    expect(isGuardOwnedMenuMode("")).toBe(false);
    expect(isGuardOwnedMenuMode("Remote")).toBe(false);
    expect(isGuardOwnedMenuMode(null)).toBe(false);
  });
});

describe("shouldSeedMenuAtStartup（启动期补灌判定）", () => {
  it("全组合与期望一致，0 条不一致", () => {
    const mismatch = CASES.filter(
      (c) =>
        shouldSeedMenuAtStartup({
          openAuth: c.openAuth,
          routeMode: c.routeMode,
          hasToken: c.hasToken,
        }) !== c.expected,
    );
    expect(mismatch.map((c) => `${c.name}：${c.why}`)).toEqual([]);
  });

  it("矩阵规模自检：期望灌入 6 条、不灌入 3 条", () => {
    expect(CASES).toHaveLength(9);
    expect(CASES.filter((c) => c.expected)).toHaveLength(6);
    expect(CASES.filter((c) => !c.expected)).toHaveLength(3);
  });

  it("缺陷主路径：openAuth=true + static/module/缺省 + 有令牌 → 必须灌", () => {
    const defectCases = CASES.filter(
      (c) => c.openAuth && c.hasToken && (c.routeMode === "static" || c.routeMode === "module" || c.routeMode === undefined),
    );
    expect(defectCases).toHaveLength(3);
    defectCases.forEach((c) => {
      expect(
        shouldSeedMenuAtStartup({ openAuth: c.openAuth, routeMode: c.routeMode, hasToken: c.hasToken }),
        `${c.name} 应补灌：${c.why}`,
      ).toBe(true);
    });
  });

  it("守卫模式绝不插手：openAuth=true 且 remote/all 的组合都不灌", () => {
    const guardCases = CASES.filter((c) => c.openAuth && (c.routeMode === "remote" || c.routeMode === "all"));
    expect(guardCases).toHaveLength(2);
    guardCases.forEach((c) => {
      expect(
        shouldSeedMenuAtStartup({ openAuth: c.openAuth, routeMode: c.routeMode, hasToken: c.hasToken }),
        `${c.name} 不应补灌：${c.why}`,
      ).toBe(false);
    });
  });
});

/*
 * 敏感性对照（mutation，人工执行，跑完必须还原；已实测两次）：
 *
 * M1 把 isGuardOwnedMenuMode 改成 `mode === "remote"`（丢掉 all）
 *   → 3 条用例失败，失败集合与被改语义一一对应：
 *     1) 「remote / all 归守卫」数组少 "all"；
 *     2) 启动矩阵不一致 1 条 = openAuth=true / all / 有令牌；
 *     3) 「守卫模式绝不插手」1 条 = openAuth=true / all / 有令牌。
 *   未涉及 all 的 6 条保持通过（不多不少）。
 *
 * M2 删掉 shouldSeedMenuAtStartup 的 `if (!input.openAuth) return true;`
 *   → 启动矩阵不一致 2 条：
 *      openAuth=false / static / 无令牌、openAuth=false / remote / 无令牌。
 *      openAuth=false / static / 有令牌 仍为 true（被 hasToken 撑住），
 *      openAuth=true 的 7 条全部不变 —— 失败集合精确对应「无令牌的无鉴权启动」。
 *
 * 两次对照都「因正确的原因失败」：失败项与被改分支一一对应。
 */
