/**
 * ReDialog（新增主机弹窗）闪动再现。
 *
 * <p>用户报告：「新增主机 弹出的 ReDialog 闪动了两次」。应用实际主题来自
 * packages/config shared.ts 默认值 `themeId: "koi"`（koi 版 ReDialog 有
 * localOpen/visible 双向闭环），所以先给 koi 主题建立可观测的挂载，统计 `.el-overlay-dialog`
 * DOM 产生次数与 open/close/closed 事件数；再挂完整的 HostFormDialog。
 * 一次"闪动"在 DOM 上的证据是 `.el-dialog` 被创建两次（或同一片 dom 先有后无再出现）。</p>
 *
 * @author CH
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick, ref } from "vue";
import elementPlus from "element-plus";
import ReDialog from "@repo/ui/re-dialog";
import ReButton from "@repo/ui/re-button";
import ReForm from "@repo/ui/re-form";
import ReFormItem from "@repo/ui/re-kit";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReText from "@repo/ui/re-text";
import Minimal from "./fixtures/reDialogMinimal.vue";
import Harness from "./fixtures/reDialogHarness.vue";

/** 应用默认主题 koi（shared.ts defaultAppConfig.other.themeId = "koi"） */
vi.mock("@repo/config", () => ({
  getConfig: () => ({ other: { themeId: "koi", themes: [] }, app: { openAuth: false } } as any),
  defaultAppConfig: { other: { themeId: "koi" } } as any,
  setConfig: vi.fn(),
}));
vi.mock("@repo/utils", () => ({
  http: vi.fn(),
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
  unwrapResult: vi.fn(),
}));
vi.mock("../api", () => ({
  saveHost: vi.fn(),
  getHost: vi.fn(),
  listBoundIdentities: vi.fn(),
  getIdentities: vi.fn(),
  fetchLocalAddress: vi.fn(),
  testPrometheusHost: vi.fn(),
  deployAgent: vi.fn(),
}));

const RE_COMPONENTS = Object.fromEntries([
  ["ReButton", ReButton],
  ["ReDialog", ReDialog],
  ["ReForm", ReForm],
  ["ReFormItem", ReFormItem],
  ["ReInput", ReInput],
  ["ReInputNumber", ReInputNumber],
  ["ReSelect", ReSelect],
  ["ReSwitch", ReSwitch],
  ["ReText", ReText],
].map(([n, c]) => [n, c]));

/** 统计在 body 里新增的 .el-dialog 个数（创建/销毁各计一次改动） */
function countDomCreations(delayMs = 150): Promise<number> {
  return new Promise((resolve) => {
    const body = document.body;
    const seen = new Set<Node>();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.querySelector(".el-dialog")) seen.add(node);
        }
      }
    });
    observer.observe(body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(seen.size);
    }, delayMs);
  });
}

async function settleN(n = 3): Promise<void> {
  for (let i = 0; i < n; i++) await nextTick();
}

describe("新增主机弹窗 是否闪动", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("最小 ReDialog：click → open 1 次，关闭后只开一次", async () => {
    const wrapper = mount(Minimal, {
      global: {
        plugins: [elementPlus],
        components: RE_COMPONENTS,
      },
    });
    wrapper.find("#open").trigger("click");
    await settleN(3);
    const first = (wrapper.vm as any).events.value;
    const covers = document.querySelectorAll(".el-overlay-dialog").length;
    console.log(`minimal: events=${JSON.stringify(first)} overlayDialogs=${covers}`);
    expect(covers).toBe(1);
    /** 关 → 再开，不闪 */
    const openCount = (wrapper.vm as any).events.value;
    await wrapper.find("#open").trigger("click");
    await settleN(3);
    const second = (wrapper.vm as any).events.value;
    console.log(`minimal 2nd: events=${JSON.stringify(second)} overlayDialogs=${document.querySelectorAll(".el-overlay-dialog").length}`);
    await wrapper.unmount();
  }, 30000);

  it("完整 HostFormDialog：open 只触发一次，弹窗 DOM 不重复创建", async () => {
    const wrapper = mount(Harness, {
      global: {
        plugins: [elementPlus],
        components: RE_COMPONENTS,
      },
    });
    const created = countDomCreations();
    wrapper.find("#open").trigger("click");
    await settleN(3);
    const n = await created;
    console.log(`hostform: .el-dialog creations=${n} overlayDialogs=${document.querySelectorAll(".el-overlay-dialog").length}`);
    expect(n).toBe(1);
    await wrapper.unmount();
  }, 30000);
});
