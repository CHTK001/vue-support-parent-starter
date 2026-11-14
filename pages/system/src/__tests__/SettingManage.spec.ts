/**
 * 系统设置页面（SettingManage.vue）扩展功能测试
 *
 * 覆盖：
 *  1. 历史抽屉：点击“历史”打开抽屉并展示历史列表
 *  2. 单条回滚：触发确认后调用单条回滚接口
 *  3. 敏感配置掩码：敏感值显示为掩码，点击显示按钮调用解密接口
 *  4. 批次查看：输入批次号查询该批次全部历史
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

const ep = vi.hoisted(() => {
  // @repo/core 的 msg.ts 用的是 Element Plus 的**函数式** API：
  //   ElMessage.closeAll();
  //   ElMessage({ message, plain, duration, type, ... });
  // 所以替身必须「本身可调用、且带 closeAll」，不能是一个按类型分方法的对象。
  // 之前给的是 { success, error, warning, info }，页面里 message.success(...) 一进去
  // 就抛 TypeError（既没有 closeAll，也不可调用），断言里的 spy 自然一次都没被调用。
  const msg = vi.fn();
  msg.closeAll = vi.fn();
  const notify = vi.fn();
  notify.closeAll = vi.fn();
  return {
    msg,
    notify,
    box: { confirm: vi.fn().mockResolvedValue("confirm"), close: vi.fn() },
  };
});

const api = vi.hoisted(() => ({
  pageForSetting: vi.fn(),
  saveSetting: vi.fn(),
  updateSetting: vi.fn(),
  deleteSetting: vi.fn(),
  updateBatchSetting: vi.fn(),
  pageForSettingHistory: vi.fn(),
  rollbackSettingHistorySingle: vi.fn(),
  rollbackSettingHistoryBatch: vi.fn(),
  listSettingHistoryByBatch: vi.fn(),
  decryptSettingValue: vi.fn(),
  exportSetting: vi.fn(),
}));

vi.mock("element-plus", () => ({ ElMessage: ep.msg, ElMessageBox: ep.box, ElNotification: ep.notify }));
vi.mock("@element-plus/icons-vue", () => {
  const stub = { name: "IconStub", template: "<i />" };
  return new Proxy({} as Record<string, unknown>, { get: () => stub, has: () => true });
});
vi.mock("../api/systemApi", () => api);

import SettingManage from "../views/SettingManage.vue";
import {
  makeReTableStub,
  ReSearchStub,
  ReButtonStub,
  ReInputStub,
  ReSelectStub,
  ReInputNumberStub,
  ReSwitchStub,
  ReTagStub,
  ReDialogStub,
  ReDrawerStub,
  elementPlusLayoutStubs,
  settle,
} from "./helpers";

const pageFixture = {
  data: {
    total: 2,
    data: [
      {
        sysSettingId: 1,
        sysSettingName: "站点标题",
        sysSettingCode: "site.title",
        sysSettingValueType: "STRING",
        sysSettingValue: "管理后台",
        sysSettingIsSensitive: 0,
      },
      {
        sysSettingId: 2,
        sysSettingName: "数据库密码",
        sysSettingCode: "db.password",
        sysSettingValueType: "STRING",
        sysSettingValue: "p@ss",
        sysSettingIsSensitive: 1,
      },
    ],
  },
};

const historyFixture = {
  data: {
    total: 1,
    data: [
      {
        sysSettingHistoryId: 7,
        sysSettingName: "站点标题",
        sysSettingOldValue: "旧",
        sysSettingNewValue: "新",
        sysSettingOperation: "UPDATE",
        sysSettingBatchNo: "B20260101",
        createTime: "2026-01-01 10:00:00",
      },
    ],
  },
};

function mountPage() {
  return mount(SettingManage, {
    global: {
      stubs: {
        ReTable: makeReTableStub(["info", "value", "action"]),
        ReSearch: ReSearchStub,
        ReButton: ReButtonStub,
        ReInput: ReInputStub,
        ReSelect: ReSelectStub,
        ReInputNumber: ReInputNumberStub,
        ReSwitch: ReSwitchStub,
        ReTag: ReTagStub,
        ReDialog: ReDialogStub,
        ReDrawer: ReDrawerStub,
        ...elementPlusLayoutStubs(),
      },
    },
  });
}

/** 左栏先行：挂载后点第一个分组，进入该组清单 */
async function enterGroup(wrapper: ReturnType<typeof mountPage>) {
  await settle(wrapper);
  await wrapper.find(".group-nav__item").trigger("click");
  await settle(wrapper);
}

describe("SettingManage 系统设置页面（扩展）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.pageForSetting.mockResolvedValue(pageFixture);
    api.pageForSettingHistory.mockResolvedValue(historyFixture);
    api.rollbackSettingHistorySingle.mockResolvedValue({ data: true });
    api.rollbackSettingHistoryBatch.mockResolvedValue({ data: true });
    api.listSettingHistoryByBatch.mockResolvedValue({ data: [] });
    api.decryptSettingValue.mockResolvedValue({ data: "plain-secret" });
    api.updateSetting.mockResolvedValue({ data: true });
  });

  it("opens history drawer when '历史' clicked", async () => {
    const wrapper = mountPage();
    await enterGroup(wrapper);
    expect(wrapper.findAll(".re-drawer-stub").length).toBe(0);

    const row = wrapper.findAll(".re-row").find((r) => r.text().includes("site.title"))!;
    const histBtn = row.findAll("button").find((b) => b.attributes("data-icon") === "Clock")!;
    await histBtn.trigger("click");
    await settle(wrapper);

    expect(api.pageForSettingHistory).toHaveBeenCalled();
    const drawer = wrapper.findAll(".re-drawer-stub").find((d) => d.text().includes("配置编码"));
    expect(drawer).toBeTruthy();
  });

  it("rolls back a single history record after confirm", async () => {
    const wrapper = mountPage();
    await settle(wrapper);

    const vm = wrapper.vm as unknown as {
      handleRollbackSingle: (r: Record<string, unknown>) => Promise<void>;
    };
    await vm.handleRollbackSingle({
      sysSettingHistoryId: 7,
      sysSettingName: "站点标题",
      createTime: "2026-01-01 10:00:00",
    });
    await settle(wrapper);

    expect(ep.box.confirm).toHaveBeenCalled();
    expect(api.rollbackSettingHistorySingle).toHaveBeenCalledWith(7);
    expect(ep.msg).toHaveBeenCalledWith(expect.objectContaining({ message: "回滚成功", type: "success" }));
  });

  it("masks sensitive value and calls decrypt on reveal", async () => {
    const wrapper = mountPage();
    await enterGroup(wrapper);

    // 掩码渲染
    expect(wrapper.text()).toContain("••••••••");

    const sensitiveRow = wrapper.findAll(".re-row").find((r) => r.text().includes("db.password"))!;
    // 预览/编辑列的显示按钮是无文本的图标按钮（区别于操作列：可按 data-icon 排除）
    const reveal = sensitiveRow
      .findAll("button")
      .find((b) => b.text().trim().length === 0 && !b.attributes("data-icon"));
    expect(reveal).toBeTruthy();
    await reveal!.trigger("click");
    await settle(wrapper);

    expect(api.decryptSettingValue).toHaveBeenCalledWith(2);
  });

  it("queries history by batch number", async () => {
    const wrapper = mountPage();
    await settle(wrapper);

    const vm = wrapper.vm as unknown as {
      batchNoInput: string;
      handleViewBatch: () => Promise<void>;
    };
    vm.batchNoInput = "B20260101";
    await vm.handleViewBatch();
    await settle(wrapper);

    expect(api.listSettingHistoryByBatch).toHaveBeenCalledWith("B20260101");
  });
});
