import { beforeEach, describe, expect, it, vi } from "vitest";
import { aesEncrypt } from "../src/crypto/index";

let mockConfig: Record<string, any> = {
  Request: {
    enableEncrypt: false,
    codecRequestKey: "",
  },
};

const encryptSM4 = vi.fn((payload: string, key: string) => `enc(${payload})::${key}`);
const uu1Unified = vi.fn((response: any) => response);

vi.mock("@repo/config", () => ({
  getConfig: (key?: string) => (key ? mockConfig[key] : mockConfig),
}));

vi.mock("@repo/codec-wasm", () => ({
  encryptSM4,
  uu1: uu1Unified,
  uu2_wasm: vi.fn(),
  uu3: vi.fn((value: string) => value),
  uu4: vi.fn((value: any) => value),
  uu3_wasm: vi.fn((value: string) => value),
  uu4_wasm: vi.fn((value: any) => value?.data || value),
  isWasmLoaded: () => true,
  generateNonce: () => "nonce",
}));

describe("codec runtime contract", () => {
  beforeEach(() => {
    mockConfig = {
      Request: {
        enableEncrypt: false,
        codecRequestKey: "",
      },
    };
    encryptSM4.mockClear();
    uu1Unified.mockReset();
    uu1Unified.mockImplementation((response: any) => response);
  });

  it("encrypts JSON request bodies when backend-compatible request encryption is enabled", async () => {
    mockConfig = {
      Request: {
        enableEncrypt: true,
        codecRequestKey: "request-key",
      },
    };
    const { uu2 } = await import("../src/crypto/codec");
    const request = await uu2({
      url: "/v2/docker/container/save",
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        name: "redis",
      },
    } as any);

    expect(encryptSM4).toHaveBeenCalledWith(
      JSON.stringify({ name: "redis" }),
      "request-key",
    );
    expect(request.headers["access-control-origin-key"]).toBeTruthy();
    expect(request.headers["Content-Type"]).toContain("application/json");
    expect(request.data).toEqual({
      data: 'enc({"name":"redis"})::request-key',
    });
  });

  it("skips request encryption for runtime settings endpoints", async () => {
    mockConfig = {
      Request: {
        enableEncrypt: true,
        codecRequestKey: "request-key",
      },
    };
    const { uu2 } = await import("../src/crypto/codec");
    const request = await uu2({
      url: "/v2/setting/list",
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        sysSettingGroup: "config",
      },
    } as any);

    expect(encryptSM4).not.toHaveBeenCalled();
    expect(request.data).toEqual({
      sysSettingGroup: "config",
    });
  });

  it("only treats response as encrypted when backend sets access-control-no-data=true", async () => {
    const { uu1 } = await import("../src/crypto/codec");
    uu1Unified.mockImplementation(() => {
      throw new Error("decoder should not run for plain response");
    });

    const plainResponse = {
      data: { code: "00000", data: { ok: true } },
      headers: {},
    } as any;

    expect(uu1(plainResponse)).toBe(plainResponse);
  });

  it("delegates encrypted responses to the shared decoder", async () => {
    const { uu1 } = await import("../src/crypto/codec");
    const decodedResponse = {
      data: { code: "00000", data: { ok: true } },
      headers: {
        "access-control-no-data": "true",
      },
    };
    uu1Unified.mockReturnValue(decodedResponse);

    expect(
      uu1({
        data: "cipher-binary",
        headers: {
          "access-control-no-data": "true",
        },
      } as any),
    ).toBe(decodedResponse);
  });

  it("falls back to AES decrypt when wasm uu3 returns the original cipher text", async () => {
    const { uu3 } = await import("../src/crypto/codec");
    const plainText =
      "{accessToken:test-token,refreshToken:,expires:0,isRemembered:true}";
    const encrypted = aesEncrypt(plainText, "1234567890Oil#@1");

    await expect(uu3(encrypted)).resolves.toBe(plainText);
  });
});
