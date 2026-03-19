import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));

function readSource(relativePath: string) {
  return readFileSync(resolve(currentDir, relativePath), "utf-8");
}

describe("seasonal navigation component bindings", () => {
  it("uses dedicated spring festival menu components instead of new-year components", () => {
    const verticalSource = readSource("../themes/SpringFestival.vue");
    const horizontalSource = readSource("../themes/horizontal/SpringFestival.vue");
    const mixSource = readSource("../themes/mix/SpringFestival.vue");

    expect(verticalSource).toContain("SpringFestivalSidebarItem");
    expect(verticalSource).not.toContain("NewYearSidebarItem");

    expect(horizontalSource).toContain("SpringFestivalCustomSidebarItem");
    expect(horizontalSource).toContain("spring-festival-custom-popper");
    expect(horizontalSource).not.toContain("NewYearCustomSidebarItem");
    expect(horizontalSource).not.toContain("new-year-custom-popper");

    expect(mixSource).toContain('menu-item-class="spring-festival-mix-item"');
    expect(mixSource).toContain("spring-festival-custom-popper");
    expect(mixSource).not.toContain("new-year-custom-popper");
  });

  it("binds dedicated mix menu item classes for halloween and christmas", () => {
    const halloweenMixSource = readSource("../themes/mix/Halloween.vue");
    const christmasMixSource = readSource("../themes/mix/Christmas.vue");

    expect(halloweenMixSource).toContain('menu-item-class="halloween-mix-item"');
    expect(christmasMixSource).toContain('menu-item-class="christmas-mix-item"');
  });
});
