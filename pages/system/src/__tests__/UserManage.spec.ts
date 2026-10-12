/**
 * 用户管理页面（UserManage.vue）扩展功能测试
 *
 * 覆盖：
 *  1. 批量删除：ReTable 回调删除有效用户并自动跳过当前登录账号
 *  2. 详情抽屉：点击用户名打开抽屉，展示基本信息与安全信息
 *  3. 操作列“更多”下拉：包含编辑/重置密码/详情/删除，并验证编辑弹窗内分配角色
 *  4. 状态展示：列表状态开关反映用户启用状态
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
    box: {
      confirm: vi.fn().mockResolvedValue("confirm"),
      prompt: vi.fn().mockResolvedValue({ action: "confirm" }),
      close: vi.fn(),
    },
  };
});

const api = vi.hoisted(() => ({
  pageForUser: vi.fn(),
  saveUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  deleteUsers: vi.fn(),
  resetUserPassword: vi.fn(),
  listForRole: vi.fn(),
  listForPost: vi.fn(),
  listDept: vi.fn(),
  unbindTotp: vi.fn(),
}));

const auth = vi.hoisted(() => ({
  loginUser: { userId: 0 } as Record<string, unknown>,
  getLoginUserInfo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("element-plus", () => ({ ElMessage: ep.msg, ElMessageBox: ep.box, ElNotification: ep.notify }));
vi.mock("@element-plus/icons-vue", () => {
  const stub = { name: "IconStub", template: "<i />" };
  return new Proxy({} as Record<string, unknown>, { get: () => stub, has: () => true });
});
vi.mock("../api/systemApi", () => api);
vi.mock("@repo/pinia/modules/user", () => ({
  default: () => ({ loginName: "admin", username: "admin", userInfo: {} }),
}));
vi.mock("@repo/pinia/modules/auth", () => ({
  default: () => auth,
}));

/**
 * 把 @repo/ui/re-dialog 这个模块整体换成桩。
 *
 * 为什么必须这样做、而不是靠 mountPage 里的 `stubs: { ReDialog: ReDialogStub }`：
 * UserManage.vue 第 32 行是 `import ReDialog from "@repo/ui/re-dialog"`，
 * 在 <script setup> 里**局部引入**；而 VTU 的 global.stubs 是按「注册名」匹配的，
 * 局部引入的组件名对不上，ReDialogStub 根本没生效。
 * 于是渲染的是真的 ReDialog —— 它内部依赖 el-dialog，而本文件的
 * vi.mock("element-plus") 只给了 ElMessage / ElMessageBox / ElNotification，
 * ElDialog 是 undefined，组件直接渲染成空注释，
 * 断言 wrapper.find(".re-dialog-stub") 永远返回 false，
 * 而 dialogVisible 确实已经是 true（直接调 handleEdit、点「编辑」下拉项都验证过）。
 *
 * 同一文件里详情抽屉那个用例能过，正是因为 ReDrawer 走的是全局注册，桩生效了。
 * 所以这里是「局部引入没被 stub 覆盖」，不是页面逻辑问题。
 */
vi.mock("@repo/ui/re-dialog", async () => {
  const { ReDialogStub } = await import("./helpers");
  return { default: ReDialogStub };
});

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
    userRoles: [{ sysRoleId: 1, sysRoleName: "管理员", sysRoleCode: "ADMIN" }],
    userPosts: [],
  },
  {
    sysUserId: 2,
    sysUserUsername: "bob",
    sysUserNickname: "鲍勃",
    sysUserStatus: 1,
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
    api.deleteUsers.mockResolvedValue({ data: 2 });
  });

  it("batch delete skips the current login account", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    auth.loginUser = { userId: 1 };
    const vm = wrapper.vm as unknown as {
      handleBatchDeleteRows: (rows: Record<string, unknown>[]) => Promise<void>;
    };

    await vm.handleBatchDeleteRows(rows as unknown as Record<string, unknown>[]);

    expect(api.deleteUsers).toHaveBeenCalledWith([2]);
    expect(ep.msg).toHaveBeenCalledWith(expect.objectContaining({ message: "已删除 1 个用户", type: "success" }));
    expect(ep.msg).toHaveBeenCalledWith(expect.objectContaining({ message: "已自动跳过当前登录账号", type: "warning" }));
  });

  it("rejects batch delete when only the current account is selected", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    auth.loginUser = { userId: 1 };
    const vm = wrapper.vm as unknown as {
      handleBatchDeleteRows: (rows: Record<string, unknown>[]) => Promise<void>;
    };

    await expect(vm.handleBatchDeleteRows([rows[0]])).rejects.toThrow("no-valid-delete-target");
    expect(api.deleteUsers).not.toHaveBeenCalled();
    expect(ep.msg).toHaveBeenCalledWith(expect.objectContaining({ message: "不允许删除当前登录账号", type: "warning" }));
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

  it("more dropdown matches the current actions", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    const items = wrapper.findAll(".dropdown-item").map((d) => d.text());
    expect(items).toContain("编辑");
    expect(items).toContain("重置密码");
    expect(items).toContain("详情");
    expect(items).toContain("删除");
    expect(items).not.toContain("分配角色");
  });

  it("edits role assignments from the user edit dialog", async () => {
    api.listForRole.mockResolvedValue({
      data: [{ sysRoleId: 9, sysRoleName: "审计员", sysRoleCode: "AUDIT" }],
    });
    const wrapper = mountPage();
    await settle(wrapper);
    const vm = wrapper.vm as unknown as {
      handleEdit: (row: Record<string, unknown>) => void;
    };

    vm.handleEdit(rows[0] as unknown as Record<string, unknown>);
    await settle(wrapper);

    const dialog = wrapper.find(".re-dialog-stub");
    expect(dialog.exists()).toBe(true);
    expect(dialog.text()).toContain("角色");
    expect(dialog.text()).toContain("审计员");
  });

  it("renders the enabled state in the status switch", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    const switches = wrapper.findAll('.re-row input[type="checkbox"]');
    expect(switches).toHaveLength(2);
    expect((switches[0].element as HTMLInputElement).checked).toBe(false);
    expect((switches[1].element as HTMLInputElement).checked).toBe(true);
  });

  describe("更新自己后刷新 /me 登录缓存", () => {
    /** 取 script-setup 暴露的 refreshSelfCache（改自己/改别人的判定逻辑） */
    function refreshSelfCache(wrapper: ReturnType<typeof mountPage>) {
      return (wrapper.vm as unknown as { refreshSelfCache: (u: Record<string, unknown>) => Promise<void> })
        .refreshSelfCache;
    }

    it("按 sysUserId 命中当前登录用户：静默调用 /me", async () => {
      const wrapper = mountPage();
      await settle(wrapper);
      auth.loginUser = { userId: 1 };

      await refreshSelfCache(wrapper)({ sysUserId: 1, sysUserUsername: "someone" });

      expect(auth.getLoginUserInfo).toHaveBeenCalledTimes(1);
      expect(auth.getLoginUserInfo).toHaveBeenCalledWith(false);
    });

    it("按登录账号命中当前用户（authStore 尚未拉到 userId）：同样调用 /me", async () => {
      const wrapper = mountPage();
      await settle(wrapper);
      auth.loginUser = { userId: "" };

      await refreshSelfCache(wrapper)({ sysUserId: 8, sysUserUsername: "admin" });

      expect(auth.getLoginUserInfo).toHaveBeenCalledTimes(1);
    });

    it("改的是别人：不动 /me 缓存", async () => {
      const wrapper = mountPage();
      await settle(wrapper);
      auth.loginUser = { userId: 1 };

      await refreshSelfCache(wrapper)({ sysUserId: 99, sysUserUsername: "other" });

      expect(auth.getLoginUserInfo).not.toHaveBeenCalled();
    });
  });
});
