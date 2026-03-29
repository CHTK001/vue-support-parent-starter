import { describe, expect, it } from "vitest";
import { parseRedirectParamPayload } from "../src/redirect-param";

describe("redirect param payload parser", () => {
  it("parses the loose object literal used by monitor sso redirectParam", () => {
    expect(
      parseRedirectParamPayload(
        "{accessToken:token-123,refreshToken:,expires:0,isRemembered:true,userInfo:{sysUserId:1,sysUserUsername:sa,sysUserNickname:sa,roles:[SUPER_ADMIN],perms:[]}}",
      ),
    ).toEqual({
      accessToken: "token-123",
      refreshToken: "",
      expires: 0,
      isRemembered: true,
      userInfo: {
        sysUserId: 1,
        sysUserUsername: "sa",
        sysUserNickname: "sa",
        roles: ["SUPER_ADMIN"],
        perms: [],
      },
    });
  });

  it("accepts standard json payloads", () => {
    expect(
      parseRedirectParamPayload(
        JSON.stringify({
          accessToken: "json-token",
          expires: 0,
          userInfo: { sysUserUsername: "json-user" },
        }),
      ),
    ).toEqual({
      accessToken: "json-token",
      expires: 0,
      userInfo: { sysUserUsername: "json-user" },
    });
  });

  it("returns null for unsupported payloads", () => {
    expect(parseRedirectParamPayload("not-a-payload")).toBeNull();
  });
});
