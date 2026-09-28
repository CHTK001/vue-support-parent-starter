/**
 * 岗位管理页面（PostManage.vue）组件测试
 *
 * 覆盖：
 *  1. 页面渲染：搜索区、表格、新增按钮
 *  2. 新增岗位弹窗：点击新增打开弹窗；表单校验（名称/编码必填）；合法提交调用新增接口
 *  3. 删除岗位：点击删除触发确认弹窗，确认后调用删除接口
 *  4. 搜索功能：点击查询再次调用分页接口
 *
 * 运行：pnpm --filter @pages/system test  （详见 __tests__/README）
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

vi.mock("element-plus", () => ({
  ElMessage: ep.msg,
  ElMessageBox: ep.box,
}));
vi.mock("@element-plus/icons-vue", () => {
  const stub = { name: "IconStub", template: "<i />" };
  return new Proxy({} as Record<string, unknown>, { get: () => stub });
});

const ep = vi.hoisted(() => ({
  msg: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  box: { confirm: vi.fn().mockResolvedValue("confirm") },
}));

const api = vi.hoisted(() => ({
  pageForPost: vi.fn(),
  savePost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
}));
vi.mock("../api/systemApi", () => api);

import PostManage from "../views/PostManage.vue";
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

const pageFixture = {
  data: {
    total: 1,
    data: [
      {
        sysPostId: 1,
        sysPostName: "工程师",
        sysPostCode: "ENG",
        sysPostSort: 1,
        sysPostStatus: 0,
        createTime: "2026-01-01 10:00:00",
      },
    ],
  },
};

function mountPage() {
  return mount(PostManage, {
    global: {
      stubs: {
        ReTable: makeReTableStub(["status", "action"]),
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

describe("PostManage 岗位管理页面", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.pageForPost.mockResolvedValue(pageFixture);
    api.savePost.mockResolvedValue({ data: {} });
    api.updatePost.mockResolvedValue({ data: true });
    api.deletePost.mockResolvedValue({ data: true });
  });

  it("renders search form, table and add button correctly", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    // 搜索区由 ReTable 内置 :search filters 渲染，断言限定在搜索区内
    const search = wrapper.find(".re-table__search");
    expect(search.exists()).toBe(true);
    expect(search.text()).toContain("岗位名称");
    expect(search.text()).toContain("岗位编码");
    // 表格渲染出一行数据（行级操作列含 编辑/删除）
    expect(wrapper.find(".re-table-stub").exists()).toBe(true);
    expect(wrapper.findAll(".re-row").length).toBeGreaterThan(0);
    // 行级操作为方形图标按钮，可访问名取 title
    const rowActions = wrapper.findAll(".re-row button").map((b) => (b.attributes("title") || b.text()).trim());
    expect(rowActions).toContain("编辑");
    expect(rowActions).toContain("删除");
    // 工具栏按钮（搜索区内置 搜索/重置，#toolbar 插槽提供 新增）
    // 新增按钮按子串匹配「新增」：文案是「新增」还是「新增岗位」属于措辞偏好，
    // 断言的意图只是「存在一个新增入口」，不该被文案调整打断
    const labels = wrapper.findAll("button").map((b) => b.text());
    expect(labels).toContain("搜索");
    expect(labels).toContain("重置");
    expect(labels.some((l) => l.includes("新增"))).toBe(true);
  });

  it("calls page query on mount", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    expect(api.pageForPost).toHaveBeenCalled();
  });

  it("opens add dialog and validates name/code required", async () => {
    const wrapper = mountPage();
    await settle(wrapper);

    // 弹窗初始不渲染
    expect(wrapper.find(".re-dialog-stub").exists()).toBe(false);

    // 点击“新增”打开弹窗
    const addBtn = wrapper.findAll("button").find((b) => b.text().includes("新增"));
    expect(addBtn).toBeTruthy();
    await addBtn!.trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".re-dialog-stub").exists()).toBe(true);

    // 空表单点确定 -> 名称必填提示
    await wrapper.find(".dialog-ok").trigger("click");
    expect(ep.msg.warning).toHaveBeenCalledWith("请输入岗位名称");

    // 只填名称不填编码 -> 编码必填提示
    (wrapper.vm as unknown as Record<string, unknown>).form = {
      sysPostName: "工程师",
      sysPostCode: "",
    };
    await wrapper.vm.$nextTick();
    await wrapper.find(".dialog-ok").trigger("click");
    expect(ep.msg.warning).toHaveBeenCalledWith("请输入岗位编码");
  });

  it("saves a new post when form valid", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    api.pageForPost.mockClear();

    const addBtn = wrapper.findAll("button").find((b) => b.text().includes("新增"))!;
    await addBtn.trigger("click");
    await wrapper.vm.$nextTick();

    (wrapper.vm as unknown as Record<string, unknown>).form = {
      sysPostName: "产品经理",
      sysPostCode: "PM",
      sysPostStatus: 0,
    };
    await wrapper.vm.$nextTick();
    await wrapper.find(".dialog-ok").trigger("click");
    await settle(wrapper);

    expect(api.savePost).toHaveBeenCalledWith(
      expect.objectContaining({ sysPostName: "产品经理", sysPostCode: "PM" }),
    );
    expect(ep.msg.success).toHaveBeenCalledWith("新增成功");
  });

  it("confirms deletion and calls delete api", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    api.deletePost.mockClear();

    // 行内“删除”为方形图标按钮，按 title 定位
    const delBtn = wrapper.findAll(".re-row button").find((b) => (b.attributes("title") || "").trim() === "删除");
    expect(delBtn).toBeTruthy();
    await delBtn!.trigger("click");
    await settle(wrapper);

    expect(ep.box.confirm).toHaveBeenCalled();
    expect(api.deletePost).toHaveBeenCalledWith(1);
    expect(ep.msg.success).toHaveBeenCalledWith("删除成功");
  });

  it("calls query api again when search button clicked", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    const before = api.pageForPost.mock.calls.length;

    // 在内置搜索区填写“岗位名称”过滤项，再点击搜索按钮
    const nameInput = wrapper.find<HTMLInputElement>(
      '.re-search-filter[data-filter-key="sysPostName"] input',
    );
    expect(nameInput.exists()).toBe(true);
    await nameInput.setValue("工程师");

    const queryBtn = wrapper.find(".re-search-query-btn");
    expect(queryBtn.exists()).toBe(true);
    expect(queryBtn.text()).toContain("搜索");
    await queryBtn.trigger("click");
    await settle(wrapper);

    expect(api.pageForPost.mock.calls.length).toBeGreaterThan(before);
    // 搜索按钮必须把当前过滤条件真正带给接口
    expect(api.pageForPost).toHaveBeenLastCalledWith(
      expect.objectContaining({ sysPostName: "工程师" }),
    );
  });
});
