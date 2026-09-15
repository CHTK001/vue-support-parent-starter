/**
 * 缓存管理页面（CacheManage.vue）组件测试
 *
 * 覆盖：
 *  1. 缓存列表渲染：固定 6 项缓存正确展示
 *  2. 刷新单个缓存：点击行内刷新调用 refreshCache，成功提示
 *  3. 刷新全部缓存：点击“刷新全部缓存”触发确认，确认后调用 refreshAllCache
 *
 * 注意：本组件走新口径接口 listCache / refreshCache / refreshAllCache。
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

const ep = vi.hoisted(() => ({
  msg: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  box: { confirm: vi.fn().mockResolvedValue("confirm") },
}));

const api = vi.hoisted(() => ({
  listCache: vi.fn(),
  refreshCache: vi.fn(),
  refreshAllCache: vi.fn(),
}));

vi.mock("element-plus", () => ({ ElMessage: ep.msg, ElMessageBox: ep.box }));
vi.mock("@element-plus/icons-vue", () => {
  const stub = { name: "IconStub", template: "<i />" };
  return new Proxy({} as Record<string, unknown>, { get: () => stub });
});
vi.mock("../api/systemApi", () => api);

import CacheManage from "../views/CacheManage.vue";
import {
  makeReTableStub,
  ReButtonStub,
  ReTagStub,
  elementPlusLayoutStubs,
  settle,
} from "./helpers";

function cacheItem(name: string) {
  return {
    cacheName: name,
    cacheKey: `sys:${name}:*`,
    description: `${name} 缓存`,
    keyCount: 3,
  };
}

const listFixture = {
  data: ["role", "dict", "dept", "setting", "menu", "user"].map(cacheItem),
};

function mountPage() {
  return mount(CacheManage, {
    global: {
      stubs: {
        ReTable: makeReTableStub(["action"]),
        ReButton: ReButtonStub,
        ReTag: ReTagStub,
        ...elementPlusLayoutStubs(),
      },
    },
  });
}

describe("CacheManage 缓存管理页面", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listCache.mockResolvedValue(listFixture);
    api.refreshCache.mockResolvedValue({ data: true });
    api.refreshAllCache.mockResolvedValue({ data: true });
  });

  it("loads and renders 6 cache items", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    expect(api.listCache).toHaveBeenCalled();
    expect(wrapper.findAll(".re-row").length).toBe(6);
  });

  it("refreshes a single cache on row button", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    api.refreshCache.mockClear();

    const firstRefresh = wrapper.findAll(".re-row button").find((b) => b.text().includes("刷新"));
    expect(firstRefresh).toBeTruthy();
    await firstRefresh!.trigger("click");
    await settle(wrapper);

    // 刷新第一个缓存项 role
    expect(api.refreshCache).toHaveBeenCalledWith("role");
    expect(ep.msg.success).toHaveBeenCalledWith("缓存已刷新");
  });

  it("confirms then refreshes all caches", async () => {
    const wrapper = mountPage();
    await settle(wrapper);
    api.refreshAllCache.mockClear();

    const allBtn = wrapper.findAll("button").find((b) => b.text().includes("刷新全部缓存"));
    expect(allBtn).toBeTruthy();
    await allBtn!.trigger("click");
    await settle(wrapper);

    expect(ep.box.confirm).toHaveBeenCalled();
    expect(api.refreshAllCache).toHaveBeenCalled();
    expect(ep.msg.success).toHaveBeenCalledWith("缓存已刷新");
  });
});
