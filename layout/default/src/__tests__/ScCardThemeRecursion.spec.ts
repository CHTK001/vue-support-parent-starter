import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getThemeLocalComponentConfig } from "../../../../packages/components/hooks/themeConfig";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../../../../");
const scCardDefaultLayoutSource = readFileSync(
  resolve(repoRoot, "packages/components/ScCard/layouts/Default.vue"),
  "utf-8",
);

describe("ScCard local theme recursion guard", () => {
  it("keeps local ElCard wrappers registered for festive and future-tech themes", () => {
    for (const themeKey of [
      "future-tech",
      "halloween",
      "christmas",
      "spring-festival",
    ] as const) {
      expect(getThemeLocalComponentConfig(themeKey, "ElCard")).not.toBeNull();
    }
  });

  it("forces ScCard default layout back to native ElCard when a local themed wrapper exists", () => {
    expect(scCardDefaultLayoutSource).toContain(
      'getThemeLocalComponentConfig(currentSkin.value, "ElCard")',
    );
    expect(scCardDefaultLayoutSource).toContain("const renderedCardComponent");
    expect(scCardDefaultLayoutSource).toContain("return ElCard;");
  });
});
