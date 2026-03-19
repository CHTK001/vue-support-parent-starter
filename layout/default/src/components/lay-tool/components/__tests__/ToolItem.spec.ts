import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(currentDir, "../ToolItem.vue"), "utf-8");

describe("ToolItem source", () => {
  it("forwards inherited attrs to the real clickable span", () => {
    expect(source).toContain("inheritAttrs: false");
    expect(source.match(/v-bind=\"attrs\"/g)?.length || 0).toBeGreaterThanOrEqual(2);
  });
});
