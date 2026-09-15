/**
 * 用户管理页面（UserManage.vue）扩展功能测试
 *
 * 覆盖：
 *  1. 批量操作按钮：选中行后批量启用/禁用/删除按钮可用
 *  2. 详情抽屉：点击用户名打开抽屉，展示基本信息与安全信息
 *  3. 操作列“更多”下拉：包含 编辑/重置密码/分配角色/详情/删除 等
 *  4. 锁定状态展示：锁定用户显示“已锁定”标签
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

const ep = vi.hoisted(() => ({
  msg: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  box: { confirm: vi.fn().mockResolvedValue("confirm"), prompt: vi.fn().mockResolvedValue({ action: "confirm" }) },
}));

const api = vi.hoisted(() => ({
  pageForUser: vi.fn(),
  saveUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  deleteUsers: vi.fn(),
  updateUsersStatus: vi.fn(),
  resetUserPassword: vi.fn(),
  listForRole: vi.fn(),
  listForPost: vi.fn(),
  listDept: vi.fn(),
  lockUser: vi.fn(),
  unbindTotp: vi.fn(),
}));

vi.mock("element-plus", () => ({ ElMessage: ep.msg, ElMessageBox: ep.box }));
vi.mock("@element-plus/icons-vue", () => {
  const stub = { name: "IconStub", template: "<i />" };
  return new Proxy({} as Record<string, unknown>, { get: () => stub, has: () => true });
});
vi.mock("../api/systemApi", () => api);
vi.mock("@repo/pinia/modules/user", () => ({
  default: () => ({ loginName: "admin", username: "admin", userInfo: {} }),
}));

import UserManage from "../views/UserManage.vue";
import {
  makeReTableStub,
  ReSearchStub,
  ReButtonStub,
  ReInputStub,
  ReSelectStub,
  ReSwitchStub,
  ReTagStub,
  ReDialogStub,
  ReDrawerStub,
  elementPlusLayoutStubs,
  settle,
} from "./helpers";

const rows = [
  {
    sysUserId: 1,
    sysUserUsername: "alice",
    sysUserNickname: "爱丽丝",
    sysUserStatus: 0,
    sysUserLock: 0,
    userRoles: [{ sysRoleId: 1, sysRoleName: "管理员", sysRoleCode: "ADMIN" }],
    userPosts: [],
  },
  {
    sysUserId: 2,
    sysUserUsername: "bob",
    sysUserNickname: "鲍勃",
    sysUserStatus: 0,
    sysUserLock: 1,
    userRoles: [],
    userPosts: [],
  },
];

const pageFixture = { data: { total: 2, data: rows } };

function mountPage() {
  return mount(UserManage, {
    global: {
      stubs: {
        ReTable: makeReTableStub(["username", "roles", "status", "totp", "action"]),
        ReSearch: ReSearchStub,
        ReButton: ReButtonStub,
        ReInput: ReInputStub,
        ReSelect: ReSelectStub,
        ReSwitch: ReSwitchStub,
        ReTag: ReTagStub,
        ReDialog: ReDialogStub,
        ReDrawer: ReDrawerStub,
        ...elementPlusLayoutStubs(),
      },
    },
  });
}

describe("UserManage 用户管理页面（扩展）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.pageForUser.mockResolvedValue(pageFixture);
    api.listForRole.mockResolvedValue({ data: [] });
    api.listForPost.mockResolvedValue({ data: [] });
    api.listDept.mockResolvedValue({ data: [] });
    api.updateUsersStatus.mockResolvedValue({ data: 2 });
    api.deleteUsers.mockResolvedValue({ data: 2 });
    api.lockUser.mockResolvedValue({ data: true });
  });

  it("disables batch buttons until rows are selected", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    const enableBtn = wrapper.findAll("button").find((b) => b.text().includes("批量启用"))!;
    expect(enableBtn.attributes("disabled")).toBeDefined();

    // 选中一行后批量按钮可用
    const vm = wrapper.vm as unknown as { selectedRows: unknown[] };
    vm.selectedRows = [rows[0]];
    await wrapper.vm.$nextTick();
    expect((wrapper.findAll("button").find((b) => b.text().includes("批量启用"))!.attributes("disabled"))).toBeUndefined();
  });

  it("confirms then batch-enables selected users", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    (wrapper.vm as unknown as { selectedRows: unknown[] }).selectedRows = [rows[0], rows[1]];
    await wrapper.vm.$nextTick();

    const enableBtn = wrapper.findAll("button").find((b) => b.text().includes("批量启用"))!;
    await enableBtn.trigger("click");
    await settle(wrapper);

    expect(ep.box.confirm).toHaveBeenCalled();
    expect(api.updateUsersStatus).toHaveBeenCalledWith([1, 2], 0);
    expect(ep.msg.success).toHaveBeenCalledWith("已批量启用");
  });

  it("opens detail drawer with basic & security sections", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    expect(wrapper.find(".re-drawer-stub").exists()).toBe(false);

    // 点击用户名（username 插槽中的 span）
    const nameLink = wrapper.find(".re-row .re-tag-stub") ? wrapper.findAll(".re-row span").find((s) => s.text().includes("alice")) : undefined;
    expect(nameLink).toBeTruthy();
    await nameLink!.trigger("click");
    await settle(wrapper);

    const drawer = wrapper.find(".re-drawer-stub");
    expect(drawer.exists()).toBe(true);
    expect(drawer.text()).toContain("基本信息");
    expect(drawer.text()).toContain("安全信息");
  });

  it("more dropdown contains edit/reset-password/assign-role/detail/delete", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    const items = wrapper.findAll(".dropdown-item").map((d) => d.text());
    expect(items).toContain("编辑");
    expect(items).toContain("重置密码");
    expect(items).toContain("分配角色");
    expect(items).toContain("详情");
    expect(items).toContain("删除");
  });

  it("shows '已锁定' tag for locked users", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    // bob(sysUserLock=1) 行的状态插槽渲染“已锁定”
    expect(wrapper.text()).toContain("已锁定");
  });
});
