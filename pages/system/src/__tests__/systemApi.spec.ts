/**
 * systemApi URL/方法构造测试
 *
 * 思路：vi.mock('@repo/utils') 注入一个支持链式调用的假 http()：
 *   .get(url).query(params) / .post(url).data(body) / .put / .delete
 *   每个方法调用记录 {url, params, body}，最后 .then 解包为 { data: { code:0, data:{} } }
 * 然后断言各 API 函数命中的 method + path + 参数是否正确。
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// 通过 vi.hoisted 在 hoist 之前构造共享的调用记录与 mock http
const mockHttp = vi.hoisted(() => {
  const calls: Record<string, any[]> = { get: [], post: [], put: [], delete: [] };
  // 默认响应；setResponse() 可为下一个请求指定真实后端结构（用于钉住分页端点的嵌套层数）
  let nextResponse: any = { code: 0, data: {} };

  function createChain(url: string, method: "get" | "post" | "put" | "delete") {
    const rec: any = { url, method, params: undefined, body: undefined };
    calls[method].push(rec);
    const chain: any = {
      query(p: any) {
        rec.params = p;
        return chain;
      },
      data(b: any) {
        rec.body = b;
        return chain;
      },
      responseType() {
        return chain;
      },
    };
    // 让链对象 thenable，模拟 .then(r => r.data)
    chain.then = (resolve: any) => {
      const payload = nextResponse;
      nextResponse = { code: 0, data: {} };
      return Promise.resolve({ data: payload }).then(resolve);
    };
    return chain;
  }

  const http = () => ({
    get: (url: string) => createChain(url, "get"),
    post: (url: string) => createChain(url, "post"),
    put: (url: string) => createChain(url, "put"),
    delete: (url: string) => createChain(url, "delete"),
  });

  return { calls, http, setResponse: (p: any) => { nextResponse = p; } };
});

vi.mock("@repo/utils", () => ({ http: mockHttp.http }));

import {
  listForPost,
  pageForPost,
  savePost,
  updatePost,
  deletePost,
  listCacheModules,
  listCacheKeys,
  deleteCacheKey,
  clearCacheModule,
  clearAllCache,
  pageForMessageAdmin,
  saveMessageAdmin,
  statisticMessageAdmin,
  pageForIp,
  saveIp,
  updateIp,
  deleteIp,
  getErrorLogDetail,
  statisticErrorLog,
  cleanErrorLog,
  getJvmInfo,
  listRateLimit,
  saveRateLimit,
  updateRateLimit,
  deleteRateLimit,
  applyRateLimitGlobal,
  pageForAccountBw,
  saveAccountBw,
  deleteAccountBw,
  saveHotReload,
} from "../api/systemApi";

describe("systemApi URL/方法构造", () => {
  beforeEach(() => {
    mockHttp.calls.get.length = 0;
    mockHttp.calls.post.length = 0;
    mockHttp.calls.put.length = 0;
    mockHttp.calls.delete.length = 0;
  });

  it("岗位：列表 GET /v2/post/list", async () => {
    await listForPost();
    expect(mockHttp.calls.get.at(-1)).toMatchObject({ method: "get", url: "/v2/post/list" });
  });

  it("岗位：分页 GET /v2/post/page 携带查询参数", async () => {
    await pageForPost({ page: 1, pageSize: 10, sysPostName: "工程师" });
    const c = mockHttp.calls.get.at(-1)!;
    expect(c.url).toBe("/v2/post/page");
    expect(c.params.sysPostName).toBe("工程师");
  });

  it("岗位：新增 POST /v2/post/save", async () => {
    await savePost({ sysPostName: "工程师", sysPostCode: "ENG" } as any);
    const c = mockHttp.calls.post.at(-1)!;
    expect(c.url).toBe("/v2/post/save");
    expect(c.body.sysPostCode).toBe("ENG");
  });

  it("岗位：更新 PUT /v2/post/update", async () => {
    await updatePost({ sysPostId: 1 } as any);
    expect(mockHttp.calls.put.at(-1)).toMatchObject({ method: "put", url: "/v2/post/update" });
  });

  it("岗位：删除 DELETE /v2/post/delete 携带 postId", async () => {
    await deletePost(5);
    const c = mockHttp.calls.delete.at(-1)!;
    expect(c.url).toBe("/v2/post/delete");
    expect(c.params.postId).toBe(5);
  });

  it("缓存：模块列表 GET /v2/cache/modules", async () => {
    await listCacheModules();
    expect(mockHttp.calls.get.at(-1)?.url).toBe("/v2/cache/modules");
  });

  it("缓存：Key 列表 GET /v2/cache/keys 携带 module", async () => {
    await listCacheKeys("menu");
    const c = mockHttp.calls.get.at(-1)!;
    expect(c.url).toBe("/v2/cache/keys");
    expect(c.params.module).toBe("menu");
  });

  it("缓存：删除单 Key DELETE /v2/cache/key", async () => {
    await deleteCacheKey("sys:menu:1");
    const c = mockHttp.calls.delete.at(-1)!;
    expect(c.url).toBe("/v2/cache/key");
    expect(c.params.key).toBe("sys:menu:1");
  });

  it("缓存：清空模块 DELETE /v2/cache/module", async () => {
    await clearCacheModule("role");
    const c = mockHttp.calls.delete.at(-1)!;
    expect(c.url).toBe("/v2/cache/module");
    expect(c.params.module).toBe("role");
  });

  it("缓存：清空全部 DELETE /v2/cache/all", async () => {
    await clearAllCache();
    expect(mockHttp.calls.delete.at(-1)?.url).toBe("/v2/cache/all");
  });

  it("消息：分页 GET /v2/message/sys-message/admin/page", async () => {
    await pageForMessageAdmin({ page: 1 });
    expect(mockHttp.calls.get.at(-1)?.url).toBe("/v2/message/sys-message/admin/page");
  });

  it("消息：新增 POST /v2/message/admin/save", async () => {
    await saveMessageAdmin({ title: "t" } as any);
    expect(mockHttp.calls.post.at(-1)?.url).toBe("/v2/message/admin/save");
  });

  it("消息：统计 GET /v2/message/admin/statistic", async () => {
    await statisticMessageAdmin();
    expect(mockHttp.calls.get.at(-1)?.url).toBe("/v2/message/admin/statistic");
  });

  it("IP：分页 GET /v2/ip/page 携带 type", async () => {
    await pageForIp({ page: 1, sysIpType: 1 });
    const c = mockHttp.calls.get.at(-1)!;
    expect(c.url).toBe("/v2/ip/page");
    expect(c.params.sysIpType).toBe(1);
  });

  it("IP：业务侧拿到的是已展平的分页体（拦截器已剥 ReturnPageResult 内层）", async () => {
    // /v2/ip/page 的原始响应是 {code:"00000", data:{code:0,msg,data:{total,data}}}，
    // 但 http 响应拦截器（packages/core/src/httpCrypto.ts checkApiResponse）在
    // inner.code===0 时会把内层展平，业务侧 res.data 直接就是分页体。
    // 这里模拟「拦截器之后」的结构 —— 即业务代码实际看到的形状。
    mockHttp.setResponse({
      code: "00000",
      data: { pageNo: 1, pageSize: 10, totalPages: 1, total: 6, data: [{ sysIpId: 1, sysIpIp: "1.1.1.1" }] },
    });
    const res = await pageForIp({ page: 1, pageSize: 10 });
    expect(res.data?.total).toBe(6);
    expect(res.data?.data).toHaveLength(1);
  });

  it("账号名单：数组在 list（与 IP 的 data 字段名不同）", async () => {
    mockHttp.setResponse({
      code: "00000",
      data: { list: [{ sysAccountBwId: 1, account: "ops" }], total: 2, pageNo: 1, pageSize: 10, pages: 1 },
    });
    const res = await pageForAccountBw({ page: 1, pageSize: 10 });
    expect(res.data?.total).toBe(2);
    expect(res.data?.list).toHaveLength(1);
  });

  it("IP：新增 POST /v2/ip/save", async () => {
    await saveIp({ sysIpIp: "1.1.1.1" } as any);
    expect(mockHttp.calls.post.at(-1)?.url).toBe("/v2/ip/save");
  });

  it("IP：更新 PUT /v2/ip/update", async () => {
    await updateIp({ sysIpId: 1 } as any);
    expect(mockHttp.calls.put.at(-1)?.url).toBe("/v2/ip/update");
  });

  it("IP：删除 DELETE /v2/ip/delete", async () => {
    await deleteIp(2);
    const c = mockHttp.calls.delete.at(-1)!;
    expect(c.url).toBe("/v2/ip/delete");
    expect(c.params.sysIpId).toBe(2);
  });

  it("错误日志：详情 GET /v2/log/error-detail", async () => {
    await getErrorLogDetail(9);
    const c = mockHttp.calls.get.at(-1)!;
    expect(c.url).toBe("/v2/log/error-detail");
    expect(c.params.sysErrorLogId).toBe(9);
  });

  it("错误日志：统计 GET /v2/log/error-statistic", async () => {
    await statisticErrorLog();
    expect(mockHttp.calls.get.at(-1)?.url).toBe("/v2/log/error-statistic");
  });

  it("错误日志：清理 DELETE /v2/log/error/clean 携带 days", async () => {
    await cleanErrorLog(30);
    const c = mockHttp.calls.delete.at(-1)!;
    expect(c.url).toBe("/v2/log/error/clean");
    expect(c.params.days).toBe(30);
  });

  it("监控：JVM 信息 GET /v2/jvm/info", async () => {
    await getJvmInfo();
    expect(mockHttp.calls.get.at(-1)?.url).toBe("/v2/jvm/info");
  });

  it("策略：限流列表携带真实 dimension", async () => {
    await listRateLimit("ip");
    const c = mockHttp.calls.get.at(-1)!;
    expect(c.url).toBe("/v2/policy/ratelimit/list");
    expect(c.params).toEqual({ dimension: "ip" });
  });

  it("策略：新增限流规则保留数字状态与请求体引用", async () => {
    const payload = {
      dimension: "account" as const,
      target: "admin",
      qps: 50,
      burstSize: 100,
      enabled: 1 as const,
    };
    await saveRateLimit(payload);
    const c = mockHttp.calls.post.at(-1)!;
    expect(c.url).toBe("/v2/policy/ratelimit/save");
    expect(c.body).toBe(payload);
  });

  it("策略：更新与删除限流规则使用后端主键参数", async () => {
    await updateRateLimit({ sysRateLimitRuleId: 7, qps: 20, enabled: 0 });
    expect(mockHttp.calls.put.at(-1)?.url).toBe("/v2/policy/ratelimit/update");

    await deleteRateLimit(7);
    const c = mockHttp.calls.delete.at(-1)!;
    expect(c.url).toBe("/v2/policy/ratelimit/delete");
    expect(c.params).toEqual({ id: 7 });
  });

  it("策略：应用全局限流使用 Boolean 与数值参数", async () => {
    const payload = { enabled: true, qps: 200, burstSize: 400, dimension: "global" };
    await applyRateLimitGlobal(payload);
    const c = mockHttp.calls.post.at(-1)!;
    expect(c.url).toBe("/v2/policy/ratelimit/global/apply");
    expect(c.body).toBe(payload);
  });

  it("策略：账号名单查询使用 1/2 类型与 0/1 状态", async () => {
    await pageForAccountBw({ page: 2, pageSize: 20, account: "ops", type: 2, status: 1 });
    const c = mockHttp.calls.get.at(-1)!;
    expect(c.url).toBe("/v2/policy/account-bw/page");
    expect(c.params).toEqual({ page: 2, pageSize: 20, account: "ops", type: 2, status: 1 });
  });

  it("策略：账号名单保存和删除使用真实字段口径", async () => {
    const payload = { sysAccountBwId: 9, account: "blocked", type: 1 as const, status: 1 as const };
    await saveAccountBw(payload);
    expect(mockHttp.calls.post.at(-1)?.body).toBe(payload);

    await deleteAccountBw(9);
    const c = mockHttp.calls.delete.at(-1)!;
    expect(c.url).toBe("/v2/policy/account-bw/delete");
    expect(c.params).toEqual({ id: 9 });
  });

  it("策略：热更新保存保留完整配置实体", async () => {
    const payload = {
      sysSettingId: 3,
      sysSettingName: "Feature Flag",
      sysSettingCode: "feature.flag",
      sysSettingValue: "true",
      sysSettingValueType: "boolean",
      sysSettingVersion: 2,
    };
    await saveHotReload(payload);
    const c = mockHttp.calls.post.at(-1)!;
    expect(c.url).toBe("/v2/policy/hotreload/save");
    expect(c.body).toBe(payload);
  });
});
