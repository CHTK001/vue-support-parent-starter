/**
 * 裸流装配器：把任意切分的字节块还原成「可解码帧」。
 *
 * <p>为什么要独立于播放器：WebSocket / fetch 给到的数据块边界与 NAL 边界**毫无关系**
 * （一个 chunk 可能只有半个 NAL，也可能一次塞进十几个）。装配器负责缓冲、切分、
 * 收集参数集、生成解码配置和递增时间戳；播放器只负责把帧喂给 WebCodecs。</p>
 *
 * <p>这样拆分的价值是**可单测**：不依赖 DOM/WebCodecs，纯字节进、帧出。</p>
 */

import {
  buildAvcC,
  buildHvcC,
  codecString,
  type CodecFamily,
  type ParameterSets,
  splitAnnexB,
} from "./annexb";

/** 一帧可解码数据 */
export interface AssembledFrame {
  /** 该帧的 NAL 字节（含 NAL 头，不含起始码） */
  data: Uint8Array;
  /** 是否关键帧（IDR / IRAP） */
  key: boolean;
  /** 显示时间戳（微秒） */
  timestampUs: number;
  /** 名义时长（微秒） */
  durationUs: number;
}

/** WebCodecs 的解码配置（只保留本项目用到的字段，避免依赖 DOM 类型） */
export interface DecoderConfigLike {
  codec: string;
  description?: Uint8Array;
}

/** 起始码扫描结果 */
interface StartCode {
  at: number;
  len: number;
}

/** 找出所有 Annex B 起始码 */
function findStartCodes(buf: Uint8Array): StartCode[] {
  const out: StartCode[] = [];
  for (let i = 0; i + 2 < buf.length; i++) {
    if (buf[i] !== 0 || buf[i + 1] !== 0) continue;
    if (buf[i + 2] === 1) {
      out.push({ at: i, len: 3 });
      i += 2;
    } else if (i + 3 < buf.length && buf[i + 2] === 0 && buf[i + 3] === 1) {
      out.push({ at: i, len: 4 });
      i += 3;
    }
  }
  return out;
}

/** H.264 的 VCL NAL：1 非 IDR 片、5 IDR 片 */
function isH264Slice(data: Uint8Array): { vcl: boolean; key: boolean } {
  const t = data[0] & 0x1f;
  return { vcl: t === 1 || t === 5, key: t === 5 };
}

/** H.265 的 VCL NAL：type < 32；16–21 为 IRAP（可独立解码） */
function isH265Slice(data: Uint8Array): { vcl: boolean; key: boolean } {
  const t = (data[0] >> 1) & 0x3f;
  return { vcl: t >= 0 && t <= 31, key: t >= 16 && t <= 21 };
}

/**
 * 裸流装配器。
 *
 * <p>用法：不断 {@link push} 收到的字节块，拿到返回的帧就立刻解码；流结束时调用
 * {@link flush} 把缓冲里最后一帧吐出来。</p>
 */
export class ElementaryStreamAssembler {
  /** 未成帧的尾部字节 */
  private buf: Uint8Array = new Uint8Array(0);
  private family: CodecFamily | null;
  private params: ParameterSets = {};
  private configCache: DecoderConfigLike | null = null;
  private frameIndex = 0;
  private readonly fps: number;

  /**
   * @param opts.fps    帧率（裸流没有时间戳，按它合成；默认 25）
   * @param opts.family 已知编码族（未知时从参数集自动识别）
   */
  constructor(opts?: { fps?: number; family?: CodecFamily }) {
    this.fps = Math.max(1, Math.min(120, opts?.fps ?? 25));
    this.family = opts?.family ?? null;
  }

  /** 已识别/指定的编码族 */
  get codecFamily(): CodecFamily | null {
    return this.family;
  }

  /** 当前解码配置（参数集齐了才会非空） */
  get config(): DecoderConfigLike | null {
    return this.configCache;
  }

  /** 已产出的帧数 */
  get frames(): number {
    return this.frameIndex;
  }

  /** 重置（换流时调用） */
  reset(): void {
    this.buf = new Uint8Array(0);
    this.params = {};
    this.configCache = null;
    this.frameIndex = 0;
  }

  /**
   * 追加一段字节，返回本次能完整成帧的数据。
   *
   * @param chunk 新到的字节块（边界任意）
   * @returns 可解码帧（可能为空）
   */
  push(chunk: Uint8Array): AssembledFrame[] {
    if (chunk.length === 0) return [];

    // 拼接未成帧的尾巴
    if (this.buf.length === 0) {
      this.buf = chunk;
    } else {
      const merged = new Uint8Array(this.buf.length + chunk.length);
      merged.set(this.buf, 0);
      merged.set(chunk, this.buf.length);
      this.buf = merged;
    }

    const starts = findStartCodes(this.buf);
    if (starts.length < 2) {
      // 还没有下一个起始码：无法判定上一帧是否结束
      return [];
    }

    // 最后一个起始码之后的数据是不完整的，留到下次
    const cut = starts[starts.length - 1].at;
    const complete = this.buf.subarray(0, cut);
    const rest = this.buf.subarray(cut);
    this.buf = rest.slice();

    return this.consume(complete);
  }

  /** 流结束：把缓冲里的最后一帧吐出来 */
  flush(): AssembledFrame[] {
    if (this.buf.length === 0) return [];
    const tail = this.buf;
    this.buf = new Uint8Array(0);
    return this.consume(tail);
  }

  /** 解析一段「NAL 边界完整」的字节 */
  private consume(bytes: Uint8Array): AssembledFrame[] {
    const nals = splitAnnexB(bytes);
    if (nals.length === 0) return [];

    const out: AssembledFrame[] = [];
    for (const nal of nals) {
      if (!this.family) {
        this.family = this.guessFamily(nal.data);
      }
      if (!this.family) continue;

      const h265 = this.family === "h265";
      const head = nal.data[0];
      const type = h265 ? (head >> 1) & 0x3f : head & 0x1f;

      // 参数集
      if (h265) {
        if (type === 32) this.params.vps = nal.data;
        else if (type === 33) this.params.sps = nal.data;
        else if (type === 34) this.params.pps = nal.data;
      } else {
        if (type === 7) this.params.sps = nal.data;
        else if (type === 8) this.params.pps = nal.data;
      }
      if (!this.configCache) this.tryBuildConfig();

      const slice = h265 ? isH265Slice(nal.data) : isH264Slice(nal.data);
      if (!slice.vcl) continue;

      const durationUs = Math.round(1_000_000 / this.fps);
      out.push({
        data: nal.data,
        key: slice.key,
        timestampUs: this.frameIndex * durationUs,
        durationUs,
      });
      this.frameIndex++;
    }
    return out;
  }

  /** 依据首个 NAL 猜编码族（H.265 的 SPS 类型为 33，H.264 为 7，不会混淆） */
  private guessFamily(data: Uint8Array): CodecFamily | null {
    if (data.length === 0) return null;
    const h265Type = (data[0] >> 1) & 0x3f;
    if (h265Type === 33) return "h265";
    if ((data[0] & 0x1f) === 7) return "h264";
    return null;
  }

  /** 参数集齐全时构建解码配置 */
  private tryBuildConfig(): void {
    if (!this.family) return;
    const { sps, pps, vps } = this.params;
    try {
      if (this.family === "h264" && sps && pps) {
        this.configCache = {
          codec: codecString("h264", sps),
          description: buildAvcC(sps, pps),
        };
      } else if (this.family === "h265" && sps && pps && vps) {
        this.configCache = {
          codec: codecString("h265", sps),
          description: buildHvcC(vps, sps, pps),
        };
      }
    } catch {
      // 参数集残缺：保持 null，等后续 NAL 补齐
    }
  }
}
