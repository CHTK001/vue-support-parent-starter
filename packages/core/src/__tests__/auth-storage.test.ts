import Cookies from "js-cookie";
import { afterEach, describe, expect, it } from "vitest";
import { encryptStorageKey } from "@repo/codec-wasm";
import { getConfig } from "../../../config/src/config";
import {
  TokenKey,
  getToken as getGlobalToken,
  normalizeTokenExpires,
  setToken as setGlobalToken,
  userKey,
} from "../../../config/src/token/index";
import { buildStoredUserResult } from "../utils/auth-payload";

describe("token expiry normalization", () => {
  afterEach(() => {
    Cookies.remove(TokenKey);
    localStorage.clear();
  });

  it("keeps missing expires as session token instead of expiring immediately", () => {
    const result = setGlobalToken(
      {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
      {
        isRemembered: false,
      },
    );

    expect(result).toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expires: 0,
    });
    expect(JSON.parse(Cookies.get(TokenKey) || "{}")).toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expires: 0,
    });
  });

  it("normalizes second timestamps and date strings", () => {
    expect(normalizeTokenExpires(1_774_667_839)).toBe(1_774_667_839_000);
    expect(normalizeTokenExpires("2026-03-28T00:00:00Z")).toBe(
      Date.parse("2026-03-28T00:00:00Z"),
    );
  });

  it("falls back to stored user info when cookie token misses the access token", () => {
    const config = getConfig();
    const storageKey = encryptStorageKey(userKey, config.SystemCode);

    Cookies.set(TokenKey, JSON.stringify({ expires: 0 }));
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        accessToken: "storage-access-token",
        refreshToken: "storage-refresh-token",
        expires: 0,
      }),
    );

    expect(getGlobalToken()).toMatchObject({
      accessToken: "storage-access-token",
      refreshToken: "storage-refresh-token",
      expires: 0,
    });
  });
});

describe("stored user payload", () => {
  it("stores access token together with nested and flat user info", () => {
    const result = buildStoredUserResult(
      {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        userInfo: {
          sysUserId: 1,
          sysUserUsername: "sa",
          sysUserNickname: "超级管理员",
          sysUserPhone: "12345678901",
          sysUserEmail: "",
          avatar: "",
          tenantId: "",
          roles: ["SUPER_ADMIN"],
          perms: [],
        },
      },
      {
        expires: 0,
        isRemembered: true,
      },
    );

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(result.expires).toBe(0);
    expect(result.userInfo?.sysUserUsername).toBe("sa");
    expect(result.sysUserUsername).toBe("sa");
    expect(result.roles).toEqual(["SUPER_ADMIN"]);
  });

  it("falls back to previous cached user info when response omits profile fields", () => {
    const result = buildStoredUserResult(
      {
        accessToken: "next-access-token",
      },
      {
        expires: 0,
        fallback: {
          refreshToken: "cached-refresh-token",
          userInfo: {
            sysUserUsername: "sa",
            sysUserNickname: "超级管理员",
            roles: ["SUPER_ADMIN"],
            perms: [],
          },
        },
      },
    );

    expect(result.accessToken).toBe("next-access-token");
    expect(result.refreshToken).toBe("cached-refresh-token");
    expect(result.sysUserUsername).toBe("sa");
    expect(result.roles).toEqual(["SUPER_ADMIN"]);
  });
});
