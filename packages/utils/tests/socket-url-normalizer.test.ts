import { describe, expect, it } from "vitest";
import {
  normalizeSocketUrl,
  normalizeSocketUrls,
  toWebSocketUrl,
} from "../../core/src/config/socketUtils";

describe("socket url normalizer", () => {
  it("replaces wildcard hosts with runtime hostname", () => {
    expect(
      normalizeSocketUrl("http://0.0.0.0:29181", "192.168.110.100"),
    ).toBe("http://192.168.110.100:29181/");

    expect(normalizeSocketUrl("ws://[::]:29181", "192.168.110.100")).toBe(
      "ws://192.168.110.100:29181/",
    );
  });

  it("keeps routable hosts unchanged", () => {
    expect(
      normalizeSocketUrl("http://192.168.110.100:29181", "127.0.0.1"),
    ).toBe("http://192.168.110.100:29181/");
  });

  it("normalizes url lists and websocket conversion", () => {
    expect(
      normalizeSocketUrls(
        ["http://0.0.0.0:29181", "ws://192.168.110.100:29182"],
        "192.168.110.100",
      ),
    ).toEqual([
      "http://192.168.110.100:29181/",
      "ws://192.168.110.100:29182/",
    ]);

    expect(
      toWebSocketUrl("http://0.0.0.0:29181/socket.io/?EIO=4"),
    ).toContain("ws://");
  });
});
