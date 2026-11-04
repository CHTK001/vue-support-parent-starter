import { describe, expect, it, beforeAll, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createApp, nextTick, ref } from "vue";
import elementPlus from "element-plus";
import { installUi } from "@repo/ui";

vi.mock("@repo/core", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return { ...actual, message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } };
});

const RE: string[] = ["ReButton"];
let comps: Record<string, unknown> = {};

beforeAll(async () => {
  const app = createApp({ template: "<div/>" });
  await installUi(app, { components: RE });
  comps = Object.fromEntries(RE.map((n) => [n, app.component(n)])) as Record<string, unknown>;
});

function btnOf(w: ReturnType<typeof mount>, idx: number): string {
  return [...w.element.querySelectorAll(".port-view-btn")][idx]?.outerHTML.slice(0, 300) ?? "NOT FIND";
}

describe("scraps single square button", () => {
  it("single button class flip", async () => {
    document.body.innerHTML = "";
    const wrapper = mount(
      {
        components: comps as any,
        template: `<ReButton layout="square" size="small" icon="Grid" tip="卡片视图"
          class="port-view-btn" :class="{ on: viewMode === 'card' }"
          @click="toggle('card')" />`,
        setup() {
          const viewMode = ref("list");
          const toggle = (m: "card" | "list") => { viewMode.value = m; };
          return { viewMode, toggle };
        },
      },
      { global: { plugins: [elementPlus], components: comps as any }, attachTo: document.body },
    );
    await nextTick();
    await nextTick();
    await new Promise((r) => setTimeout(r, 80));
    await nextTick();
    console.log("=== card on ===");
    console.log(btnOf(wrapper, 0));
    (wrapper.vm as unknown as { toggle: (m: "card" | "list") => void }).toggle("list");
    await nextTick();
    await nextTick();
    await new Promise((r) => setTimeout(r, 80));
    await nextTick();
    console.log("=== list on ===");
    console.log(btnOf(wrapper, 0));
    expect(true).toBe(true);
  }, 30000);

  it("two buttons, single on", async () => {
    document.body.innerHTML = "";
    const wrapper = mount(
      {
        components: comps as any,
        template: `<div class="port-view-toggle">
          <ReButton layout="square" size="small" icon="Grid" tip="卡片视图" class="port-view-btn" :class="{ on: viewMode === 'card' }" @click="toggle('card')" />
          <ReButton layout="square" size="small" icon="Menu" tip="列表视图" class="port-view-btn" :class="{ on: viewMode === 'list' }" @click="toggle('list')" />
        </div>`,
        setup() {
          const viewMode = ref("list");
          const toggle = (m: "card" | "list") => { viewMode.value = m; };
          return { viewMode, toggle };
        },
      },
      { global: { plugins: [elementPlus], components: comps as any }, attachTo: document.body },
    );
    await nextTick();
    await nextTick();
    await new Promise((r) => setTimeout(r, 80));
    await nextTick();
    console.log("=== two buttons, initial ===");
    console.log([...wrapper.element.querySelectorAll(".port-view-btn")].map((b) => b.outerHTML.slice(0, 260)).join("\n\n"));
    await (wrapper.vm as unknown as { toggle: (m: "card" | "list") => void }).toggle("card");
    await nextTick();
    await nextTick();
    await new Promise((r) => setTimeout(r, 80));
    await nextTick();
    console.log("=== two buttons, card on ===");
    console.log([...wrapper.element.querySelectorAll(".port-view-btn")].map((b) => b.outerHTML.slice(0, 260)).join("\n\n"));
    expect(true).toBe(true);
  }, 30000);
});
