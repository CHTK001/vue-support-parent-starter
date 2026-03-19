import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const baseTagSource = readFileSync(
  resolve(currentDir, "../BaseTag.vue"),
  "utf-8",
);
const newYearTagSource = readFileSync(
  resolve(currentDir, "../NewYearTag.vue"),
  "utf-8",
);
const halloweenTagSource = readFileSync(
  resolve(currentDir, "../HalloweenTag.vue"),
  "utf-8",
);
const christmasTagSource = readFileSync(
  resolve(currentDir, "../ChristmasTag.vue"),
  "utf-8",
);
const futureTechTagSource = readFileSync(
  resolve(currentDir, "../FutureTechTag.vue"),
  "utf-8",
);

describe("theme tag visibility source", () => {
  it("keeps the shared tag visibility guard in BaseTag", () => {
    expect(baseTagSource).toContain('v-if="!showTags"');
  });

  it("keeps the spring-festival base tag stylesheet import before custom sass rules", () => {
    const baseStyleImportIndex = Math.max(
      newYearTagSource.indexOf("@use './default.scss';"),
      newYearTagSource.indexOf('@use "./default.scss";'),
    );
    const springFestivalRuleIndex = newYearTagSource.indexOf(
      'html[data-skin="spring-festival"]',
    );

    expect(baseStyleImportIndex).toBeGreaterThanOrEqual(0);
    expect(springFestivalRuleIndex).toBeGreaterThan(baseStyleImportIndex);
  });

  it("wraps seasonal tags with BaseTag and explicit theme classes", () => {
    expect(newYearTagSource).toContain('<BaseTag theme-class="new-year-tag" />');
    expect(halloweenTagSource).toContain('<BaseTag theme-class="halloween-tag" />');
    expect(christmasTagSource).toContain('<BaseTag theme-class="christmas-tag" />');
    expect(futureTechTagSource).toContain('<BaseTag theme-class="future-tech-tag" />');
  });

  it("uses the low-cost future-tech tag styling without the old scan animation", () => {
    expect(futureTechTagSource).not.toContain("@keyframes neon-scan");
    expect(futureTechTagSource).not.toContain("animation: neon-scan");
    expect(futureTechTagSource).toContain('font-family: "Rajdhani", "Orbitron", "Consolas", sans-serif;');
  });
});
