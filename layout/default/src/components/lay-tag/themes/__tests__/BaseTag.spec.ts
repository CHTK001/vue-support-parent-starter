import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const baseTagSource = readFileSync(resolve(currentDir, "../BaseTag.vue"), "utf-8");

describe("BaseTag source", () => {
  it("keeps the shared tag container and scroll structure", () => {
    expect(baseTagSource).toContain('v-if="!showTags"');
    expect(baseTagSource).toContain('class="scroll-container"');
    expect(baseTagSource).toContain("'scroll-item is-closable'");
  });

  it("wires the extracted right-click menu component into the shared tag shell", () => {
    expect(baseTagSource).toContain("<TagContextMenu");
    expect(baseTagSource).toContain(':items="tagsViews"');
    expect(baseTagSource).toContain('@select="selectTag"');
  });

  it("keeps both arrow controls in the template", () => {
    expect(baseTagSource).toContain('class="arrow-left"');
    expect(baseTagSource).toContain('class="arrow-right"');
  });
});
