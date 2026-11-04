import { describe, expect, it, beforeAll, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createApp, nextTick, ref } from "vue";
import elementPlus from "element-plus";
import { installUi } from "@repo/ui";
import ProfilePorts from "../components/profile/ProfilePorts.vue";

vi.mock("@repo/core", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return { ...actual, message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } };
});

const RE: string[] = ["ReButton", "ReText", "ReIcon", "ReInput"];
let comps: Record<string, unknown> = {};

beforeAll(async () => {
  const app = createApp({ template: "<div/>" });
  await installUi(app, { components: RE });
  comps = Object.fromEntries(RE.map((n) => [n, app.component(n)])) as Record<string, unknown>;
});

const rows: Record<string, any>[] = [
  { protocol: "TCP", local: "0.0.0.0", port: 22, state: "LISTEN", pid: 100, process: "sshd" },
  { protocol: "TCP", local: "127.0.0.1", port: 8080, state: "LISTEN", pid: 200, process: "node" },
  { protocol: "UDP", local: "0.0.0.0", port: 53, state: "LISTEN", pid: 300, process: "named" },
];

function btnStates(w: ReturnType<typeof mount>): string {
  return [...w.element.querySelectorAll(".port-view-btn")].map((b) => b.className.split(/\s+/).includes("on") ? "on(" + (b.querySelector("svg")?.getAttribute("viewBox") ?? "") + ")" : "off").join(",");
}

describe("scraps ports toggle click", () => {
  it("click card button: on should move to card", async () => {
    document.body.innerHTML = "";
    const wrapper = mount(
      {
        components: { ProfilePorts },
        template: `<ProfilePorts :rows="rows" keyword=""/>`,
        setup() {
          return { rows };
        },
      },
      { global: { plugins: [elementPlus], components: comps as any }, attachTo: document.body },
    );
    await nextTick();
    for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 40));
    console.log("initial:", btnStates(wrapper));
    const grid = [...wrapper.element.querySelectorAll(".port-view-btn")].find((b) => !b.className.includes("on"));
    expect(grid).not.toBeNull();
    await grid!.click();
    await nextTick();
    await new Promise((r) => setTimeout(r, 60));
    await nextTick();
    console.log("after click:", btnStates(wrapper));
    expect([...wrapper.element.querySelectorAll(".port-view-btn")][0].className).toContain("on");
    expect([...wrapper.element.querySelectorAll(".port-view-btn")][1].className).not.toContain("on");
  }, 30000);
});
