/**
 * 主机画像：内网 IP 端口浮层（ScHostMetricsBar）的基建运算。
 *
 * 后端把内网 IP 落在 `serverHostPrivateIp` 一个字符串里，正常形态是
 * `hostname -I | awk '{print $1}'` 取回的首个 IPv4，但 CSV 导入、HTTP 采集重载、
 * 历史 Agent 上报等场景会把多个 IP 用逗号 / 空格 / 换行 拼在一起。
 * 概要浮层有固定宽度，一行塞不下就必须拆开，否则用户永远漏看。
 *
 * @author CH
 */
import { describe, expect, it } from "vitest";
import { privateIpRowsOf, privateIpTextOf } from "../utils/hostProfileUi";

describe("privateIpRowsOf", () => {
  it("空值各态都回空数组", () => {
    expect(privateIpRowsOf(null)).toEqual([]);
    expect(privateIpRowsOf(undefined)).toEqual([]);
    expect(privateIpRowsOf("")).toEqual([]);
    expect(privateIpRowsOf("   ")).toEqual([]);
  });

  it("单个 IP 按原样返回", () => {
    expect(privateIpRowsOf("10.0.0.3")).toEqual(["10.0.0.3"]);
  });

  it("多个 IP 按逗号/空格/换行拆开", () => {
    expect(privateIpRowsOf("10.0.0.3,10.1.0.5")).toEqual(["10.0.0.3", "10.1.0.5"]);
    expect(privateIpRowsOf("10.0.0.3 10.1.0.5")).toEqual(["10.0.0.3", "10.1.0.5"]);
    expect(privateIpRowsOf("10.0.0.3\n10.1.0.5")).toEqual(["10.0.0.3", "10.1.0.5"]);
    expect(privateIpRowsOf("10.0.0.3\t10.1.0.5")).toEqual(["10.0.0.3", "10.1.0.5"]);
    expect(privateIpRowsOf(" 10.0.0.3 , 10.1.0.5 ")).toEqual(["10.0.0.3", "10.1.0.5"]);
  });

  it("非 IP 组件不混入（IPv4 每段 0-255、IPv6 原样保留）", () => {
    expect(privateIpRowsOf("10.0.0.3, 999.1.1.1, notanip, /tmp")).toEqual(["10.0.0.3"]);
    expect(privateIpRowsOf("fe80::1")).toEqual(["fe80::1"]);
    expect(privateIpRowsOf("fe80::1, 10.0.0.3")).toEqual(["fe80::1", "10.0.0.3"]);
  });
});

describe("privateIpTextOf", () => {
  it("有 IP 时插换行，无 IP 时是空串", () => {
    expect(privateIpTextOf("10.0.0.3, 10.1.0.5")).toBe("10.0.0.3\n10.1.0.5");
    expect(privateIpTextOf("10.0.0.3")).toBe("10.0.0.3");
    expect(privateIpTextOf(null)).toBe("");
    expect(privateIpTextOf(undefined)).toBe("");
    expect(privateIpTextOf("")).toBe("");
  });

  it("浮层多行文本直接渲染，无需二次拼接", () => {
    expect(privateIpTextOf("10.0.0.3,10.1.0.5,10.2.0.9")).toBe("10.0.0.3\n10.1.0.5\n10.2.0.9");
  });
});
