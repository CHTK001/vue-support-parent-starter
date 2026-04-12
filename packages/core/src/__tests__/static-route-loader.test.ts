import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("static route loader", () => {
  it("loads page route modules lazily to avoid pulling unrelated page bundles into remote-only apps", () => {
    const source = readFileSync(
      resolve(__dirname, "../router/index.ts"),
      "utf-8",
    );

    expect(source).toContain("const moduleRouteModules");
    expect(source).toContain("const _createAlwaysAvailableModuleRouter = async () => {");
    expect(source).toContain("const module = await loader();");
    expect(source).not.toContain(
      'const moduleRouteModules: Record<string, () => Promise<any>> = import.meta.glob(\n  [\n    "../../../../pages/**/src/router.ts",\n    "../../../../pages/**/src/router/index.ts",\n    "../../../../pages/**/src/router/**/*.ts",\n    "!../../../../pages/**/dist/**",\n    "!../../../../pages/**/*.d.ts",\n  ],\n  { eager: true },\n);',
    );
  });
});
