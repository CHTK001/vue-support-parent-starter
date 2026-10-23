/**
 * 消息管理页面（MessageManage.vue）组件测试
 *
 * 覆盖：
 *  1. Tab 懒加载：消息列表先加载，模板表格在切换到模板 Tab 后加载
 *  2. 发送消息弹窗：点击消息工具栏的新增图标打开弹窗；选择模板后自动填充标题与内容
 *  3. 撤回消息：点击撤回触发确认弹窗，确认后调用撤回接口
 *  4. 广播消息：接收者 ID 为 0 时展示“全体用户”
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

const ep = vi.hoisted(() => {
  // @repo/core 的 msg.ts 用的是 Element Plus 的**函数式** API：
  //   ElMessage.closeAll();
  //   ElMessage({ message, plain, duration, type, ... });
  // 所以替身必须「本身可调用、且带 closeAll」，不能是一个按类型分方法的对象。
  // 之前给的是 { success, error, warning, info }，页面里 message.warning(...) 一进去
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
  pageForMessageAdmin: vi.fn(),
  sendMessage: vi.fn(),
  recallMessage: vi.fn(),
  deleteMessage: vi.fn(),
  pageForMessageTemplate: vi.fn(),
  listForMessageTemplate: vi.fn(),
  saveMessageTemplate: vi.fn(),
  updateMessageTemplate: vi.fn(),
  deleteMessageTemplate: vi.fn(),
  previewMessageTemplate: vi.fn(),
  sendMessageByCode: vi.fn(),
  pageForMessageLog: vi.fn(),
  cleanMessageLog: vi.fn(),
  listForRole: vi.fn(),
}));

/**
 * ReTab 桩：本页用的是 nav-only 胶囊页签 —— 组件只渲染导航条，
 * 内容由页面按 activeTab 用 v-if 切换（没有具名插槽）。
 * 桩同样不渲染插槽，行为与真实组件一致。
 */
const ReTabStub = {
  name: "ReTab",
  props: ["tabs", "modelValue", "variant", "collapsed", "collapsible", "navOnly"],
  emits: ["update:modelValue", "tab-change"],
  methods: {
    selectTab(name: string) {
      this.$emit("update:modelValue", name);
      this.$emit("tab-change", name);
    },
  },
  template: `
    <div class="re-tab-stub">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        type="button"
        class="re-tab-stub__nav"
        :data-tab="tab.name"
        @click="selectTab(tab.name)"
      >{{ tab.label }}</button>
    </div>
  `,
};

vi.mock("element-plus", () => ({ ElMessage: ep.msg, ElMessageBox: ep.box, ElNotification: ep.notify }));
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
  ReSwitchStub,
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
        // 消息列表、模板和日志按激活 Tab 懒加载
        ReTab: ReTabStub,
        ReTable: makeReTableStub(["type", "level", "receiver", "mstatus", "tstatus", "action"]),
        ReSearch: ReSearchStub,
        ReButton: ReButtonStub,
        ReInput: ReInputStub,
        ReSelect: ReSelectStub,
        ReInputNumber: ReInputNumberStub,
        ReSwitch: ReSwitchStub,
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
    api.previewMessageTemplate.mockResolvedValue({ data: { content: "预览内容" } });
    api.sendMessageByCode.mockResolvedValue({ data: [] });
    api.pageForMessageLog.mockResolvedValue({ data: { total: 0, data: [] } });
    api.cleanMessageLog.mockResolvedValue({ data: 0 });
    api.listForRole.mockResolvedValue({ data: [] });
  });

  it("loads the template table only after its tab is activated", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    expect(api.pageForMessageAdmin).toHaveBeenCalled();
    expect(api.listForMessageTemplate).toHaveBeenCalled();
    expect(api.pageForMessageTemplate).not.toHaveBeenCalled();

    const templateTab = wrapper.find('[data-tab="template"]');
    expect(templateTab.exists()).toBe(true);
    await templateTab.trigger("click");
    await settle(wrapper);

    expect(api.pageForMessageTemplate).toHaveBeenCalled();
  });

  it("shows '全体用户' when receiver id is 0", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    // 第一行消息接收者为 0 -> 广播
    expect(wrapper.text()).toContain("全体用户");
  });

  it("opens the send-message dialog from the toolbar add button", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    expect(wrapper.find(".re-dialog-stub").exists()).toBe(false);

    const sendBtn = wrapper.find('.re-table__toolbar-left button[data-icon="Plus"]');
    expect(sendBtn.exists()).toBe(true);
    await sendBtn.trigger("click");
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
    expect(ep.msg).toHaveBeenCalledWith(expect.objectContaining({ message: "已撤回", type: "success" }));
  });
});
