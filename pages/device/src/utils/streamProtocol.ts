/**
 * 设备流协议识别与播放策略选择。
 *
 * <p>为什么单独抽出来：设备页的协议既可能来自后端（{@code /video/stream?protocol=}），
 * 也可能藏在 URL 里（后缀、query、scheme），还可能是「后端说 rtsp、实际返回 http-flv」
 * 这种不一致。播放器组件不应该自己猜，统一在这里判定，返回一个**策略枚举**，
 * 组件只按策略分派。</p>
 *
 * <p><b>RTSP 的硬约束</b>：浏览器没有 TCP socket，{@code rtsp://} 无法直连，WASM 也
 * 解决不了（ffmpeg.wasm 同样开不了 TCP）。因此 {@link StreamStrategy} 里 RTSP 只有
 * {@code rtsp-gateway} 一种可能：要么后端已把它转成 FLV/WebRTC/HLS，要么明确告知
 * 用户当前环境无法拉流。</p>
 */

/** 播放策略（播放器按这个分派，不再自行判断） */
export type StreamStrategy =
  /** HLS（m3u8），hls.js */
  | "hls"
  /** HTTP/WS-FLV，flv.js */
  | "flv"
  /** 浏览器原生可播的容器（mp4/webm/ogg） */
  | "native"
  /** 裸 H.264 码流（Annex B），WebCodecs / WASM */
  | "raw-h264"
  /** 裸 H.265/HEVC 码流，WebCodecs / WASM */
  | "raw-h265"
  /** RTSP：必须经服务端网关，前端不可直连 */
  | "rtsp-gateway"
  /** 无法识别 */
  | "unknown";

/** 判定结果 */
export interface StreamPlan {
  /** 实际得到的播放策略 */
  strategy: StreamStrategy;
  /** 归一化后的协议名（用于界面展示） */
  protocol: string;
  /** 传给播放器的地址（RTSP 时保持原样，供调用方决定是否请求网关） */
  url: string;
  /** 给用户看的说明（未知/受限时非空） */
  note?: string;
}

/**
 * RTSP 网关配置。
 *
 * <p>浏览器没有 TCP，{@code rtsp://} 必须由服务端转流。网关通常有两种形态，都能用
 * 一个模板表达：</p>
 * <ul>
 *   <li>转换型：{@code http://gw:8080/rtsp?url={url}} → 返回 HTTP-FLV；</li>
 *   <li>拉流型：{@code http://gw:8080/live/{url}.flv}。</li>
 * </ul>
 *
 * <p>{@code {url}} 占位符会被替换为**经过 encodeURIComponent 的完整 rtsp 地址**，
 * 避免 query 里的 {@code &}、{@code ?} 破坏网关参数。</p>
 */
export interface RtspGateway {
  /** 网关类型；模板型直接替换 {url}，go2rtc 型先创建流再取播放地址 */
  kind?: "template" | "go2rtc";
  /** 地址模板，必须包含 {@code {url}} 占位符 */
  template?: string;
  /** go2rtc API 地址，如 {@code http://127.0.0.1:1984} */
  baseUrl?: string;
  /** 网关输出的协议（决定用哪个播放器） */
  protocol: "flv" | "hls" | "mp4";
}

/** 协议别名 → 归一化名（兼容后端的各种写法） */
const ALIASES: Record<string, string> = {
  hls: "hls",
  m3u8: "hls",
  flv: "flv",
  httpflv: "flv",
  http_flv: "flv",
  wsflv: "flv",
  ws_flv: "flv",
  ws: "flv",
  rtsp: "rtsp",
  rtsps: "rtsp",
  webrtc: "webrtc",
  rtc: "webrtc",
  mp4: "mp4",
  h264: "h264",
  "264": "h264",
  avc: "h264",
  h265: "h265",
  hevc: "h265",
  "265": "h265",
};

/** 从 URL 的 path/query 里取扩展名 */
function extOf(url: string): string {
  const clean = url.split("#")[0].split("?")[0];
  const m = /\.([a-z0-9]{1,5})$/i.exec(clean);
  return m ? m[1].toLowerCase() : "";
}

/**
 * 判定一个流地址该怎么播。
 *
 * @param url    流地址（可能来自后端，也可能是用户填入）
 * @param hint   后端声明的协议（可选；与 URL 冲突时以 URL 的 scheme 为准）
 * @returns 播放策略与说明
 */
export function planStream(
  url: string,
  hint?: string,
  opts?: { gateway?: RtspGateway },
): StreamPlan {
  const raw = (url ?? "").trim();
  if (!raw) return { strategy: "unknown", protocol: "none", url: raw, note: "未提供流地址" };

  const scheme = (/^([a-z][a-z0-9+.-]*):\/\//i.exec(raw)?.[1] ?? "").toLowerCase();
  const ext = extOf(raw);
  const hinted = ALIASES[(hint ?? "").toLowerCase()] ?? "";

  // scheme 优先：rtsp 永远是网关问题，与后端声明的协议无关
  if (scheme === "rtsp" || scheme === "rtsps" || hinted === "rtsp") {
    const gw = opts?.gateway;
    // 配了模板就改写地址，交给对应播放器；go2rtc 型需要先创建流，返回网关策略让调用方处理
    if (gw?.kind !== "go2rtc" && gw?.template?.includes("{url}")) {
      const proxied = gw.template.replace("{url}", encodeURIComponent(raw));
      const strategy: StreamStrategy =
        gw.protocol === "hls" ? "hls" : gw.protocol === "flv" ? "flv" : "native";
      return {
        strategy,
        protocol: "rtsp",
        url: proxied,
        note: "已通过服务端网关转流",
      };
    }
    return {
      strategy: "rtsp-gateway",
      protocol: "rtsp",
      url: raw,
      note: "RTSP 无法由浏览器直连，需服务端转成 FLV / WebRTC / HLS 后播放",
    };
  }

  const hintedRaw = hinted === "h264" || hinted === "h265";

  if (ext === "m3u8" || hinted === "hls") {
    return { strategy: "hls", protocol: "hls", url: raw };
  }
  // 裸流优先于 ws://：WebSocket 上既可能跑 FLV，也可能直接跑 Annex B 码流，
  // 有 h264/h265 提示时必须按裸流处理，否则会被误判成 flv。
  if (!hintedRaw && (ext === "flv" || scheme === "ws" || scheme === "wss" || hinted === "flv")) {
    return { strategy: "flv", protocol: "flv", url: raw };
  }
  if (ext === "h264" || ext === "264" || ext === "avc" || hinted === "h264") {
    return { strategy: "raw-h264", protocol: "h264", url: raw };
  }
  if (ext === "h265" || ext === "265" || ext === "hevc" || hinted === "h265") {
    return { strategy: "raw-h265", protocol: "h265", url: raw };
  }
  if (hinted === "webrtc" || ext === "mp4" || ext === "webm" || ext === "ogg" || ext === "m4v") {
    // WebRTC 需要 RTCPeerConnection 协商，这里只标注为 native（调用方需另接）
    return {
      strategy: "native",
      protocol: hinted === "webrtc" ? "webrtc" : "native",
      url: raw,
      ...(hinted === "webrtc" ? { note: "WebRTC 需要信令协商，当前仅标记为原生通道" } : {}),
    };
  }

  return {
    strategy: "unknown",
    protocol: hinted || "unknown",
    url: raw,
    note: `无法识别的流地址：${raw.slice(0, 80)}`,
  };
}
