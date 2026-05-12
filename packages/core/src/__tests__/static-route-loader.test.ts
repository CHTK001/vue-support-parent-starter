import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("static route loader", () => {
  it("uses direct import for remaining routes and addAppRoutes for app routes", () => {
    const source = readFileSync(
      resolve(__dirname, "../router/index.ts"),
      "utf-8",
    );

    // 不再使用 import.meta.glob 自动发现路由
    expect(source).not.toContain("import.meta.glob");
    // 使用 direct import 替代 glob 发现 remaining 路由
    expect(source).toContain("coreRemainingRoutes");
    // 应用通过 addAppRoutes 显式注册路由
    expect(source).toContain("addAppRoutes");
    // finalizeRoutes 负责完成初始化
    expect(source).toContain("finalizeRoutes");
    // 始终加载错误页面
    expect(source).toContain("ALWAYS_ERROR_ROUTES");
    // 无路由时自动添加首页
    expect(source).toContain("ensureHomeRoute");
  });
});
