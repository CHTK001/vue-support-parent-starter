/**
 * 裸流播放器：Annex B 字节 → WebCodecs → canvas。
 *
 * <p>为什么用 WebCodecs 而不是 WASM：H.264/H.265 在 Chromium 系浏览器已有原生
 * 硬解（Edge 155 支持），零下载、零 CPU 软解开销；WASM 只在「系统缺 HEVC 解码器」
 * 时才需要，属于兜底，不应作为默认路径。</p>
 *
 * <p>数据来源两种：HTTP(S)（fetch 流式读）与 WebSocket（二进制帧）。两者都只是
 * 「不断送来字节」，切帧/参数集/时间戳全部交给 {@link ElementaryStreamAssembler}。</p>
 */

import { ElementaryStreamAssembler, type AssembledFrame } from "./elementaryStream";
import { toLengthPrefixed, type CodecFamily } from "./annexb";

/** 播放器状态回调 */
export interface PlayerHooks {
  /** 解码出首帧 */
  onFirstFrame?: () => void;
  /** 统计（每帧回调，调用方自行节流） */
  onFrame?: (f: { frames: number; width: number; height: number; codec: string }) => void;
  /** 错误 */
  onError?: (e: Error) => void;
}

/** WebCodecs 的最小类型（避免依赖 @types/dom-webcodecs） */
interface DecoderLike {
  configure(config: Record<string, unknown>): void;
  decode(chunk: unknown): void;
  flush(): Promise<void>;
  close(): void;
  decodeQueueSize: number;
}

/** 构造 EncodedVideoChunk 的全局构造器 */
type ChunkCtor = new (init: {
  type: "key" | "delta";
  timestamp: number;
  duration?: number;
  data: Uint8Array;
}) => unknown;

/** 取全局构造器（不支持时返回 undefined，便于上层给可读提示） */
export function webCodecsAvailable(): boolean {
  const g = globalThis as unknown as { VideoDecoder?: unknown };
  return typeof g.VideoDecoder === "function";
}

/**
 * 裸流播放器（H.264 / H.265）。
 *
 * <p>一个实例对应一个 canvas 与一条流；换流请先 {@link stop}。</p>
 */
export class ElementaryStreamPlayer {
  private readonly canvas: HTMLCanvasElement;
  private readonly hooks: PlayerHooks;
  private readonly assembler: ElementaryStreamAssembler;
  private decoder: DecoderLike | null = null;
  private chunkCtor: ChunkCtor | null = null;
  private queue: AssembledFrame[] = [];
  private stopped = false;
  private configured = false;
  private configuring = false;
  private gotFirstFrame = false;
  private ws: WebSocket | null = null;
  private abort: AbortController | null = null;
  private drainTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * @param canvas 输出画布
   * @param opts   帧率与回调（裸流无时间戳，帧率用于合成时间轴）
   */
  constructor(
    canvas: HTMLCanvasElement,
    opts?: { fps?: number; family?: CodecFamily; hooks?: PlayerHooks },
  ) {
    this.canvas = canvas;
    this.hooks = opts?.hooks ?? {};
    this.assembler = new ElementaryStreamAssembler({ fps: opts?.fps, family: opts?.family });
  }

  /** 当前识别的编码族 */
  get family(): CodecFamily | null {
    return this.assembler.codecFamily;
  }

  /**
   * 从 HTTP(S) 地址拉裸流（也适用于 static 的 .h264/.h265 文件）。
   *
   * @param url 地址
   */
  async startHttp(url: string): Promise<void> {
    this.abort = new AbortController();
    try {
      this.preflight();
      const res = await fetch(url, { signal: this.abort.signal });
      if (!res.ok) throw new Error(`读取流失败：HTTP ${res.status}`);
      if (!res.body) throw new Error("响应不支持流式读取");
      const reader = res.body.getReader();
      while (!this.stopped) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) this.push(value);
      }
      if (!this.stopped) this.finish();
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") this.fail(e as Error);
    }
  }

  /**
   * 从 WebSocket 拉裸流（每个二进制帧交给装配器，允许跨帧边界）。
   *
   * @param url ws:// 或 wss://
   */
  startWs(url: string): void {
    try {
      this.preflight();
      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      this.ws = ws;
      ws.onmessage = (ev: MessageEvent) => {
        if (this.stopped) return;
        if (ev.data instanceof ArrayBuffer) this.push(new Uint8Array(ev.data));
        else if (typeof ev.data === "string") {
          // 文本帧不参与解码（部分网关会先发 JSON 元信息）
        }
      };
      ws.onerror = () => this.fail(new Error("WebSocket 连接失败"));
      ws.onclose = () => {
        if (!this.stopped) this.finish();
      };
    } catch (e) {
      this.fail(e as Error);
    }
  }

  /** 追加一段字节（外部自行拉流时使用） */
  push(chunk: Uint8Array): void {
    if (this.stopped) return;
    const frames = this.assembler.push(chunk);
    if (frames.length) {
      this.queue.push(...frames);
      this.drain();
    }
  }

  /** 流结束：吐出最后一帧并 flush 解码器 */
  finish(): void {
    if (this.stopped) return;
    const tail = this.assembler.flush();
    if (tail.length) {
      this.queue.push(...tail);
      this.drain();
    }
    void this.decoder?.flush().catch(() => undefined);
  }

  /** 停止并释放资源 */
  stop(): void {
    this.stopped = true;
    if (this.drainTimer) {
      clearTimeout(this.drainTimer);
      this.drainTimer = null;
    }
    this.abort?.abort();
    this.abort = null;
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
    this.ws = null;
    try {
      this.decoder?.close();
    } catch {
      // ignore
    }
    this.decoder = null;
    this.queue = [];
  }

  /** 环境预检：WebCodecs 与 EncodedVideoChunk 必须存在 */
  private preflight(): void {
    if (!webCodecsAvailable()) {
      throw new Error("当前浏览器不支持 WebCodecs，无法解码裸流");
    }
    const g = globalThis as unknown as { EncodedVideoChunk?: ChunkCtor };
    if (typeof g.EncodedVideoChunk !== "function") {
      throw new Error("当前浏览器缺少 EncodedVideoChunk");
    }
    this.chunkCtor = g.EncodedVideoChunk;
  }

  /** 参数集就绪后建立解码器（先探测 codec 是否被支持） */
  private async ensureDecoder(): Promise<boolean> {
    if (this.decoder) return true;
    const config = this.assembler.config;
    if (!config) return false;
    if (this.configuring) return false;
    this.configuring = true;
    try {
      const g = globalThis as unknown as {
        VideoDecoder: {
          new (init: {
            output: (frame: VideoFrameLike) => void;
            error: (e: Error) => void;
          }): DecoderLike;
          isConfigSupported?: (c: unknown) => Promise<{ supported: boolean }>;
        };
      };
      // 先探测：H.265 在没装 HEVC 扩展的系统上会「静默不支持」，必须给出可读结论
      if (typeof g.VideoDecoder.isConfigSupported === "function") {
        const probe = await g.VideoDecoder.isConfigSupported({
          codec: config.codec,
          description: config.description,
        });
        if (!probe.supported) {
          throw new Error(
            `当前环境不支持解码 ${config.codec}（H.265 需要系统 HEVC 解码器或 WASM 软解）`,
          );
        }
      }
      const decoder = new g.VideoDecoder({
        output: (frame) => this.render(frame),
        error: (e) => this.fail(e),
      });
      decoder.configure({
        codec: config.codec,
        description: config.description,
        optimizeForLatency: true,
      });
      this.decoder = decoder;
      this.configured = true;
      return true;
    } catch (e) {
      this.fail(e as Error);
      return false;
    } finally {
      this.configuring = false;
    }
  }

  /** 把队列里的帧喂给解码器（带背压） */
  private drain(): void {
    if (this.stopped) return;
    if (!this.decoder) {
      // 解码器还没建（等参数集/探测 codec），建好后再继续
      void this.ensureDecoder().then((ok) => {
        if (ok) this.drain();
      });
      return;
    }
    const decoder = this.decoder;
    const ctor = this.chunkCtor;
    if (!decoder || !ctor) return;

    while (this.queue.length > 0 && decoder.decodeQueueSize < 8) {
      const f = this.queue.shift() as AssembledFrame;
      decoder.decode(
        new ctor({
          type: f.key ? "key" : "delta",
          timestamp: f.timestampUs,
          duration: f.durationUs,
          // 带 description 时必须是 AVCC 长度前缀，不能是 Annex B 起始码
          data: toLengthPrefixed(f.data),
        }),
      );
    }
    if (this.queue.length > 0) {
      this.drainTimer = setTimeout(() => this.drain(), 16);
    }
  }

  /** 绘制一帧 */
  private render(frame: VideoFrameLike): void {
    try {
      if (this.canvas.width !== frame.displayWidth) this.canvas.width = frame.displayWidth;
      if (this.canvas.height !== frame.displayHeight) this.canvas.height = frame.displayHeight;
      const ctx = this.canvas.getContext("2d");
      ctx?.drawImage(frame as unknown as CanvasImageSource, 0, 0, frame.displayWidth, frame.displayHeight);
      if (!this.gotFirstFrame) {
        this.gotFirstFrame = true;
        this.hooks.onFirstFrame?.();
      }
      this.hooks.onFrame?.({
        frames: this.assembler.frames,
        width: frame.displayWidth,
        height: frame.displayHeight,
        codec: this.assembler.config?.codec ?? "",
      });
    } finally {
      frame.close();
    }
  }

  /** 报错并自停 */
  private fail(e: Error): void {
    if (this.stopped) return;
    this.hooks.onError?.(e);
    this.stop();
  }
}

/** VideoFrame 的最小类型 */
interface VideoFrameLike {
  displayWidth: number;
  displayHeight: number;
  close(): void;
}
