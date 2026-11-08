/**
 * WidgetLibrary（edit mode 右侧「系统组件」面板）渲染测试
 *
 * 注册表能存是一回事（systemWidgets.spec.ts 已断言），面板实际列出才是用户能看到的事。
 * 测试把昨天的两个路径钉死：
 *
 * 1. 面板的标题列表里出现「登录日志」与「个人设置」（type 注册进 registry 后，
 *    WidgetLibrary 默认用 `widgetCatalog.value` 打底分页）
 * 2. 点进去时 emit('add', type)，add(1) 必须作用到正确的 type，不是退化成 `custom` 占位
 * 3. 模块贡献的 widget 必须拿自己的 iconComponent（Document/User）而不是被内置 ICON_MAP
 *    回退成默认图标
 *
 * 运行：cd pages/system && pnpm test
 */
import { describe, it, expect, beforeAll } from "vitest";
import { mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { registerWidgets } from "@repo/theme/koi/views/home/registry.ts";
import "@repo/theme/koi/views/home/widgets.ts"; // 11 条内置 widget 自注册
import WidgetLibrary from "@repo/theme/koi/views/home/WidgetLibrary.vue";
import { systemWidgets } from "../widgets/systemWidgets";

describe("WidgetLibrary 面板", () => {
  beforeAll(() => {
    // 11 条内置 + 2 条 ` @pages/system` 贡献
    registerWidgets(systemWidgets);
  });

  it("系统组件面板列出登录日志 + 个人设置", async () => {
    const wrapper = mount(WidgetLibrary, {
      global: { plugins: [ElementPlus] },
    });

    expect(wrapper.find(".widget-library__title").text()).toBe("系统组件");

    const systemList = wrapper.findAll(".widget-library__item");
    expect(systemList).toHaveLength(13); // 11 builtin + 2

    const titles = systemList.map((i) => i.find(".widget-library__item-title").text());
    expect(titles).toContain("登录日志");
    expect(titles).toContain("个人设置");

    // 描述与注册项对齐
    const first = systemList.find((i) => i.text().includes("登录日志"));
    expect(first?.find(".widget-library__item-desc").text()).toBe(
      systemWidgets[0].description,
    );
  });

  it("点击面板项时 emit add，type 是 system-userlog / system-personal-settings", async () => {
    const wrapper = mount(WidgetLibrary, {
      global: { plugins: [ElementPlus] },
    });
    const systemList = wrapper.findAll(".widget-library__item");
    const log = systemList.find((i) => i.text().includes("登录日志"));
    const settings = systemList.find((i) => i.text().includes("个人设置"));

    if (!log || !settings) throw new Error("面板未列出两个 widget");

    await log.trigger("click");
    await settings.trigger("click");

    expect(wrapper.emitted("add")).toHaveLength(2);
    expect(wrapper.emitted("add")).toEqual([
      ["system-userlog"],
      ["system-personal-settings"],
    ]);
  });

  it("登录日志 / 个人设置的徽章走自己的 iconComponent（不是默认图标）", async () => {
    const wrapper = mount(WidgetLibrary, {
      global: { plugins: [ElementPlus] },
    });
    const systemList = wrapper.findAll(".widget-library__item");
    const log = systemList.find((i) => i.text().includes("登录日志"));
    const settings = systemList.find((i) => i.text().includes("个人设置"));

    if (!log || !settings) throw new Error("面板未列出两个 widget");

    // Document / User 组件内部一定是 svg：内置 ICON_MAP 没有这两个名字，
    // 若 resolveIcon 没拿到 iconComponent，el-icon 渲染的是 Symbol 内容，这里不骗自己
    const logIcon = log.find(".widget-library__icon");
    expect(logIcon.find("svg").exists()).toBe(true);
    const settingsIcon = settings.find(".widget-library__icon");
    expect(settingsIcon.find("svg").exists()).toBe(true);
  });
});
