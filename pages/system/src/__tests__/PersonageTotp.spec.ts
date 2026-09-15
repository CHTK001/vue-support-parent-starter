/**
 * 个人中心 2FA/TOTP 绑定流程测试（Personage.vue 中的账号安全卡片）
 *
 * 覆盖：
 *  1. 2FA 状态卡片：未绑定时显示“未启用”+开启按钮；已绑定时显示“已启用”+关闭按钮
 *  2. 绑定流程：点击开启调用生成二维码接口，弹窗展示二维码+验证码输入
 *  3. 验证绑定：输入验证码调用绑定接口，成功后关闭弹窗并刷新状态
 *  4. 解绑流程：点击关闭触发确认，调用解绑接口
 *
 * 说明：Personage.vue 依赖大量 @repo/* 运行时（store/config/主题组件），
 * 这些在本测试中全部 mock，只验证 2FA 卡片与绑定/解绑交互。
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { mount } from "@vue/test-utils";

const ep = vi.hoisted(() => ({
  msg: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  box: { confirm: vi.fn().mockResolvedValue("confirm") },
}));

const api = vi.hoisted(() => ({
  listOnline: vi.fn().mockResolvedValue({ data: [] }),
  kickUser: vi.fn(),
  updateUser: vi.fn(),
  updateOwner: vi.fn(),
  getTotpStatus: vi.fn(),
  generateTotpQrcode: vi.fn(),
  bindTotp: vi.fn(),
  unbindTotp: vi.fn(),
}));

vi.mock("element-plus", () => ({ ElMessage: ep.msg, ElMessageBox: ep.box }));
vi.mock("@element-plus/icons-vue", () => {
  const stub = { name: "IconStub", template: "<i />" };
  return new Proxy({} as Record<string, unknown>, { get: () => stub, has: () => true });
});
vi.mock("../api/systemApi", () => api);

vi.mock("@repo/pinia/modules/user", () => ({
  default: () => ({ loginName: "admin", username: "admin", userInfo: { nickname: "" } }),
}));
vi.mock("@repo/pinia/modules/auth", () => ({
  default: () => ({ loginUser: {}, getLoginUserInfo: vi.fn().mockResolvedValue({}) }),
}));
vi.mock("@repo/utils", () => ({
  setUserInfo: vi.fn(),
  resolveUserDisplayInfo: vi.fn().mockReturnValue({
    userId: 1,
    nickname: "管理员",
    username: "admin",
    phone: "-",
    email: "-",
    sex: 0,
    avatar: "",
    roles: [],
  }),
}));
vi.mock("@repo/config", () => ({ getConfig: vi.fn().mockReturnValue({ other: {} }) }));
vi.mock("@repo/theme/koi/components/avatarFrames", () => ({
  BIRTHDAY_FRAME_ID: "birthday",
  getAvatarFrameImage: vi.fn().mockReturnValue(""),
}));
vi.mock("@repo/theme/koi/components/AvatarFramePanel.vue", () => ({
  default: { template: "<div />" },
}));
vi.mock("@repo/ui/re-tab", () => ({
  default: {
    name: "ReTab",
    props: ["tabs", "modelValue", "variant"],
    emits: ["update:modelValue"],
    // 测试中直接渲染所有插槽，安全卡片始终可见
    template:
      "<div class='re-tab-stub'><slot name='frame' /><slot name='pwd' /><slot name='security' /><slot name='lock' /><slot name='devices' /></div>",
  },
}));
vi.mock("@repo/ui/re-form", () => ({
  default: { props: ["modelValue", "fields", "labelWidth"], template: "<form><slot /><slot name='actions' /></form>" },
}));
vi.mock("@repo/ui/re-input", () => ({
  default: {
    props: ["modelValue", "placeholder", "maxlength", "layout", "type"],
    emits: ["update:modelValue"],
    template:
      "<input class='repo-input' :value='modelValue' @input=\"$emit('update:modelValue', $event.target.value)\" />",
  },
}));

import Personage from "../views/Personage.vue";
import {
  ReButtonStub,
  ReTagStub,
  ReDialogStub,
  elementPlusLayoutStubs,
  settle,
} from "./helpers";

beforeAll(() => {
  // jsdom 未实现 URL.createObjectURL，2FA 绑定二维码流程需要
  (URL as unknown as Record<string, unknown>).createObjectURL = vi.fn().mockReturnValue("blob:totp");
  (URL as unknown as Record<string, unknown>).revokeObjectURL = vi.fn();
});

function mountPage() {
  return mount(Personage, {
    global: {
      stubs: {
        ReButton: ReButtonStub,
        ReTag: ReTagStub,
        ReDialog: ReDialogStub,
        ...elementPlusLayoutStubs(),
      },
    },
  });
}

describe("Personage 2FA/TOTP 绑定流程", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTotpStatus.mockResolvedValue({ data: { enabled: false } });
    api.generateTotpQrcode.mockResolvedValue(new Blob(["qr"], { type: "image/png" }));
    api.bindTotp.mockResolvedValue({ data: true });
    api.unbindTotp.mockResolvedValue({ data: true });
  });

  it("shows unbound state with '未启用' and enable button", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    expect(wrapper.text()).toContain("二次验证（2FA）");
    expect(wrapper.text()).toContain("未启用");
    const enableBtn = wrapper.findAll("button").find((b) => b.text().trim() === "开启");
    expect(enableBtn).toBeTruthy();
  });

  it("shows bound state with '已启用' and disable button", async () => {
    api.getTotpStatus.mockResolvedValue({ data: { enabled: true } });
    const wrapper = mountPage();
    await settle(wrapper);

    // 切到“账号安全”触发 loadTotpStatus
    (wrapper.vm as unknown as { activeTab: string }).activeTab = "security";
    await settle(wrapper);

    expect(api.getTotpStatus).toHaveBeenCalled();
    expect(wrapper.text()).toContain("已启用");
    const disableBtn = wrapper.findAll("button").find((b) => b.text().trim() === "关闭");
    expect(disableBtn).toBeTruthy();
  });

  it("opens bind dialog and fetches qrcode on enable", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    expect(wrapper.find(".re-dialog-stub").exists()).toBe(false);

    const enableBtn = wrapper.findAll("button").find((b) => b.text().trim() === "开启")!;
    await enableBtn.trigger("click");
    await settle(wrapper);

    expect(api.generateTotpQrcode).toHaveBeenCalled();
    const dialog = wrapper.find(".re-dialog-stub");
    expect(dialog.exists()).toBe(true);
    expect(dialog.find("img").exists()).toBe(true);
    expect(dialog.find("input").exists()).toBe(true);
  });

  it("binds totp when a 6-digit code is confirmed", async () => {
    const wrapper = mountPage();
    await settle(wrapper);

    const enableBtn = wrapper.findAll("button").find((b) => b.text().trim() === "开启")!;
    await enableBtn.trigger("click");
    await settle(wrapper);

    // 输入 6 位验证码并确认绑定
    (wrapper.vm as unknown as { totpCode: string }).totpCode = "123456";
    await wrapper.vm.$nextTick();
    await wrapper.find(".dialog-ok").trigger("click");
    await settle(wrapper);

    expect(api.bindTotp).toHaveBeenCalledWith("123456");
    expect(ep.msg.success).toHaveBeenCalledWith("2FA 已启用");
  });

  it("disables totp after confirm", async () => {
    api.getTotpStatus.mockResolvedValue({ data: { enabled: true } });
    const wrapper = mountPage();
    await settle(wrapper);
    (wrapper.vm as unknown as { activeTab: string }).activeTab = "security";
    await settle(wrapper);

    const disableBtn = wrapper.findAll("button").find((b) => b.text().trim() === "关闭")!;
    await disableBtn.trigger("click");
    await settle(wrapper);

    expect(ep.box.confirm).toHaveBeenCalled();
    expect(api.unbindTotp).toHaveBeenCalled();
    expect(ep.msg.success).toHaveBeenCalledWith("2FA 已关闭");
  });
});
