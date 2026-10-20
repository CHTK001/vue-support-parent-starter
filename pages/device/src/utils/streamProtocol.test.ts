import { describe, expect, it } from "vitest";
import { planStream } from "./streamProtocol";

describe("planStream（设备流协议判定）", () => {
  it("m3u8 → hls", () => {
    expect(planStream("http://cam/live/a.m3u8").strategy).toBe("hls");
    expect(planStream("http://cam/a.m3u8?token=1").strategy).toBe("hls");
  });

  it("flv / ws / wss → flv", () => {
    expect(planStream("http://cam/live/a.flv").strategy).toBe("flv");
    expect(planStream("ws://cam/live/a").strategy).toBe("flv");
    expect(planStream("wss://cam/live/a?ch=1").strategy).toBe("flv");
  });

  it("rtsp 一律判为需要服务端网关，并给出说明", () => {
    for (const u of ["rtsp://cam/live", "rtsps://cam/live", "rtsp://192.168.1.2:554/Streaming/Channels/101"]) {
      const p = planStream(u);
      expect(p.strategy).toBe("rtsp-gateway");
      expect(p.protocol).toBe("rtsp");
      expect(p.note).toContain("服务端");
    }
  });

  it("即使后端 hint 说 hls，URL 是 rtsp 也按 rtsp 处理（scheme 优先）", () => {
    expect(planStream("rtsp://cam/live", "hls").strategy).toBe("rtsp-gateway");
  });

  it("配置 RTSP 网关后把 rtsp:// 改写成 HTTP-FLV 并交给 flv 播放器", () => {
    const source = "rtsp://192.168.1.2:554/live/ch1?user=admin&pwd=xx";
    const p = planStream(source, "rtsp", {
      gateway: {
        template: "http://gw:8080/rtsp?url={url}&type=flv",
        protocol: "flv",
      },
    });
    expect(p.strategy).toBe("flv");
    expect(p.protocol).toBe("rtsp");
    expect(p.url).toContain("http://gw:8080/rtsp?url=");
    expect(p.url).toContain(encodeURIComponent(source));
    expect(p.note).toContain("网关");
  });

  it("go2rtc 网关不直接改写 URL，由调用方先创建流再取 HLS", () => {
    const p = planStream("rtsp://95.67.22.23:554/11", "rtsp", {
      gateway: { kind: "go2rtc", baseUrl: "http://127.0.0.1:1984", protocol: "hls" },
    });
    expect(p.strategy).toBe("rtsp-gateway");
    expect(p.url).toBe("rtsp://95.67.22.23:554/11");
  });

  it("裸流 → raw-h264 / raw-h265", () => {
    expect(planStream("http://cam/a.h264").strategy).toBe("raw-h264");
    expect(planStream("http://cam/a.264").strategy).toBe("raw-h264");
    expect(planStream("http://cam/a.h265").strategy).toBe("raw-h265");
    expect(planStream("http://cam/a.hevc").strategy).toBe("raw-h265");
    expect(planStream("http://cam/stream?id=1", "h265").strategy).toBe("raw-h265");
  });

  it("mp4/webm → native", () => {
    expect(planStream("http://cam/a.mp4").strategy).toBe("native");
    expect(planStream("http://cam/a.webm").strategy).toBe("native");
  });

  it("空地址与未知地址给出可读说明", () => {
    expect(planStream("").strategy).toBe("unknown");
    expect(planStream("").note).toBeTruthy();
    const weird = planStream("http://cam/mystery", "whatever");
    expect(weird.strategy).toBe("unknown");
    expect(weird.note).toContain("无法识别");
  });

  it("WebRTC 标记为 native 并提示需要信令", () => {
    const p = planStream("https://cam/webrtc", "webrtc");
    expect(p.strategy).toBe("native");
    expect(p.note).toContain("信令");
  });
});
