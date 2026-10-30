/**
 * 新增主机弹窗 打开请求计量：每次打开只写一次 parent visible=true，不重复打开弹窗壳。
 *
 * 前置发现（6）：
 *  - 一次 koi ReDialog 打开周期里 el-dialog 只过一个 `open`
 *  - 最小化 → Dock 恢复路径同样只出一个 open（reDialogDock.spec 已证）
 *  - 闪动的根因收敛到「弹窗的打开请求被发出了两次」
 *
 * 本测试只面向「打开请求」断言：重复打开不重新打开，弹窗壳不重复创建。
 *
 * @author CH
 * @since 4.0.0
 */
import { describe, expect, it, beforeAll, vi } from "vitest";
import { mount } from "@vue/test-utils";
import type { Component } from "vue";
import { createApp, nextTick, ref } from "vue";
import elementPlus from "element-plus";
import { installUi } from "@repo/ui";
import HostFormDialog from "../views/HostFormDialog.vue";

/** HostFormDialog 模板里用到的 Re 控件 + ReKit（ReFormItem/ReOption 在此） */
const RE_COMPONENTS = [
  "ReText",
  "ReButton",
  "ReInput",
  "ReInputNumber",
  "ReSelect",
  "ReSwitch",
  "ReForm",
  "ReDialog",
  "ReKit",
];

/** 弹窗壳在 body 里的创建/消失 */
const OVERLAY_LOG: string[] = [];

vi.mock("../api", () => ({
  getHost: vi.fn().mockResolvedValue(undefined),
  listBoundIdentities: vi.fn().mockResolvedValue([]),
  bindIdentity: vi.fn().mockResolvedValue(undefined),
  saveHost: vi.fn().mockResolvedValue({ id: 1 }),
  testPrometheusHost: vi.fn().mockResolvedValue(undefined),
  fetchLocalAddress: vi.fn().mockResolvedValue(undefined),
  getIdentities: vi.fn().mockResolvedValue([]),
}));

vi.mock("@repo/core", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return { ...actual, message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } };
});

vi.mock("vue-router", () => ({
  useRouter: () => ({} as unknown as Record<string, unknown>),
}));

beforeAll(async () => {
  const app = createApp({ template: "<div/>" });
  await installUi(app, { components: [...RE_COMPONENTS] });
  globalComponents = Object.fromEntries(RE_COMPONENTS.map((name) => [name, app.component(name)])) as Record<string, Component>;
});

let globalComponents: Record<string, Component> = {};

/** 弹窗壳在 body 里的创建/消失 */
function watchOverlays(): [() => void, () => string] {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node instanceof HTMLElement && node.querySelector(".el-overlay-dialog")) OVERLAY_LOG.push("ADD");
      }
      for (const node of m.removedNodes) {
        if (node instanceof HTMLElement && node.querySelector(".el-overlay-dialog")) OVERLAY_LOG.push("DEL");
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return [() => observer.disconnect(), () => JSON.stringify(OVERLAY_LOG)];
}

/** 挂载宿主：父级持有 formVisible，两个新增主机登钮（工具栏 + Dock） */
function mountHost(): {
  wrapper: ReturnType<typeof mount<any>>;
  disconnect: () => void;
  /** 父级 visible 的每一次写 */
  writes: string[];
  /** 被打开的请求已经发出去了几次 */
  opens: string[];
  overlayLog: () => string;
} {
  OVERLAY_LOG.length = 0;
  const [disconnect, overlayLog] = watchOverlays();
  const visible = ref(false);
  const writes: string[] = [];
  const opens: string[] = [];
  const wrapper = mount(
    {
      components: { HostFormDialog },
      template: `<div id="root">
        <button id="openRail" @click="openAdd">新增主机（工具栏）</button>
        <button id="openDock" @click="openAdd">新增主机（Dock）</button>
        <HostFormDialog v-model="visible" :is-edit="false" :host="null" :identity-options="[]" :group-options="[]" />
      </div>`,
      setup() {
        const openAdd = (): void => {
          writes.push("openAdd");
          if (visible.value) return; // 防重：弹窗已经打开，不重复打开
          visible.value = true;
          opens.push("open");
        };
        return { openAdd, visible };
      },
    },
    {
      global: { plugins: [elementPlus], components: { ...globalComponents, HostFormDialog } },
      attachTo: document.body,
    },
  ) as ReturnType<typeof mount<any>>;
  return { wrapper, disconnect, writes, opens, overlayLog };
}

// eslint-disable-next-line eslint-comments/disable-disabled-next-line
describe("新增主机弹窗 打开请求", () => {
  it("一次打开：弹窗壳只创建一次 / 只写一次 true", async () => {
    const { wrapper, disconnect, writes, opens, overlayLog } = mountHost();
    await nextTick();
    await wrapper.find("#openRail").trigger("click");
    for (let i = 0; i < 12; i++) await nextTick();
    console.log("writes:", JSON.stringify(writes), "opens:", JSON.stringify(opens), "overlays:", overlayLog());
    expect(overlayLog()).toBe('["ADD"]');
    expect(opens).toEqual(["open"]);
    disconnect();
    wrapper.unmount();
  }, 60000);

  it("第二次打开请求：不重复创建弹窗壳", async () => {
    const { wrapper, disconnect, writes, opens, overlayLog } = mountHost();
    await nextTick();
    await wrapper.find("#openRail").trigger("click");
    for (let i = 0; i < 12; i++) await nextTick();
    await wrapper.find("#openDock").trigger("click");
    await wrapper.find("#openRail").trigger("click");
    for (let i = 0; i < 12; i++) await nextTick();
    console.log("writes:", JSON.stringify(writes), "opens:", JSON.stringify(opens), "overlays:", overlayLog());
    expect(overlayLog()).toBe('["ADD"]');
    expect(opens).toEqual(["open"]);
    disconnect();
    wrapper.unmount();
  }, 60000);
});
