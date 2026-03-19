import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(currentDir, "../BaseTag.vue"), "utf-8");

describe("BaseTag source", () => {
  it("keeps the shared tag scroll and context menu structure", () => {
    expect(source).toContain("class=\"scroll-container\"");
    expect(source).toContain("<Teleport to=\"body\">");
    expect(source).toContain("<TagContextMenu");
    expect(source).toContain(":items=\"tagsViews\"");
  });

  it("uses fixed-position viewport clamping for the right-click menu", () => {
    expect(source).toContain("CONTEXT_MENU_WIDTH = 180");
    expect(source).toContain("CONTEXT_MENU_ITEM_HEIGHT = 36");
    expect(source).toContain("buttonLeft.value = Math.min");
    expect(source).toContain("buttonTop.value = Math.min");
    expect(source).toContain("window.addEventListener(\"scroll\", handleViewportContextChange, true)");
    expect(source).toContain("document.addEventListener(\"mousedown\", handleDocumentPointerDown)");
  });

  it("keeps both scroll arrow controls in the template", () => {
    expect(source).toContain("class=\"arrow-left\"");
    expect(source).toContain("class=\"arrow-right\"");
    expect(source).toContain("@click=\"handleScroll(-200)\"");
    expect(source).toContain("@click=\"handleScroll(200)\"");
  });
});
