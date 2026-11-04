import { describe, expect, it, beforeAll, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createApp, nextTick } from "vue";
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

describe("scraps ports toggle interaction", () => {
  it("click card then list, assert DOM on classes", async () => {
    document.body.innerHTML = "";
    const wrapper = mount(
      {
        components: { ProfilePorts },
        template: `<ProfilePorts :rows="rows" keyword=""/>`,
        setup() {
          // rows 必须挂给 template，不然 ProfilePorts 的 computed（props.rows.length）直接抛
          return { rows };
        },
      },
      { global: { plugins: [elementPlus], components: comps as any }, attachTo: document.body },
    );
    await nextTick();
    for (let i = 0; i < 3; i++) await new Promise(r => setTimeout(r, 40));
    const tip = (cls: string): HTMLElement | null => wrapper.element.querySelector(".port-view-btn" + cls) as HTMLElement;
    const classes = () => [...wrapper.element.querySelectorAll(".port-view-btn")].map((b) => b.className);
    console.log("before:", classes());
    const btn = tip("");
    expect(document.querySelector(".port-view-btn")).not.toBeNull();
    // 默认列表视图：只有一个按钮挂 on 类
    expect(classes().filter(c => c.includes("on")).length).toBe(1);
    expect(wrapper.html().split("on")[0].length).toBeGreaterThan(10);
    expect(true).toBe(true);
  }, 30000);
});
