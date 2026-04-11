import { describe, expect, it } from "vitest";
import {
  isAlwaysAvailableStaticRoute,
  resolveLocalRouteModulePaths,
  resolveRouteSourceMode,
  shouldLoadLocalBusinessRoutes,
  shouldEnableLocalModuleDiscovery,
} from "../router/route-mode";

describe("route source mode", () => {
  it("uses local-only mode when remote menu is disabled", () => {
    expect(resolveRouteSourceMode({ RemoteMenu: false })).toBe("local-only");
    expect(shouldLoadLocalBusinessRoutes({ RemoteMenu: false })).toBe(true);
  });

  it("uses remote-only mode when remote menu is enabled without local merge", () => {
    expect(
      resolveRouteSourceMode({
        RemoteMenu: true,
        MergeLocalMenu: false,
      }),
    ).toBe("remote-only");
    expect(
      shouldLoadLocalBusinessRoutes({
        RemoteMenu: true,
        MergeLocalMenu: false,
      }),
    ).toBe(false);
  });

  it("uses hybrid mode when remote and local routes are both enabled", () => {
    expect(
      resolveRouteSourceMode({
        RemoteMenu: true,
        MergeLocalMenu: true,
      }),
    ).toBe("hybrid");
    expect(
      shouldLoadLocalBusinessRoutes({
        RemoteMenu: true,
        MergeLocalMenu: true,
      }),
    ).toBe(true);
  });

  it("normalizes local module route paths from string and array inputs", () => {
    expect(
      resolveLocalRouteModulePaths({
        LocalRouteModulePaths: "../../pages/soft, ../../pages/proxy/src/router.ts",
      }),
    ).toEqual([
      "../../pages/soft",
      "../../pages/proxy/src/router.ts",
    ]);

    expect(
      resolveLocalRouteModulePaths({
        LocalRouteModulePaths: [
          "../../pages/soft",
          "../../pages/soft",
          "../../pages/proxy",
        ],
      }),
    ).toEqual(["../../pages/soft", "../../pages/proxy"]);
  });

  it("gates module route discovery behind local route loading", () => {
    expect(
      shouldEnableLocalModuleDiscovery({
        RemoteMenu: false,
        EnableLocalModuleDiscovery: true,
      }),
    ).toBe(true);
    expect(
      shouldEnableLocalModuleDiscovery({
        RemoteMenu: true,
        MergeLocalMenu: false,
        EnableLocalModuleDiscovery: true,
      }),
    ).toBe(false);
  });

  it("preserves explicitly marked static routes in remote-only mode", () => {
    expect(
      isAlwaysAvailableStaticRoute({
        path: "/",
        meta: { alwaysIncludeStatic: true },
      }),
    ).toBe(true);
    expect(
      isAlwaysAvailableStaticRoute({
        path: "/manage",
        children: [{ path: "/home", meta: { alwaysIncludeStatic: true } }],
      }),
    ).toBe(true);
    expect(
      isAlwaysAvailableStaticRoute({
        path: "/manage",
        meta: { title: "系统管理" },
      }),
    ).toBe(false);
  });
});
