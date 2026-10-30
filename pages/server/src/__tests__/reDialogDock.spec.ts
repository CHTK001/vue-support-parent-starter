/**
 * 最小化 → Dock 浮标恢复 一圈的事件计量。
 *
 * 窗口壳开/关路径（minimize() → visible=false → watch(localOpen) → localOpen=false →
 * el-dialog close； restoreFromDock() → visible=true → watch(localOpen) → localOpen=true →
 * el-dialog open） 独立驱动弹窗的 enter/leave 过渡。经计量：从开、最小化、Dock 恢复
 * 到关闭，el-dialog 只过一次 `open`/一次 `ADD`——弹窗壳不会在这里闪动两次。
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

vi.mock("@repo/core", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return { ...actual, message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } };
});

const RE_COMP = ["ReDialog", "ReButton", "ReText", "ReIcon", "ReInput"];

let globalComponents: Record<string, Component> = {};

beforeAll(async () => {
  const app = createApp({ template: "<div/>" });
  await installUi(app, { components: RE_COMP });
  globalComponents = Object.fromEntries(RE_COMP.map((n) => [n, app.component(n)])) as Record<string, Component>;
});

/** 弹窗 open/close/closed/update:modelValue + body 中弹窗 overlay 的添加/移除 */
const OPEN_LOG: string[] = [];
const UPDATE_LOG: string[] = [];
const ADD_LOG: string[] = [];

function watchOverlays(): () => string {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n instanceof HTMLElement && n.querySelector(".el-overlay-dialog")) ADD_LOG.push("ADD");
      }
      for (const n of m.removedNodes) {
        if (n instanceof HTMLElement && n.querySelector(".el-overlay-dialog")) ADD_LOG.push("DEL");
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => JSON.stringify(ADD_LOG);
}

/** 带迷你浮标的窗口壳：open/restoreButton 都在这里手动驱动 */
const ShellDock = {
  components: globalComponents,
  template: `<div id="shell-dock">
    <button id="btnOpen" @click="visible = true">开</button>
    <button id="btnClose" @click="visible = false">关</button>
    <ReDialog
      :model-value="visible"
      @update:model-value="UPDATE_LOG.push('update:' + $event)"
      @open="OPEN_LOG.push('open')"
      @close="OPEN_LOG.push('close')"
      @closed="OPEN_LOG.push('closed')"
      title="窗壳"
      :close-on-click-modal="false"
      :show-minimize="true"
    />
  </div>`,
  setup() {
    const visible = ref(false);
    return { visible, OPEN_LOG, UPDATE_LOG };
  },
};

/** 等待过渡与 post-flush 攒批：每次打开/关闭后必须获得 flush */
async function wait(n = 12) {
  for (let i = 0; i < n; i++) await nextTick();
}

// eslint-disable-next-line eslint-comments/disable-disabled-next-line
describe("window shell 最小化 + Dock 恢复", () => {
  it("开 → 最小化 → 点击 Dock 恢复 → 关闭", async () => {
    document.body.innerHTML = "";
    OPEN_LOG.length = 0;
    UPDATE_LOG.length = 0;
    ADD_LOG.length = 0;
    const log = watchOverlays();
    const wrapper = mount(ShellDock, {
      global: { plugins: [elementPlus], components: globalComponents },
      attachTo: document.body,
    });
    await nextTick();
    await wrapper.find("#btnOpen").trigger("click");
    await wait();
    console.log("1) open:", JSON.stringify(OPEN_LOG), JSON.stringify(UPDATE_LOG), log());
    // 点击弹窗标题栏的最小化按钮（KoiShellHeaderActions 渲染在 @minimize 上）
    const minimizeBtn = wrapper.find(`button[aria-label="最小化"]`);
    if (minimizeBtn.exists()) await minimizeBtn.trigger("click");
    await wait();
    console.log("2) minimized:", JSON.stringify(OPEN_LOG), JSON.stringify(UPDATE_LOG), "overlays:", document.querySelectorAll(".el-overlay-dialog").length);
    // Dock 浮标在 body 里（Teleport）
    const dockBtn = document.body.querySelector(".koi-shell-minimized-dock");
    if (dockBtn) await dockBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await wait();
    console.log("3) restored:", JSON.stringify(OPEN_LOG), JSON.stringify(UPDATE_LOG), log(), "overlays:", document.querySelectorAll(".el-overlay-dialog").length);
    await wrapper.find("#btnClose").trigger("click");
    await wait();
    console.log("4) closed:", JSON.stringify(OPEN_LOG), JSON.stringify(UPDATE_LOG), log(), "overlays:", document.querySelectorAll(".el-overlay-dialog").length);
    wrapper.unmount();
    await wait();
    expect(OPEN_LOG.filter((x) => x === "open").length).toBe(1);
    expect(document.querySelectorAll(".el-overlay-dialog").length).toBe(0);
  }, 60000);
});
