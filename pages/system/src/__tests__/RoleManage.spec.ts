/**
 * 角色管理页面（RoleManage.vue）扩展功能测试
 *
 * 覆盖：
 *  1. 只读角色开关：编辑弹窗中只读开关渲染，开启时显示提示文字
 *  2. 只读标签：只读角色在列表中显示“只读”标签
 *  3. 数据权限 Tab：权限弹窗中数据权限 5 种范围选项
 *  4. 内置角色保护：内置角色隐藏删除按钮
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

const ep = vi.hoisted(() => ({
  msg: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  box: { confirm: vi.fn().mockResolvedValue("confirm") },
}));

const api = vi.hoisted(() => ({
  pageForRole: vi.fn(),
  saveRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  getRoleMenu: vi.fn(),
  updateRoleMenu: vi.fn(),
  listMenuTree: vi.fn(),
  listDept: vi.fn(),
  pageForUser: vi.fn(),
}));

vi.mock("element-plus", () => ({
  ElMessage: ep.msg,
  ElMessageBox: ep.box,
  ElTree: {},
}));
vi.mock("@element-plus/icons-vue", () => {
  const stub = { name: "IconStub", template: "<i />" };
  return new Proxy({} as Record<string, unknown>, { get: () => stub, has: () => true });
});
vi.mock("../api/systemApi", () => api);
// ReIcon 是异步组件，测试中直接桩掉
vi.mock("@repo/ui/re-icon", () => ({ default: () => ({ template: "<i />" }) }));

import RoleManage from "../views/RoleManage.vue";
import {
  makeReTableStub,
  ReSearchStub,
  ReButtonStub,
  ReInputStub,
  ReSelectStub,
  ReInputNumberStub,
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
      { sysRoleId: 1, sysRoleName: "超级管理员", sysRoleCode: "SUPER", sysRoleStatus: 1, sysRoleInSystem: 1, sysRoleReadonly: 0 },
      { sysRoleId: 2, sysRoleName: "内容管理员", sysRoleCode: "CONTENT", sysRoleStatus: 1, sysRoleInSystem: 0, sysRoleReadonly: 1 },
    ],
  },
};

function mountPage() {
  return mount(RoleManage, {
    global: {
      stubs: {
        ReTable: makeReTableStub(["roleName", "status", "system", "action"]),
        ReSearch: ReSearchStub,
        ReButton: ReButtonStub,
        ReInput: ReInputStub,
        ReSelect: ReSelectStub,
        ReInputNumber: ReInputNumberStub,
        ReTag: ReTagStub,
        ReDialog: ReDialogStub,
        ReDrawer: ReDrawerStub,
        ...elementPlusLayoutStubs(),
      },
    },
  });
}

describe("RoleManage 角色管理页面（扩展）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.pageForRole.mockResolvedValue(pageFixture);
    api.saveRole.mockResolvedValue({ data: {} });
    api.updateRole.mockResolvedValue({ data: true });
    api.deleteRole.mockResolvedValue({ data: true });
    api.getRoleMenu.mockResolvedValue({ data: [] });
    api.updateRoleMenu.mockResolvedValue({ data: true });
    api.listMenuTree.mockResolvedValue({ data: [] });
    api.listDept.mockResolvedValue({ data: [] });
  });

  it("shows '只读' tag for readonly roles", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    expect(wrapper.text()).toContain("只读");
  });

  it("hides delete button for built-in (system) roles", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    // 内置角色行（超级管理员）不含“删除”按钮
    const builtinRow = wrapper.findAll(".re-row").find((r) => r.text().includes("超级管理员"))!;
    expect(builtinRow.exists()).toBe(true);
    expect(builtinRow.text()).not.toContain("删除");
    // 普通角色行仍有“删除”按钮
    const normalRow = wrapper.findAll(".re-row").find((r) => r.text().includes("内容管理员"))!;
    expect(normalRow.findAll("button").map((b) => b.text())).toContain("删除");
  });

  it("renders readonly switch and tip when editing", async () => {
    const wrapper = mountPage();
    await settle(wrapper);

    const row = wrapper.findAll(".re-row").find((r) => r.text().includes("内容管理员"))!;
    const editBtn = row.findAll("button").find((b) => b.text().includes("编辑"))!;
    await editBtn.trigger("click");
    await wrapper.vm.$nextTick();

    const dialog = wrapper.find(".re-dialog-stub");
    expect(dialog.exists()).toBe(true);
    expect(dialog.text()).toContain("只读角色");

    // 开启只读开关后显示提示
    const vm = wrapper.vm as unknown as { form: { sysRoleReadonly?: number } };
    vm.form.sysRoleReadonly = 1;
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".re-dialog-stub").text()).toContain("只读角色无法执行任何新增/修改/删除操作");
  });

  it("renders 5 data-scope options in permission drawer", async () => {
    const wrapper = mountPage();
    await settle(wrapper);

    const row = wrapper.findAll(".re-row").find((r) => r.text().includes("内容管理员"))!;
    const permBtn = row.findAll("button").find((b) => b.text().includes("分配权限"))!;
    await permBtn.trigger("click");
    await settle(wrapper);

    const dialog = wrapper.find(".re-dialog-stub");
    expect(dialog.exists()).toBe(true);
    const text = dialog.text();
    expect(text).toContain("全部数据");
    expect(text).toContain("本部门数据");
    expect(text).toContain("本部门及以下");
    expect(text).toContain("仅本人数据");
    expect(text).toContain("自定义部门");
  });
});
