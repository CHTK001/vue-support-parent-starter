import { describe, expect, it } from "vitest";
import {
  resolveRequestConfig,
  resolveRequestEncryptConfig,
  resolveRequestSecretKey,
} from "../src/http/config-resolver";

describe("request config resolver", () => {
  it("prefers nested Request config while preserving defaults", () => {
    const resolved = resolveRequestConfig({
      baseHttpTimeout: 15000,
      Request: {
        timeout: 60000,
        retryCount: 5,
        retryDelay: 2000,
        showLoading: false,
        enable: true,
        enableSign: false,
        enableEncrypt: true,
        codecRequestKey: " nested-key ",
        secretKey: " nested-secret ",
      },
    });

    expect(resolved).toMatchObject({
      timeout: 60000,
      retryCount: 5,
      retryDelay: 2000,
      showLoading: false,
      enable: true,
      enableSign: false,
      enableEncrypt: true,
      codecRequestKey: "nested-key",
      secretKey: "nested-secret",
    });
  });

  it("falls back to legacy flat encrypt config for compatibility", () => {
    const resolved = resolveRequestEncryptConfig({
      CodecRequestOpen: "true",
      CodecRequestKey: " legacy-key ",
    });

    expect(resolved).toEqual({
      enableEncrypt: true,
      codecRequestKey: "legacy-key",
    });
  });

  it("falls back to top-level secretKey when Request.secretKey is absent", () => {
    expect(resolveRequestSecretKey({ secretKey: " top-level-secret " })).toBe(
      "top-level-secret",
    );
    expect(resolveRequestSecretKey({}, "default-secret")).toBe(
      "default-secret",
    );
  });
});
