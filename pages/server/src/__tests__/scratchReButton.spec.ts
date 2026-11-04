import { describe, expect, it, beforeAll, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createApp, nextTick, ref } from "vue";
import elementPlus from "element-plus";
import { installUi } from "@repo/ui";

vi.mock("@repo/core", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return { ...actual, message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } };
});

const RE = ["ReButton"];

let comps: Record<string, unknown> = {};

beforeAll(async () => {
  const app = createApp({ template: "<div/>" });
  await installUi(app, { components: RE });
  comps = Object.fromEntries(RE.map((n) => [n, app.component(n)])) as Record<string, unknown>;
});

describe("scraps ReButton square render", () => {
  it("resolves the button DOM with on classes", async () => {
    document.body.innerHTML = "";
    const wrapper = mount(
      {
        components: comps as any,
        template: `<ReButton layout="square" size="small" icon="Grid" tip="卡片视图"
            class="port-view-btn" :class="{ on: viewMode === 'card' }"
            @click="viewMode = 'card'"/>\n            <ReButton layout="square" size="small" icon="Menu" tip="列表视图"
            class="port-view-btn" :class="{ on: viewMode === 'list' }" @click="viewMode = 'list'"/>`,
        setup() {
          return { viewMode: ref<"card" | "list">("list") };
        },
      },
      { global: { plugins: [elementPlus], components: comps as any }, attachTo: document.body },
    );
    await nextTick();
    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 40));
      await nextTick();
    }
    console.log("--- all rs-btn elements ---");
    console.log([...wrapper.element.querySelectorAll("*")].filter((n) => /rs-btn/.test(n.className)).map((b) => b.outerHTML.slice(0, 280)).join("\n"));
    console.log("--- tip-wrap contents ---");
    console.log([...wrapper.element.querySelectorAll("*")].filter((n) => /tip-wrap/.test(n.className)).map((b) => b.outerHTML.slice(0, 280)).join("\n"));
    expect(true).toBe(true);
  }, 30000);
});
