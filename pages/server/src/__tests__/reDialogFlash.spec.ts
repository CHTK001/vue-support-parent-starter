/**
 * ReDialog（新主机的弹窗 ReDialog）闪动再现。
 *
 * <p>用户报告：「新增主机 弹出的 ReDialog 闪动了两次」。应用实际主题来自
 * {@code packages/config shared.ts} 默认值 {@code themeId: "koi"}，
 * koi 版 ReDialog 有 localOpen/visible 双向闭环。排查方向：是不是弹窗壳（el-dialog）
 * 在打开过程中被创建/销毁了两次，还是父页的 v-model 环路让弹窗关了一次又弹起来。</p>
 *
 * <p>不依赖浏览器：用 jsdom + 真实 ReDialog（koi 主题） + element-plus 挂载，
 * 统计弹窗 shell（`.el-overlay-dialog`）与 ReDialog 的事件（open/close/closed）次数。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { describe, expect, it, beforeAll } from "vitest";
import { mount } from "@vue/test-utils";
import { createApp, nextTick } from "vue";
import elementPlus from "element-plus";
import { installUi } from "@repo/ui";
import Minimal from "./fixtures/reDialogMinimal.vue";

/** HostFormDialog 模板里用到的全部 Re 控件（ReKit 把 ReFormItem/ReOption 等一起带上） */
const RE_COMPONENTS = [
  "ReButton",
  "ReForm",
  "ReInput",
  "ReInputNumber",
  "ReSelect",
  "ReSwitch",
  "ReText",
  "ReDialog",
  "ReKit",
];

/** 注册 Re 控件 + element-plus，返回以名字为 key 的注册表 */
let globalComponents: Record<string, unknown> = {};

beforeAll(async () => {
  const app = createApp({ template: "<div/>" });
  await installUi(app, { components: [...RE_COMPONENTS] });
  globalComponents = Object.fromEntries(RE_COMPONENTS.map(name => [name, app.component(name)]));
});

/** 打开弹窗并等 el-dialog 通过 Teleport 落进 body */
async function openDialog(wrapper: ReturnType<typeof mount<any>>): Promise<void> {
  wrapper.find("#open").trigger("click");
  await nextTick();
  await nextTick();
  await nextTick();
}

/** 统计 body 里当前有存在感的 .el-overlay-dialog 个数 */
function overlayDialogs(): number {
  return document.querySelectorAll(".el-overlay-dialog").length;
}

describe("新增主机弹窗 闪动", () => {
  it("最简外壳：一次打开、一次 open 事件", async () => {
    document.body.innerHTML = "";
    const wrapper = mount(Minimal, { global: { plugins: [elementPlus], components: globalComponents } });
    await openDialog(wrapper);
    console.log(`minimal: events=${JSON.stringify((wrapper.vm as any).events.value)} overlayDialogs=${overlayDialogs()}`);
    expect(overlayDialogs()).toBe(1);
  }, 30000);
});
