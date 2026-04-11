import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("mini menu api", () => {
  it("exposes dedicated mini menu runtime api and cache helpers", () => {
    const source = readFileSync(
      resolve(__dirname, "../api/common/mini-menu.ts"),
      "utf-8",
    );

    expect(source).toContain('const MINI_MENU_CACHE_KEY = "mini-menus"');
    expect(source).toContain('"/v2/user/mini-menu"');
    expect(source).toContain("export const loadUserMiniMenus = async");
    expect(source).toContain("export const clearCachedUserMiniMenus = () =>");
  });

  it("re-exports mini menu api from package entry", () => {
    const source = readFileSync(resolve(__dirname, "../../index.ts"), "utf-8");

    expect(source).toContain('export * from "./src/api/common/mini-menu";');
  });
});
