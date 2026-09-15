/**
 * 异常日志监控页面（ErrorLogManage.vue）组件测试
 *
 * 覆盖：
 *  1. 统计卡片渲染：今日异常/未处理/已处理/处理率 4 个卡片
 *  2. 详情弹窗：点击“详情”打开弹窗，堆栈以 <pre> 格式化展示
 *  3. 标记已处理/忽略：调用状态更新接口，成功后提示
 *  4. 状态筛选：选择状态后查询接口带上 sysErrorStatus
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

const ep = vi.hoisted(() => ({
  msg: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  box: { confirm: vi.fn().mockResolvedValue("confirm") },
}));

const api = vi.hoisted(() => ({
  pageForErrorLog: vi.fn(),
  getErrorLogStatistic: vi.fn(),
  updateErrorLogStatus: vi.fn(),
  deleteErrorLog: vi.fn(),
}));

vi.mock("element-plus", () => ({ ElMessage: ep.msg, ElMessageBox: ep.box }));
vi.mock("@element-plus/icons-vue", () => {
  const stub = { name: "IconStub", template: "<i />" };
  // has:()=>true 保证 script 中具名 import（Warning/Clock 等）解析为 stub
  return new Proxy({} as Record<string, unknown>, { get: () => stub, has: () => true });
});
vi.mock("../api/systemApi", () => api);

import ErrorLogManage from "../views/ErrorLogManage.vue";
import {
  makeReTableStub,
  ReSearchStub,
  ReButtonStub,
  ReInputStub,
  ReSelectStub,
  ReTagStub,
  ReDialogStub,
  elementPlusLayoutStubs,
  settle,
} from "./helpers";

const statFixture = {
  data: {
    total: 10,
    todayCount: 3,
    pendingCount: 4,
    handledCount: 5,
    ignoredCount: 1,
    handleRate: 83.3,
  },
};

const pageFixture = {
  data: {
    total: 1,
    data: [
      {
        sysErrorLogId: 9,
        sysErrorMessage: "boom",
        sysErrorSource: "js",
        sysErrorStatus: 0,
        sysErrorFilename: "app.js",
        sysErrorStack: "Error: boom\n  at handler (app.js:1:1)",
      },
    ],
  },
};

function mountPage() {
  return mount(ErrorLogManage, {
    global: {
      stubs: {
        ReTable: makeReTableStub(["source", "linecol", "firstAt", "status", "action"]),
        ReSearch: ReSearchStub,
        ReButton: ReButtonStub,
        ReInput: ReInputStub,
        ReSelect: ReSelectStub,
        ReTag: ReTagStub,
        ReDialog: ReDialogStub,
        ...elementPlusLayoutStubs(),
      },
    },
  });
}

describe("ErrorLogManage 异常日志监控页面", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.pageForErrorLog.mockResolvedValue(pageFixture);
    api.getErrorLogStatistic.mockResolvedValue(statFixture);
    api.updateErrorLogStatus.mockResolvedValue({ data: true });
    api.deleteErrorLog.mockResolvedValue({ data: true });
  });

  it("renders 4 statistic cards with numbers", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    expect(api.getErrorLogStatistic).toHaveBeenCalled();
    const text = wrapper.text();
    expect(text).toContain("今日异常");
    expect(text).toContain("未处理");
    expect(text).toContain("已处理");
    expect(text).toContain("处理率");
    // 数值
    expect(text).toContain("3");
    expect(text).toContain("4");
    expect(text).toContain("83.3%");
  });

  it("opens detail dialog and renders stack in <pre>", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    expect(wrapper.find(".re-dialog-stub").exists()).toBe(false);

    const detailBtn = wrapper.findAll(".re-row button").find((b) => b.text().includes("详情"));
    expect(detailBtn).toBeTruthy();
    await detailBtn!.trigger("click");
    await wrapper.vm.$nextTick();

    const dialog = wrapper.find(".re-dialog-stub");
    expect(dialog.exists()).toBe(true);
    expect(dialog.find("pre").exists()).toBe(true);
    expect(dialog.find("pre").text()).toContain("Error: boom");
  });

  it("marks handled via status update api", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    api.updateErrorLogStatus.mockClear();

    const btn = wrapper.findAll(".re-row button").find((b) => b.text().includes("标记已处理"));
    expect(btn).toBeTruthy();
    await btn!.trigger("click");
    await settle(wrapper);

    expect(api.updateErrorLogStatus).toHaveBeenCalledWith(9, 1);
    expect(ep.msg.success).toHaveBeenCalledWith("已标记为已处理");
  });

  it("passes sysErrorStatus to query when filter applied", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    api.pageForErrorLog.mockClear();

    // 模拟选择“已处理”状态
    const vm = wrapper.vm as unknown as { query: { sysErrorStatus?: number } };
    vm.query.sysErrorStatus = 1;
    await wrapper.vm.$nextTick();

    const queryBtn = wrapper.findAll("button").find((b) => b.text().includes("查询"))!;
    await queryBtn.trigger("click");
    await settle(wrapper);

    expect(api.pageForErrorLog).toHaveBeenCalledWith(
      expect.objectContaining({ sysErrorStatus: 1 }),
    );
  });
});
