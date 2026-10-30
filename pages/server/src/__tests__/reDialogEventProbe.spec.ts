/**
 * 新增主机弹窗（HostFormDialog）一次打开周期里的事件序列。
 *
 * 用户报告「新增主机 弹出的 ReDialog 闪动了两次」。已知一次弹窗创建在 DOM 上只
 * 贡献一次 `.el-overlay-dialog`（ADD），因此排查手段改为事件计量：
 *  - 父级 v-model（formVisible）被写了几次、每次 true 还是 false；
 *  - ReDialog 转发的 @open/@close/@closed/@update:modelValue 各几次。
 *
 * 排查手段：不改造宿主（HostFormDialog 不接收 ReDialog 的 open 事件），在测试层
 * 把 ReDialog 替换为一个只记日志的包装（SpyReDialog），同时保留 ReDialog 的全部
 * 插槽（HostFormDialog 的表单内容 + 底部）并统计 DOM 元素数量。
 *
 * @author CH
 * @since 4.0.0
 */
import { describe, expect, it, beforeAll, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createApp, defineComponent, h, nextTick, ref, watch } from "vue";
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

let realReDialog: unknown;
let globalComponents: Record<string, unknown> = {};

/**
 * ReDialog 包装：原样透传 props/插槽，拦截所有事件回调记日志。
 *
 * <p>这样 HostFormDialog 不需要改一行代码就能看到它使用的 ReDialog 的 open/close/closed
 * 和 update:modelValue 序列。</p>
 */
const SpyReDialog = defineComponent({
  name: "SpyReDialog",
  inheritAttrs: false,
  props: { modelValue: { type: Boolean, default: false } },
  setup(props, { attrs, emit }) {
    return () => {
      const merged = { ...attrs } as any;
      merged.modelValue = props.modelValue;
      merged.onUpdateModelValue = (v: boolean) => {
        EVENT_LOG.push(`[${new Date().toISOString().slice(-8, -3)}] update:modelValue:${v}`);
        emit("update:modelValue", v);
      };
      merged.onOpen = (ev?: Event) => EVENT_LOG.push(`[${new Date().toISOString().slice(-8, -3)}] open`);
      merged.onClose = (ev?: Event) => EVENT_LOG.push(`[${new Date().toISOString().slice(-8, -3)}] close`);
      merged.onClosed = (ev?: Event) => EVENT_LOG.push(`[${new Date().toISOString().slice(-8, -3)}] closed`);
      EVENT_LOG.push(`[${new Date().toISOString().slice(-8, -3)}] render modelValue:${props.modelValue}`);
      return h(realReDialog as any, merged, {
        default: attrs.slots?.default,
        footer: attrs.slots?.footer,
      });
    };
  },
});

/** 事件日志 */
const EVENT_LOG: string[] = [];
/** 弹窗 shell 在 body 里的创建/消失 */
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
  globalComponents = Object.fromEntries(
    RE_COMPONENTS.filter((n) => n !== "ReDialog").map((name) => [name, app.component(name)]),
  );
  globalComponents["SpyReDialog"] = SpyReDialog;
});

/** 启动弹窗壳的 MutationObserver，返回断连回调 */
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

/** 挂载宿主：一个持有 formVisible 的父级 + HostFormDialog + 日志型 ReDialog */
function mountHost(): ReturnType<typeof mount<any>> {
  return mount(
    {
      template: `<div id="root">
        <button id="open" @click="visible = true">新增主机</button>
        <button id="close" @click="visible = false">关闭</button>
        <HostFormDialog v-model="visible" :is-edit="false" :host="null" :identity-options="[]" :group-options="[]" />
      </div>`,
      setup() {
        const visible = ref(false);
        // 拦截父级 visible 的每一次写（Proxy 版，flush 同步）
        const observable = new Proxy(visible, {
          get: (target, prop, receiver) => Reflect.get(target, prop, receiver),
          set: (target, prop, value, receiver) => {
            if (prop === "value") {
              EVENT_LOG.push(`parent visible ${value}`);
              const stack = new Error().stack ?? "";
              EVENT_LOG.push(`parent visible ${value === true ? "TRUE" : "FALSE"} ${stack.split("\n").slice(1, 5).join(" | ")}`);
            }
            return Reflect.set(target, prop, value, receiver);
          },
        });
        return { visible: observable };
      },
    },
    {
      global: { plugins: [elementPlus], components: { ...globalComponents, HostFormDialog, "ReDialog": SpyReDialog } },
      attachTo: document.body,
    },
  ) as ReturnType<typeof mount<any>>;
}

describe("新增主机弹窗 事件周期", () => {
  it("打开 → 关闭（弹窗壳只创建一次 / 事件序列完整）", async () => {
    document.body.innerHTML = "";
    EVENT_LOG.length = 0;
    OVERLAY_LOG.length = 0;
    const [disconnect, log] = watchOverlays();
    let wrapper: ReturnType<typeof mount<any>> | null = null;
    try {
      wrapper = mountHost();
      await nextTick();
      await wrapper.find("#open").trigger("click");
      for (let i = 0; i < 12; i++) await nextTick();
      console.log("EVENT_LOG:\n" + EVENT_LOG.slice(0, 40).join("\n"));
      console.log("overlayLog:", log(), "current overlays:", document.querySelectorAll(".el-overlay-dialog").length);
    } finally {
      if (wrapper) wrapper.unmount();
      disconnect();
    }
    expect(OVERLAY_LOG.filter((x) => x === "ADD").length).toBe(1);
  }, 60000);
});
