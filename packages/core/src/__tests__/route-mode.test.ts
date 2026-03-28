import { describe, expect, it } from "vitest";
import {
  resolveRouteSourceMode,
  shouldLoadLocalBusinessRoutes,
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
});
