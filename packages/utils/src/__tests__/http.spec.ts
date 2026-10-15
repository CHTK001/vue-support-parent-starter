import { describe, expect, it } from "vitest";

import { unwrapResult } from "../http";

describe("unwrapResult", () => {
  it("成功响应直接返回业务 data", () => {
    const res = { code: "00000", msg: "ok", data: { id: 1, status: "RUNNING" } };
    expect(unwrapResult(res)).toEqual({ id: 1, status: "RUNNING" });
  });

  it("失败但携带已保存数据时，数据挂在 Error.data 上而不是被丢弃", () => {
    const node = {
      id: 18881,
      name: "PWTEST-life-err",
      status: "ERROR",
      error: "端口绑定重试 11 次仍失败",
    };
    const res = {
      data: {
        code: "S0503C0000",
        msg: "节点已保存但启动失败",
        success: false,
        ok: false,
        data: node,
      },
    };

    const caught = (() => {
      try {
        unwrapResult(res);
        return null;
      } catch (e) {
        return e as Error & { code?: string; data?: unknown; status?: number };
      }
    })();

    expect(caught).toBeInstanceOf(Error);
    expect(caught?.message).toBe("节点已保存但启动失败");
    expect(caught?.code).toBe("S0503C0000");
    expect(caught?.data).toEqual(node);
  });

  it("失败且无 data 时，Error.data 保持 undefined", () => {
    const caught = (() => {
      try {
        unwrapResult({ code: "S0503C0000", msg: "没有数据", data: undefined });
        return null;
      } catch (e) {
        return e as Error & { data?: unknown };
      }
    })();

    expect(caught?.message).toBe("没有数据");
    expect(caught?.data).toBeUndefined();
  });
});