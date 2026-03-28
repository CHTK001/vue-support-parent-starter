import { describe, expect, it } from "vitest";
import { resolveMonitorGlobalSocketStartupOptions } from "../../../apps/vue-support-monitor-starter/src/plugins/globalSocket.options";

describe("monitor global socket startup options", () => {
  it("uses startup defaults compatible with existing behavior", () => {
    expect(
      resolveMonitorGlobalSocketStartupOptions({
        SocketUrl: " ws://a.example.com , ws://b.example.com ",
      }),
    ).toEqual({
      enabled: true,
      startupConnect: true,
      protocol: "socketio",
      context: "/socket.io",
      urls: ["ws://a.example.com", "ws://b.example.com"],
    });
  });

  it("supports disabling startup connection independently", () => {
    expect(
      resolveMonitorGlobalSocketStartupOptions({
        SocketOpen: "true",
        SocketStartupConnect: "false",
        SocketPath: "/monitor-socket",
        SocketUrl: "ws://localhost:19170",
      }),
    ).toEqual({
      enabled: true,
      startupConnect: false,
      protocol: "socketio",
      context: "/monitor-socket",
      urls: ["ws://localhost:19170"],
    });
  });

  it("supports disabling the global socket entirely", () => {
    expect(
      resolveMonitorGlobalSocketStartupOptions({
        SocketOpen: false,
        SocketStartupConnect: true,
        SocketUrl: "ws://localhost:19170",
      }),
    ).toEqual({
      enabled: false,
      startupConnect: true,
      protocol: "socketio",
      context: "/socket.io",
      urls: ["ws://localhost:19170"],
    });
  });

  it("supports explicit socket protocol and normalizes invalid values", () => {
    expect(
      resolveMonitorGlobalSocketStartupOptions({
        SocketProtocol: "WebSocket",
        SocketUrl: "ws://localhost:19170",
      }),
    ).toMatchObject({
      protocol: "websocket",
    });

    expect(
      resolveMonitorGlobalSocketStartupOptions({
        SocketProtocol: "unknown",
        SocketUrl: "ws://localhost:19170",
      }),
    ).toMatchObject({
      protocol: "socketio",
    });
  });

  it("falls back to BaseUrl origin when SocketUrl is absent", () => {
    expect(
      resolveMonitorGlobalSocketStartupOptions({
        BaseUrl: "https://monitor.example.com/monitor/api",
      }),
    ).toMatchObject({
      urls: ["https://monitor.example.com"],
    });
  });
});
