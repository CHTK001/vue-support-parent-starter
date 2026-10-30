/**
 * 弹窗开/关周期计量：@open/@close/@closed/@update:modelValue/overlayADD，对比
 * 最简 ReDialog 与 新增主机 HostFormDialog 两个路径。
 *
 * @author CH
 * @since 4.0.0
 */
import { describe, expect, it, beforeAll, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createApp, defineComponent, h, nextTick, ref } from "vue";
import elementPlus from "element-plus";
import { installUi } from "@repo/ui";
import { Events } from "./fixtures/shared";

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
/** 弹窗事件序列 */
const EVENT_LOG: string[] = [];

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
  const actual = await importOriginal();
  return { ...actual, message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } };
});

vi.mock("vue-router", () => ({
  useRouter: () => ({} as unknown as Record<string, unknown>),
}));

beforeAll(async () => {
  const app = createApp({ template: "<div/>" });
  await installUi(app, { components: [...RE_COMPONENTS] });
  realReDialog = app.component("ReDialog");
  globalComponents = Object.fromEntries(RE_COMPONENTS.map((name) => [name, app.component(name)]));
});

let globalComponents: Record<string, unknown> = {};

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

/** v-model/事件包装：原样透传 props/插槽，拦截所有事件、写入 EVENT_LOG */
let realReDialog: unknown;
const SpyReDialog = defineComponent({
  name: "SpyReDialog",
  inheritAttrs: false,
  props: { modelValue: { type: Boolean, default: false } },
  setup(props, { attrs, emit }) {
    return () => {
      const merged = { ...attrs } as any;
      merged.modelValue = props.modelValue;
      merged.onUpdateModelValue = (v: boolean) => {
        EVENT_LOG.push(`update:modelValue:${v}`);
        emit("update:modelValue", v);
      };
      merged.onOpen = () => EVENT_LOG.push("open");
      merged.onClose = () => EVENT_LOG.push("close");
      merged.onClosed = () => EVENT_LOG.push("closed");
      EVENT_LOG.push(`render modelValue:${props.modelValue}`);
      return h(realReDialog as any, merged, {
        default: attrs.slots?.default,
        footer: attrs.slots?.footer,
      });
    };
  },
});

async function cycle(wrapper: any, events: string[]): Promise<void> {
  await wrapper.find("#open").trigger("click");
  for (let i = 0; i < 12; i++) await nextTick();
  events.push("--- open done ---");
  await wrapper.find("#close").trigger("click");
  for (let i = 0; i < 12; i++) await nextTick();
  events.push("--- close done ---");
}

/** 最简 ReDialog：挂靠 module 级 event 数组 */
it("最简 ReDialog：open + close 完整事件序列", async () => {
  await import("./fixtures/reDialogMinimalEvents.vue").then(async (mod) => {
    Events.length = 0;
    OVERLAY_LOG.length = 0;
    const [disconnect, log] = watchOverlays();
    const wrapper = mount(mod.default, {
      global: { plugins: [elementPlus], components: globalComponents },
      attachTo: document.body,
    });
    await nextTick();
    await cycle(wrapper, EVENT_LOG);
    for (const e of Events) EVENT_LOG.push(`fixture:${e}`);
    console.log("events:\n" + EVENT_LOG.join("\n"));
    console.log("overlayLog:", log(), "overlays:", document.querySelectorAll(".el-overlay-dialog").length);
    disconnect();
    wrapper.unmount();
  });
  expect(OVERLAY_LOG.filter((x) => x === "ADD").length).toBe(1);
}, 60000);

/** 新增主机弹窗（ReDialog 上挂日志型包装） */
it("HostFormDialog：open + close 完整事件序列", async () => {
  const Hfd = (await import("../views/HostFormDialog.vue")).default;
  OVERLAY_LOG.length = 0;
  EVENT_LOG.length = 0;
  const [disconnect, log] = watchOverlays();
  const wrapper = mount(
    {
      components: { HostFormDialog: Hfd },
      template: `<div id="root">
        <button id="open" @click="visible = true">新增主机</button>
        <button id="close" @click="visible = false">关闭</button>
        <HostFormDialog v-model="visible" :is-edit="false" :host="null" :identity-options="[]" :group-options="[]" />
      </div>`,
      setup() {
        return { visible: ref(false) };
      },
    },
    {
      global: { plugins: [elementPlus], components: { ...globalComponents, HostFormDialog: Hfd, "ReDialog": SpyReDialog } },
      attachTo: document.body,
    },
  );
  await nextTick();
  await cycle(wrapper, EVENT_LOG);
  console.log("events:\n" + EVENT_LOG.join("\n"));
  console.log("overlayLog:", log(), "overlays:", document.querySelectorAll(".el-overlay-dialog").length);
  disconnect();
  wrapper.unmount();
  expect(OVERLAY_LOG.filter((x) => x === "ADD").length).toBe(1);
}, 60000);
