import { describe, expect, it, beforeAll } from "vitest";
import { mount } from "@vue/test-utils";
import { createApp, nextTick } from "vue";
import elementPlus from "element-plus";
import { installUi } from "@repo/ui";
import Minimal from "./fixtures/reDialogMinimal.vue";

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

let globalComponents: Record<string, unknown> = {};

beforeAll(async () => {
  const app = createApp({ template: "<div/>" });
  await installUi(app, { components: [...RE_COMPONENTS] });
  globalComponents = Object.fromEntries(RE_COMPONENTS.map(name => [name, app.component(name)]));
});

async function openDialog(wrapper: ReturnType<typeof mount<any>>): Promise<void> {
  wrapper.find("#open").trigger("click");
  await nextTick();
  await nextTick();
  await nextTick();
}

describe("debug", () => {
  it("debug", async () => {
    document.body.innerHTML = "";
    const wrapper = mount(Minimal, { global: { plugins: [elementPlus], components: globalComponents } });
    await openDialog(wrapper);
    console.log("body:", document.body.innerHTML.slice(0, 3000));
    console.log("vm events:", (wrapper.vm as any).events, `visible=${(wrapper.vm as any).visible}`);
    await nextTick();
    console.log("body after:", document.body.innerHTML.slice(0, 3000));
    await wrapper.vm.$nextTick();
    console.log("body final:", document.body.innerHTML.slice(0, 3000));
    expect(true).toBe(true);
  }, 30000);
});
