/**
 * 裸流播放器：Annex B 字节 → WebCodecs / libde265 WASM → canvas。
 *
 * <p>为什么优先用 WebCodecs 而不是 WASM：H.264/H.265 在 Chromium 系浏览器已有原生
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
  /** 实际采用的解码方式（WebCodecs / WASM），首帧前可能多次调用 */
  onMode?: (mode: "webcodecs" | "wasm") => void;
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
  private wasmWorker: Worker | null = null;
  private wasmWorkerReady = false;
  private wasmFailed = false;
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
    if (this.wasmWorkerReady && this.wasmWorker) {
      this.wasmWorker.postMessage({ type: "flush" });
    }
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
    try {
      this.wasmWorker?.terminate();
    } catch {
      // ignore
    }
    this.wasmWorker = null;
    this.wasmWorkerReady = false;
    this.wasmFailed = false;
    this.queue = [];
  }

  /** 环境预检：WebCodecs 缺失时不立即失败，H.265 还有 WASM 软解可降级 */
  private preflight(): void {
    const g = globalThis as unknown as { EncodedVideoChunk?: ChunkCtor };
    if (typeof g.EncodedVideoChunk === "function") {
      this.chunkCtor = g.EncodedVideoChunk;
    }
  }

  /** 参数集就绪后建立解码器（先探测 codec 是否被支持） */
  private async ensureDecoder(): Promise<boolean> {
    if (this.decoder) return true;
    const config = this.assembler.config;
    if (!config) return false;
    if (this.configuring) return false;
    this.configuring = true;
    try {
      // 先探测 WebCodecs；H.265 探测失败时降级 libde265 WASM，不让整路直接断掉。
      const probe = await probeSupport(config.codec, config.description);
      if (!probe.supported) {
        if (this.assembler.codecFamily !== "h265" || this.wasmFailed) {
          throw new Error(
            `当前环境不支持解码 ${config.codec}${
              this.assembler.codecFamily === "h265"
                ? "，且 WASM 软解不可用"
                : "（请使用支持该编码的浏览器）"
            }`,
          );
        }
        this.fallbackToWasm();
        return false;
      }
      if (!this.chunkCtor) {
        if (this.assembler.codecFamily === "h265") {
          this.fallbackToWasm();
          return false;
        }
        throw new Error("当前浏览器不支持 WebCodecs，无法解码裸流");
      }
      const g = globalThis as unknown as {
        VideoDecoder: {
          new (init: {
            output: (frame: VideoFrameLike) => void;
            error: (e: Error) => void;
          }): DecoderLike;
        };
      };
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
    if (this.wasmWorkerReady && this.wasmWorker) {
      while (this.queue.length > 0) {
        this.pushWasmFrame(this.queue.shift() as AssembledFrame);
      }
      return;
    }
    if (this.wasmWorker) {
      // WASM 初始化中：帧先留在队列，worker ready 后再继续
      return;
    }
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

  /** H.265 探测失败后的 WASM 软解降级：worker 懒加载 libde265 */
  private fallbackToWasm(): void {
    if (this.stopped || this.wasmFailed || this.wasmWorker) return;
    try {
      const worker = new Worker(new URL("../workers/hevcDecoder.worker.ts", import.meta.url), {
        type: "module",
      });
      this.wasmWorker = worker;
      worker.onmessage = (ev: MessageEvent<WasmWorkerMessage>) => this.onWasmMessage(ev);
      worker.onerror = (e) => {
        this.wasmFailed = true;
        this.fail(new Error(`H.265 WASM 软解 worker 失败：${e.message || "未知错误"}`));
      };
      worker.postMessage({ type: "init" });
    } catch (e) {
      this.wasmFailed = true;
      this.fail(e as Error);
    }
  }

  /** worker 消息：ready / 解码帧 / 错误 */
  private onWasmMessage(ev: MessageEvent<WasmWorkerMessage>): void {
    if (this.stopped) return;
    const msg = ev.data;
    if (msg.type === "ready") {
      this.wasmWorkerReady = true;
      this.hooks.onMode?.("wasm");
      this.drain();
    } else if (msg.type === "frame") {
      this.renderWasmFrame(msg.width, msg.height, msg.data);
    } else if (msg.type === "error") {
      this.wasmFailed = true;
      this.fail(new Error(msg.message));
    }
  }

  /** 把一帧（关键帧会带上 VPS/SPS/PPS）拼成 Annex B 后交给 WASM worker */
  private pushWasmFrame(f: AssembledFrame): void {
    const worker = this.wasmWorker;
    if (!worker) return;
    worker.postMessage({
      type: "frame",
      data: buildWasmAnnexB(f.key ? this.assembler.parameterSets : undefined, f.data),
      timestampUs: f.timestampUs,
    });
  }

  /** 把 WASM worker 解码出的 RGBA 画到 canvas */
  private renderWasmFrame(width: number, height: number, data: Uint8ClampedArray): void {
    try {
      if (this.canvas.width !== width) this.canvas.width = width;
      if (this.canvas.height !== height) this.canvas.height = height;
      const ctx = this.canvas.getContext("2d");
      if (ctx) {
        ctx.putImageData(
          new ImageData(data as unknown as Uint8ClampedArray<ArrayBuffer>, width, height),
          0,
          0,
        );
      }
      if (!this.gotFirstFrame) {
        this.gotFirstFrame = true;
        this.hooks.onFirstFrame?.();
      }
      this.hooks.onFrame?.({
        frames: this.assembler.frames,
        width,
        height,
        codec: this.assembler.config?.codec || "HEVC (WASM)",
      });
    } catch (e) {
      this.fail(e as Error);
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

/** libde265 worker 回传给主线程的消息 */
type WasmWorkerMessage =
  | { type: "ready" }
  | { type: "frame"; width: number; height: number; data: Uint8ClampedArray }
  | { type: "error"; message: string }
  | { type: "flushed" };

/** 参数集（WASM 软解时随关键帧喂给解码器） */
interface WasmParameterSets {
  vps?: Uint8Array;
  sps?: Uint8Array;
  pps?: Uint8Array;
}

/** 关键帧拼上 VPS/SPS/PPS，统一按 Annex B 起始码喂给 libde265 */
function buildWasmAnnexB(params: WasmParameterSets | undefined, nal: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [];
  if (params?.vps?.length) parts.push(params.vps);
  if (params?.sps?.length) parts.push(params.sps);
  if (params?.pps?.length) parts.push(params.pps);
  parts.push(nal);

  let total = 0;
  for (const part of parts) total += 4 + part.length;
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out[at++] = 0;
    out[at++] = 0;
    out[at++] = 0;
    out[at++] = 1;
    out.set(part, at);
    at += part.length;
  }
  return out;
}

/** WebCodecs 支持性探测；探测失败一律按不支持处理，H.265 会继续降级 WASM */
async function probeSupport(codec: string, description?: Uint8Array): Promise<{ supported: boolean }> {
  const g = globalThis as unknown as {
    VideoDecoder?: {
      isConfigSupported?: (c: unknown) => Promise<{ supported?: boolean }>;
    };
  };
  if (typeof g.VideoDecoder?.isConfigSupported !== "function") {
    // 老实现没有探测能力：H.264 交给 VideoDecoder 直接尝试，H.265 由上层 chunkCtor 分支决定是否降级
    return { supported: !!g.VideoDecoder };
  }
  try {
    const r = await g.VideoDecoder.isConfigSupported({ codec, description });
    return { supported: !!r?.supported };
  } catch {
    return { supported: false };
  }
}
