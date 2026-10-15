import { describe, expect, it } from "vitest";
import { createApiFailureError } from "../httpCrypto";

describe("createApiFailureError", () => {
  it("保留失败响应中的已落库业务数据", () => {
    const err = createApiFailureError(
      {
        code: "S0503C0000",
        msg: "服务器 http://0.0.0.0:8112：端口绑定重试失败",
        success: false,
        ok: false,
        data: {
          node: { id: 45, name: "PWTEST-life-err", status: "ERROR" },
          hotApplied: false,
          restarted: false,
          message: "配置已保存但热更新未生效",
        },
      },
      "请求失败",
    );

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("服务器 http://0.0.0.0:8112：端口绑定重试失败");
    expect(err.code).toBe("S0503C0000");
    expect(err.success).toBe(false);
    expect(err.ok).toBe(false);
    expect((err.data as { node: { id: number } }).node.id).toBe(45);
  });

  it("失败响应没有业务数据时保持 data 为空值", () => {
    const err = createApiFailureError(
      { code: "A0400S0000", msg: "参数错误", success: false, ok: false },
      "请求失败",
    );

    expect(err).toBeInstanceOf(Error);
    expect(err.data).toBeUndefined();
  });
});