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

const RE = ["ReButton", "ReText", "ReIcon", "ReInput"];

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

describe("scratch ports toggle", () => {
  it("dump toggle classes", async () => {
    document.body.innerHTML = "";
    const wrapper = mount(
      {
        components: { ProfilePorts },
        template: `<ProfilePorts :rows="rows" :keyword="" />`,
        setup() {
          return { rows };
        },
      },
      { global: { plugins: [elementPlus], components: comps as any }, attachTo: document.body },
    );
    await nextTick();
    await nextTick();
    await nextTick();
    const html = wrapper.html();
    // 1. 容器结构
    const bar = html.match(/class="pfs-tools">([\s\S]*?)<\/div>/);
    console.log("--- pfs-tools inner ---");
    console.log(bar ? bar[1] : "NOT FOUND");
    console.log("--- raw toggle zone ---");
    const idx = html.indexOf("port-view-toggle");
    console.log(html.slice(idx, idx + 3000));
    console.log("--- all elements with port-view-btn class ---");
    console.log(wrapper.html().match(/class="[^"]*port-view-btn[^"]*"/g) || "none");
    console.log("--- every button-like element ---");
    console.log([...wrapper.element.querySelectorAll("*")].filter((n) => n.tagName === "BUTTON").map((b) => b.outerHTML.slice(0, 160)).join("\n"));
    console.log("--- svg/mounted ---");
    console.log([...wrapper.element.querySelectorAll("*")].filter((n) => /rs-btn|re-button/.test(n.className)).map((b) => b.outerHTML.slice(0, 200)).join("\n"));
    expect(true).toBe(true);
  }, 30000);
});
