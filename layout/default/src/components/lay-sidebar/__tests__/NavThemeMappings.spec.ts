import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const supportedThemeEntries = [
  "default",
  "8bit",
  "spring-festival",
  "halloween",
  "christmas",
  "future-tech",
];

const navSources = [
  readFileSync(resolve(currentDir, "../NavVertical.vue"), "utf-8"),
  readFileSync(resolve(currentDir, "../NavHorizontal.vue"), "utf-8"),
  readFileSync(resolve(currentDir, "../NavMix.vue"), "utf-8"),
  readFileSync(resolve(currentDir, "../NavHover.vue"), "utf-8"),
  readFileSync(resolve(currentDir, "../NavDrawer.vue"), "utf-8"),
];

describe("sidebar navigation theme mappings source", () => {
  it("registers all active themes across desktop navigation entries", () => {
    for (const source of navSources) {
      for (const themeEntry of supportedThemeEntries) {
        expect(source).toContain(themeEntry);
      }
    }
  });
});
