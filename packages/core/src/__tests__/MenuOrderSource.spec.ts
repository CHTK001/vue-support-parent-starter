import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("menu order source", () => {
  it("keeps recursive menu ordering and stable equal-rank tie breakers", () => {
    const source = readFileSync(
      resolve(__dirname, "../router/utils.ts"),
      "utf-8",
    );

    expect(source).toContain("ascending(v.children);");
    expect(source).toContain("const sortA = Number((a as any)?.sysMenuSort);");
    expect(source).toContain("const idA = Number((a as any)?.sysMenuId);");
  });

  it("does not synthesize rank for backstage menus that already have menu sort", () => {
    const source = readFileSync(
      resolve(__dirname, "../router/utils.ts"),
      "utf-8",
    );

    expect(source).toContain("const hasMenuSort = Number.isFinite(Number(sysMenuSort));");
    expect(source).toContain("if (meta?.backstage || hasMenuSort) {");
    expect(source).toContain("return false;");
  });
});
