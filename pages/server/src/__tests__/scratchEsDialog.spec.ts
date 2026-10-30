/**
 * scratch：element-plus <el-dialog> 的开/关事件链在 jsdom 下是否完整（排查 jsdom 副作用）
 */
import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createApp, nextTick, ref } from "vue";
import elementPlus from "element-plus";
import { ElDialog } from "element-plus";

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

describe("scratch：el-dialog 原生事件链", () => {
  it("el-dialog v-model 打开/关闭", async () => {
    const events: string[] = [];
    const wrapper = mount(
      {
        components: { ElDialog },
        template: `<div id="root">
          <button id="open" @click="visible = true">开</button>
          <button id="close" @click="visible = false">关</button>
          <el-dialog v-model="visible" title="弹窗" :modal="true" :close-on-click-modal="false" append-to-body
            @open="events.push('open')" @close="events.push('close')" @closed="events.push('closed')"
            @after-enter="events.push('afterEnter')" @after-leave="events.push('afterLeave')"
            @update:modelValue="(v) => events.push('update:' + v)">
            <div v-show="visible">内容</div>
          </el-dialog>
        </div>`,
        setup() {
          const visible = ref(false);
          return { visible, events };
        },
      },
      { global: { plugins: [elementPlus] }, attachTo: document.body },
    );
    await nextTick();
    wrapper.find("#open").trigger("click");
    for (let i = 0; i < 12; i++) await nextTick();
    events.push("--- open done ---");
    wrapper.find("#close").trigger("click");
    for (let i = 0; i < 12; i++) await nextTick();
    events.push("--- close done ---");
    console.log("events:", events.join(" | "));
    console.log("overlays:", document.querySelectorAll(".el-overlay-dialog").length);
    wrapper.unmount();
  }, 60000);
});
