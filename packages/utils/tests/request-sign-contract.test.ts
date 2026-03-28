import CryptoJS from "crypto-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockConfig: Record<string, any> = {
  Request: {
    secretKey: "runtime-secret",
  },
};

vi.mock("@repo/config", () => ({
  getConfig: () => mockConfig,
}));

vi.mock("@repo/codec-wasm", () => ({
  generateNonce: () => "fixed-nonce",
  md5Hash: (value: string) => CryptoJS.MD5(value).toString(),
}));

describe("request sign contract", () => {
  beforeEach(() => {
    mockConfig = {
      Request: {
        secretKey: "runtime-secret",
      },
    };
  });

  it("collects sign parameters the same way as backend NonceUtils", async () => {
    const { collectParams } = await import("../src/http/sign");
    const payload = new FormData();
    payload.append("b", "2");
    payload.append("a", "1");
    payload.append("file", new File(["x"], "demo.txt"));
    payload.append("tag", "alpha");
    payload.append("tag", "beta");

    expect(
      collectParams({
        url: "/v2/demo/save",
        method: "post",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          keyword: "monitor",
          files: "should-be-ignored",
          nested: { nope: true },
        },
        data: payload,
      } as any),
    ).toEqual({
      a: "1",
      b: "2",
      keyword: "monitor",
      tag: "alpha,beta",
    });
  });

  it("generates x-sign with the shared backend formula", async () => {
    const { generateSign } = await import("../src/http/sign");
    const config = {
      url: "/v2/docker/container/page",
      method: "get",
      params: {
        page: 1,
        pageSize: 20,
      },
      headers: {},
    } as any;

    const timestamp = 1_774_667_839_000;
    const nonce = "nonce-1234567890abcdef";
    const fingerprint = "fp-abcdef123456";
    const expectedParamsMd5 = CryptoJS.MD5("page=1&pageSize=20").toString();
    const expected = CryptoJS.MD5(
      nonce + fingerprint + timestamp + expectedParamsMd5 + "runtime-secret",
    ).toString();

    expect(generateSign(config, timestamp, nonce, fingerprint)).toBe(expected);
  });
});
