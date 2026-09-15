/**
 * 系统监控(JVM)页面组件测试
 *
 * - mock element-plus 的 ElMessage
 * - mock @element-plus/icons-vue
 * - mock getJvmInfo 返回固定 JVM 信息
 * - 用桩替换 el-progress/el-card/el-table 等重型组件
 * 验证：挂载即拉取 JVM 信息、统计卡片渲染、手动刷新再次调用 API、进度条渲染。
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

vi.mock("element-plus", () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock("@element-plus/icons-vue", () => {
  const stub = { name: "IconStub", template: "<i />" };
  return new Proxy({} as Record<string, unknown>, { get: () => stub });
});

const api = vi.hoisted(() => ({
  getJvmInfo: vi.fn(),
}));
vi.mock("../api/systemApi", () => api);

import MonitorManage from "../views/MonitorManage.vue";

const jvmFixture = {
  data: {
    systemInfo: { cpuUsage: 0.5, totalMemory: 2048, freeMemory: 1024 },
    heapMemory: { used: 50, max: 100 },
    nonHeapMemory: { used: 30, max: 100 },
    threadInfo: { threadCount: 42, peakThreadCount: 50, daemonThreadCount: 40, deadlockedThreadCount: 0 },
    garbageCollectors: [{ name: "G1 Young", collectionCount: 10, collectionTime: 100 }],
    memoryPools: [],
    jvmName: "TestJVM",
    uptime: 1000 * 60 * 60,
  },
};

function mountPage() {
  return mount(MonitorManage, {
    global: {
      stubs: {
        ReButton: { template: '<button type="button"><slot /></button>', props: ["loading", "icon"] },
        ElCard: { template: '<div class="el-card-stub"><slot /><slot name="header" /></div>' },
        ElProgress: { template: '<div class="el-progress-stub" />', props: ["percentage", "color", "type", "width", "strokeWidth"] },
        ElSwitch: { template: '<input type="checkbox" />', props: ["modelValue", "size"] },
        ElIcon: { template: '<i><slot /></i>' },
        ElEmpty: { template: "<span />" },
        ElTable: { template: "<div />", props: ["data", "size"] },
        ElTableColumn: { template: "<div />", props: ["prop", "label"] },
      },
    },
  });
}

describe("MonitorManage 系统监控页面", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getJvmInfo.mockResolvedValue(jvmFixture);
  });

  it("挂载时拉取 JVM 信息", async () => {
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    expect(api.getJvmInfo).toHaveBeenCalled();
  });

  it("渲染统计卡片：线程数与各进度条", async () => {
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    const text = wrapper.text();
    expect(text).toContain("42"); // 线程数
    expect(text).toContain("堆内存使用率");
    expect(text).toContain("非堆内存使用率");
    expect(text).toContain("CPU 使用率");
  });

  it("渲染 GC 信息", async () => {
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    expect(wrapper.text()).toContain("G1 Young");
  });

  it("手动刷新按钮再次调用 getJvmInfo", async () => {
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    const refreshBtn = wrapper.findAll("button").find((b) => b.text().includes("手动刷新"));
    expect(refreshBtn).toBeTruthy();
    await refreshBtn!.trigger("click");
    expect(api.getJvmInfo).toHaveBeenCalledTimes(2);
  });
});
