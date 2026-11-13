/**
 * 登录凭据记忆回归测试。
 *
 * <p>核心只验两条：</p>
 * <ul>
 *   <li>write → read 往返后账号口令一致；</li>
 *   <li>落进 localStorage 的值不是明文口令（框架 storage 的 encode 生效）；</li>
 *   <li>清除后读不到，避免取消勾选后仍自动回填。</li>
 * </ul>
 *
 * <p>必须先 stub window 再动态 import：storage.ts 在模块求值时就把
 * window.localStorage 抓成了常量，import 之后再 stub 已经来不及。</p>
 */
import { afterEach, describe, expect, it, vi } from "vitest";

/** 最小 localStorage 实现，保留原始 map 便于检查密文 */
function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    get length(): number {
      return map.size;
    },
    getItem(key: string): string | null {
      return map.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      map.set(key, value);
    },
    removeItem(key: string): void {
      map.delete(key);
    },
    key(index: number): string | null {
      return Array.from(map.keys())[index] ?? null;
    },
    clear(): void {
      map.clear();
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loginCredential", () => {
  it("往返一致、密文落盘，清除后不再回填", async () => {
    const localStorage = createMemoryStorage();
    vi.stubGlobal("window", {
      localStorage,
      sessionStorage: createMemoryStorage(),
      isSecureContext: false,
    });

    const { clearRememberedLogin, readRememberedLogin, saveRememberedLogin } = await import(
      "../loginCredential"
    );
    const { createStorage } = await import("../../storage");

    expect(saveRememberedLogin("web", { loginName: "admin", password: "P@ssw0rd-明文" })).toBe(true);

    // 落盘内容不得包含明文口令（凭据存储强制 AES，与全局 encode 开关无关）
    const rawValues = Array.from(localStorage.map.values()).join("\n");
    expect(rawValues).not.toContain("P@ssw0rd-明文");
    expect(rawValues.length).toBeGreaterThan(0);

    expect(readRememberedLogin("web")).toMatchObject({
      loginName: "admin",
      password: "P@ssw0rd-明文",
    });

    // 登录页守卫会清 system: 前缀的旧令牌/用户缓存；记住凭据必须被保留
    const appStorage = createStorage(localStorage, { prefix: "system" });
    appStorage.set("accessToken", "old-token");
    appStorage.clearUserStorage(["login.remember"]);
    expect(appStorage.get("accessToken")).toBeNull();
    expect(readRememberedLogin("web")?.loginName).toBe("admin");

    clearRememberedLogin("web");
    expect(readRememberedLogin("web")).toBeNull();
  });

  it("不同登录入口互不覆盖", async () => {
    const localStorage = createMemoryStorage();
    vi.stubGlobal("window", {
      localStorage,
      sessionStorage: createMemoryStorage(),
      isSecureContext: false,
    });

    const { readRememberedLogin, saveRememberedLogin } = await import("../loginCredential");

    saveRememberedLogin("web", { loginName: "platform-user", password: "p1" });
    saveRememberedLogin("tenant", { loginName: "tenant-user", password: "p2" });

    expect(readRememberedLogin("web")?.loginName).toBe("platform-user");
    expect(readRememberedLogin("tenant")?.loginName).toBe("tenant-user");
  });
});
