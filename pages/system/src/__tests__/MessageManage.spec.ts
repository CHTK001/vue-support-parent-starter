/**
 * 消息管理页面（MessageManage.vue）组件测试
 *
 * 覆盖：
 *  1. 双 Tab 渲染：消息列表 / 消息模板 两个 Tab 各自的表格加载
 *  2. 发送消息弹窗：点击“发送消息”打开弹窗；选择模板后自动填充标题与内容
 *  3. 撤回消息：点击撤回触发确认弹窗，确认后调用撤回接口
 *  4. 广播消息：接收者 ID 为 0 时展示“全体用户”
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

const ep = vi.hoisted(() => ({
  msg: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  box: { confirm: vi.fn().mockResolvedValue("confirm") },
}));

const api = vi.hoisted(() => ({
  pageForMessageAdmin: vi.fn(),
  sendMessage: vi.fn(),
  recallMessage: vi.fn(),
  deleteMessage: vi.fn(),
  pageForMessageTemplate: vi.fn(),
  listForMessageTemplate: vi.fn(),
  saveMessageTemplate: vi.fn(),
  updateMessageTemplate: vi.fn(),
  deleteMessageTemplate: vi.fn(),
}));

vi.mock("element-plus", () => ({ ElMessage: ep.msg, ElMessageBox: ep.box }));
vi.mock("@element-plus/icons-vue", () => {
  const stub = { name: "IconStub", template: "<i />" };
  return new Proxy({} as Record<string, unknown>, { get: () => stub });
});
vi.mock("../api/systemApi", () => api);

import MessageManage from "../views/MessageManage.vue";
import {
  makeReTableStub,
  ReSearchStub,
  ReButtonStub,
  ReInputStub,
  ReSelectStub,
  ReInputNumberStub,
  ReTagStub,
  ReDialogStub,
  elementPlusLayoutStubs,
  settle,
} from "./helpers";

const msgFixture = {
  data: {
    total: 1,
    data: [
      {
        sysMessageId: 1,
        sysMessageTitle: "系统升级公告",
        sysMessageType: "system",
        sysMessageLevel: "normal",
        sysMessageReceiverId: 0,
        sysMessageReceiverName: "",
        sysMessageStatus: 1,
      },
    ],
  },
};

const tplFixture = {
  data: {
    total: 1,
    data: [
      { sysMessageTemplateId: 1, sysMessageTemplateName: "欢迎模板", sysMessageTemplateCode: "WELCOME", sysMessageTemplateStatus: 1 },
    ],
  },
};

const templateList = {
  data: [
    { sysMessageTemplateName: "欢迎模板", sysMessageTemplateCode: "WELCOME", sysMessageTemplateTitle: "欢迎使用", sysMessageTemplateContent: "欢迎内容" },
  ],
};

function mountPage() {
  return mount(MessageManage, {
    global: {
      stubs: {
        // 两个表格：消息列表槽位 + 模板槽位
        ReTable: makeReTableStub(["type", "level", "receiver", "mstatus", "tstatus", "action"]),
        ReSearch: ReSearchStub,
        ReButton: ReButtonStub,
        ReInput: ReInputStub,
        ReSelect: ReSelectStub,
        ReInputNumber: ReInputNumberStub,
        ReTag: ReTagStub,
        ReDialog: ReDialogStub,
        ...elementPlusLayoutStubs(),
      },
    },
  });
}

describe("MessageManage 消息管理页面", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.pageForMessageAdmin.mockResolvedValue(msgFixture);
    api.pageForMessageTemplate.mockResolvedValue(tplFixture);
    api.listForMessageTemplate.mockResolvedValue(templateList);
    api.sendMessage.mockResolvedValue({ data: true });
    api.recallMessage.mockResolvedValue({ data: true });
    api.deleteMessage.mockResolvedValue({ data: true });
  });

  it("renders both message list and template tabs (both tables load)", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    // 消息列表表格与消息模板表格均在挂载时加载
    expect(api.pageForMessageAdmin).toHaveBeenCalled();
    expect(api.pageForMessageTemplate).toHaveBeenCalled();
    expect(api.listForMessageTemplate).toHaveBeenCalled();
  });

  it("shows '全体用户' when receiver id is 0", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    // 第一行消息接收者为 0 -> 广播
    expect(wrapper.text()).toContain("全体用户");
  });

  it("opens send-message dialog when '发送消息' clicked", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    expect(wrapper.find(".re-dialog-stub").exists()).toBe(false);

    const sendBtn = wrapper.findAll("button").find((b) => b.text().includes("发送消息"));
    expect(sendBtn).toBeTruthy();
    await sendBtn!.trigger("click");
    await wrapper.vm.$nextTick();

    const dialog = wrapper.find(".re-dialog-stub");
    expect(dialog.exists()).toBe(true);
    expect(dialog.text()).toContain("消息标题");
  });

  it("fills title/content when a template is selected", async () => {
    const wrapper = mountPage();
    await settle(wrapper);

    const vm = wrapper.vm as unknown as {
      templates: unknown[];
      onTemplateChange: (code?: string) => void;
      sendForm: Record<string, unknown>;
    };
    // 选择模板后自动填充
    vm.onTemplateChange("WELCOME");
    expect(vm.sendForm.sysMessageTitle).toBe("欢迎使用");
    expect(vm.sendForm.sysMessageContent).toBe("欢迎内容");
  });

  it("recalls a message after confirm", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    api.recallMessage.mockClear();

    const recallBtn = wrapper.findAll(".re-row button").find((b) => b.text().includes("撤回"));
    expect(recallBtn).toBeTruthy();
    await recallBtn!.trigger("click");
    await settle(wrapper);

    expect(ep.box.confirm).toHaveBeenCalled();
    expect(api.recallMessage).toHaveBeenCalledWith(1);
    expect(ep.msg.success).toHaveBeenCalledWith("已撤回");
  });
});
