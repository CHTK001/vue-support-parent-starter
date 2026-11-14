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

const ep = vi.hoisted(() => {
  // @repo/core 的 msg.ts 用的是 Element Plus 的**函数式** API：
  //   ElMessage.closeAll();
  //   ElMessage({ message, plain, duration, type, ... });
  // 替身必须「本身可调用、且带 closeAll」。早期版本给的是按类型分方法的对象，
  // 页面里任何一句 message.xxx(...) 都会当场 TypeError —— 本文件目前没断言到它，
  // 所以一直没暴露，但只要有人加一条断言就会踩坑。
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
  ElNotification: ep.notify,
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

const ReChartStub = {
  name: "ReChartStub",
  props: ["type", "atlas", "orbit", "matrix", "height", "zoomable"],
  template: '<div class="re-chart-stub" :data-type="type" />',
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
        ReChart: ReChartStub,
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

  it("指挥台：星图入口在 ReTable 工具栏左侧，弹窗里给星图开启图内缩放；轨道常驻右侧详情", async () => {
    const wrapper = mountPage();
    await settle(wrapper);

    // 视图切换已取消，星图不在右侧栏
    expect(wrapper.find(".role-deck-tab").exists()).toBe(false);
    expect(wrapper.find(".deck-side__atlas").exists()).toBe(false);
    expect(wrapper.find(".deck-side__orbit .re-chart-stub").attributes("data-type")).toBe("orbit");
    // 弹窗默认关闭
    expect(wrapper.find(".re-dialog-stub").exists()).toBe(false);

    // 工具栏左侧按钮 → 打开星图弹窗
    const atlasBtn = wrapper.findAll(".re-table-stub button").find((b) => b.text().includes("授权星图"));
    expect(atlasBtn).toBeTruthy();
    await atlasBtn!.trigger("click");
    await wrapper.vm.$nextTick();
    const dialog = wrapper.find(".re-dialog-stub");
    expect(dialog.exists()).toBe(true);
    expect(dialog.find(".re-chart-stub").attributes("data-type")).toBe("atlas");
    // 缩放由星图组件自己提供（zoomable），弹窗层只有标题和说明
    const chart = dialog.findAllComponents({ name: "ReChartStub" })[0];
    expect(chart!.props("zoomable")).toBe(true);

    // 点节点 → 联动右侧详情并收起弹窗
    const vm = wrapper.vm as unknown as {
      onAtlasSelect: (payload: { type: string; id?: string }) => void;
    };
    vm.onAtlasSelect({ type: "atlas", id: "2" });
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".deck-side").text()).toContain("内容管理员");
  });

  it("指挥台：KPI 取真实角色快照，详情面板跟随选中角色", async () => {
    api.getRoleMenu.mockResolvedValue({ data: [] });
    const wrapper = mountPage();
    await settle(wrapper);

    // pageFixture 两个角色、全部启用 → 第一格 KPI 就是 2
    expect(wrapper.find(".deck-kpi__value").text()).toBe("2");
    expect(wrapper.text()).toContain("平均覆盖率");

    // 默认选中快照第一个角色（超级管理员）
    expect(wrapper.find(".deck-side").text()).toContain("超级管理员");
    expect(wrapper.find(".deck-side").text()).toContain("全部数据");

    const vm = wrapper.vm as unknown as {
      onRowClick: (row: Record<string, unknown>) => void;
    };
    vm.onRowClick({
      sysRoleId: 2,
      sysRoleName: "内容管理员",
      sysRoleCode: "CONTENT",
      sysRoleStatus: 1,
      sysRoleDataScope: 3,
    });
    await wrapper.vm.$nextTick();

    const side = wrapper.find(".deck-side").text();
    expect(side).toContain("内容管理员");
    expect(side).toContain("本部门及以下");
  });
});
