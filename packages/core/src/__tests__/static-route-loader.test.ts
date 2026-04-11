import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("static route loader", () => {
  it("keeps alwaysIncludeStatic routes from page modules in remote-only mode", () => {
    const source = readFileSync(
      resolve(__dirname, "../router/index.ts"),
      "utf-8",
    );

    expect(source).toContain("const moduleStaticRouteModules");
    expect(source).toContain("const _createAlwaysAvailableModuleRouter = () => {");
    expect(source).toContain("Object.entries(moduleStaticRouteModules).filter");
    expect(source).toContain("_createAlwaysAvailableModuleRouter();");
  });
});
