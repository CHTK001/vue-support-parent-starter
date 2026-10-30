/**
 * 新增主机弹窗（HostFormDialog / ReDialog）闪动再现。
 *
 * <p>用户报告：「新增主机 弹出的 ReDialog 闪动了两次」。应用实际主题来自
 * {@code packages/config shared.ts} 默认值 {@code themeId: "koi"}，koi 版 ReDialog 维护着
 * {@code visible}（v-model） ↔ {@code localOpen}（el-dialog）的双向闭环。</p>
 *
 * <p>排查手段：不打开页面，直接挂载真实组件，用 MutationObserver 盯着 body 里
 * {@code .el-overlay-dialog}（element-plus 弹窗壳）的创建/消失，统计弹窗被建立了几次。
 * 一次「闪动」在 DOM 上的证据是弹窗 shell 先创建、再销毁、再创建（ADD ... DEL ... ADD）。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { describe, expect, it, beforeAll, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createApp, nextTick, ref, type Component } from "vue";
import elementPlus from "element-plus";
import { installUi } from "@repo/ui";

import Minimal from "./fixtures/reDialogMinimal.vue";
import HostFormDialog from "../views/HostFormDialog.vue";

/** 弹窗壳在 body 上的创建/消失序列 */
const OVERLAY_LOG: string[] = [];

/** 弹窗壳在 body 上的当前创建时刻 */
const OVERLAY_AT: number[] = [];

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
  return {
    ...actual,
    message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  };
});

vi.mock("vue-router", () => ({
  useRouter: () => ({} as unknown as Record<string, unknown>),
}));

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

let globalComponents: Record<string, Component> = {};

beforeAll(async () => {
  const app = createApp({ template: "<div/>" });
  await installUi(app, { components: [...RE_COMPONENTS] });
  globalComponents = Object.fromEntries(RE_COMPONENTS.map(name => [name, app.component(name)])) as Record<string, Component>;
});

/** 打开弹窗并等骨架落进(body Teleport) */
async function open(wrapper: ReturnType<typeof mount<any>>): Promise<void> {
  wrapper.find("#open").trigger("click");
  for (let i = 0; i < 12; i++) await nextTick();
}

/** 启动一个盯着弹窗壳的 MutationObserver */
function watchOverlays(): [() => void, () => string] {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node instanceof HTMLElement && node.querySelector(".el-overlay-dialog")) {
          OVERLAY_LOG.push("ADD");
          OVERLAY_AT.push(Date.now());
        }
      }
      for (const node of m.removedNodes) {
        if (node instanceof HTMLElement && node.querySelector(".el-overlay-dialog")) OVERLAY_LOG.push("DEL");
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return [() => observer.disconnect(), () => JSON.stringify(OVERLAY_LOG)];
}

/** 挂载宿主：一个持有 visible 的父级 + HostFormDialog */
function mountHost(): ReturnType<typeof mount<any>> {
  return mount(
    {
      template: `<div id="root"><button id="open" @click="visible = true">新增主机</button>
        <HostFormDialog v-model="visible" :is-edit="false" :host="null" :identity-options="[]" :group-options="[]" /></div>`,
      components: { HostFormDialog },
      setup() {
        return { visible: ref(false) };
      },
    },
    {
      global: { plugins: [elementPlus], components: globalComponents },
      attachTo: document.body,
    },
  ) as ReturnType<typeof mount<any>>;
}

describe("新增主机弹窗 闪动", () => {
  it("最简 ReDialog：一次打开、弹窗壳不重复", async () => {
    document.body.innerHTML = "";
    OVERLAY_LOG.length = 0;
    OVERLAY_AT.length = 0;
    const [disconnect, log] = watchOverlays();
    const wrapper = mount(Minimal, { global: { plugins: [elementPlus], components: globalComponents } });
    await open(wrapper);
    console.log("minimal overlayLog:", log(), "overlays:", document.querySelectorAll(".el-overlay-dialog").length, "events:", JSON.stringify((wrapper.vm as any).events.value));
    disconnect();
    expect(document.querySelectorAll(".el-overlay-dialog").length).toBe(1);
  }, 30000);

  it("HostFormDialog：弹窗只建立一次 DOM", async () => {
    document.body.innerHTML = "";
    OVERLAY_LOG.length = 0;
    OVERLAY_AT.length = 0;
    const [disconnect, log] = watchOverlays();
    let wrapper: ReturnType<typeof mount<any>> | null = null;
    try {
      wrapper = mountHost();
      await open(wrapper);
      console.log("host overlayLog:", log(), "overlays:", document.querySelectorAll(".el-overlay-dialog").length);
    } catch (e) {
      console.log("host error:", String((e as Error)?.stack || e));
      expect.fail(String((e as Error)?.stack || e));
    } finally {
      if (wrapper) wrapper.unmount();
      disconnect();
    }
    expect(OVERLAY_LOG.filter(x => x === "ADD").length, "弹窗 shell 应只被建立一次").toBe(1);
  }, 30000);
});
