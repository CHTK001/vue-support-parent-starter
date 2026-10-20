/**
 * H.264 / H.265 裸流（Annex B）解析。
 *
 * <p>为什么需要：设备页除 HLS/FLV 外，还会直接拿到裸码流（WebSocket 或 HTTP 上的
 * {@code .h264/.h265}）。裸流没有容器描述，要交给 WebCodecs 的 {@code VideoDecoder}
 * 必须先自己做三件事：按起始码切 NAL、剔除防竞争字节、把 SPS/PPS/VPS 组装成
 * {@code description}（H.264 的 avcC / H.265 的 hvcC）。</p>
 *
 * <p><b>起始码</b>：{@code 00 00 01} 或 {@code 00 00 00 01}；两种都要认，且允许
 * 同一条消息里出现多次。</p>
 *
 * <p><b>防竞争字节</b>：码流里 {@code 00 00 03} 的 {@code 03} 是转义，解码前必须
 * 去掉，否则 SPS/PPS 长度会算错。</p>
 */

/** 一个 NAL 单元 */
export interface NalUnit {
  /** NAL 类型（已剥离起始码与防竞争字节） */
  type: number;
  /** 负载（含 NAL 头字节） */
  data: Uint8Array;
}

/** 参数集集合 */
export interface ParameterSets {
  vps?: Uint8Array;
  sps?: Uint8Array;
  pps?: Uint8Array;
}

/** 码流编码族 */
export type CodecFamily = "h264" | "h265";

/**
 * 按 Annex B 起始码切分 NAL。
 *
 * @param buf 一段 Annex B 字节（可以含多个 NAL）
 * @returns NAL 列表（已去防竞争字节）；没有起始码时返回空数组
 */
export function splitAnnexB(buf: Uint8Array): NalUnit[] {
  const nals: NalUnit[] = [];
  const starts: Array<{ at: number; len: number }> = [];

  for (let i = 0; i + 2 < buf.length; i++) {
    if (buf[i] !== 0 || buf[i + 1] !== 0) continue;
    if (buf[i + 2] === 1) {
      starts.push({ at: i, len: 3 });
      i += 2;
    } else if (i + 3 < buf.length && buf[i + 2] === 0 && buf[i + 3] === 1) {
      starts.push({ at: i, len: 4 });
      i += 3;
    }
  }
  if (starts.length === 0) return nals;

  for (let k = 0; k < starts.length; k++) {
    const from = starts[k].at + starts[k].len;
    const to = k + 1 < starts.length ? starts[k + 1].at : buf.length;
    if (to <= from) continue;
    const payload = stripEmulationPrevention(buf.subarray(from, to));
    if (payload.length === 0) continue;
    nals.push({ type: nalType(payload), data: payload });
  }
  return nals;
}

/** 去防竞争字节（00 00 03 → 00 00） */
export function stripEmulationPrevention(data: Uint8Array): Uint8Array {
  // 没有 03 时直接返回原视图，避免无谓拷贝
  let has = false;
  for (let i = 2; i < data.length; i++) {
    if (data[i] === 3 && data[i - 1] === 0 && data[i - 2] === 0) {
      has = true;
      break;
    }
  }
  if (!has) return data;

  const out = new Uint8Array(data.length);
  let w = 0;
  let zeros = 0;
  for (let i = 0; i < data.length; i++) {
    const b = data[i];
    if (zeros >= 2 && b === 3) {
      zeros = 0;
      continue;
    }
    out[w++] = b;
    zeros = b === 0 ? zeros + 1 : 0;
  }
  return out.subarray(0, w);
}

/**
 * 读 NAL 类型。
 *
 * @param data 已剥离起始码与防竞争字节的 NAL
 */
export function nalType(data: Uint8Array): number {
  if (data.length === 0) return -1;
  // 先用 H.264 的规则（低 5 位）；H.265 的高位特征在 classify 里再判
  return data[0] & 0x1f;
}

/**
 * 判断码流属于 H.264 还是 H.265。
 *
 * <p>依据 SPS 的 NAL 类型：H.264 为 7，H.265 为 33。两者在字节上恰好不会混淆，
 * 因为 H.265 的 SPS 首字节高 1 位必为 0（nal_unit_type 为 6 位、位于第 2–7 位）。</p>
 *
 * @param nals NAL 列表
 * @returns 无法判断时返回 null
 */
export function detectFamily(nals: NalUnit[]): CodecFamily | null {
  for (const n of nals) {
    const h265Type = (n.data[0] >> 1) & 0x3f;
    if (h265Type === 33) return "h265";
    if ((n.data[0] & 0x1f) === 7) return "h264";
  }
  return null;
}

/**
 * 从 NAL 列表里收集参数集。
 *
 * @param nals    NAL 列表
 * @param family  编码族
 * @returns 找到的 VPS/SPS/PPS（可能不全，调用方需自行校验）
 */
export function collectParameterSets(nals: NalUnit[], family: CodecFamily): ParameterSets {
  const out: ParameterSets = {};
  for (const n of nals) {
    if (family === "h264") {
      const t = n.data[0] & 0x1f;
      if (t === 7 && !out.sps) out.sps = n.data;
      if (t === 8 && !out.pps) out.pps = n.data;
    } else {
      const t = (n.data[0] >> 1) & 0x3f;
      if (t === 32 && !out.vps) out.vps = n.data;
      if (t === 33 && !out.sps) out.sps = n.data;
      if (t === 34 && !out.pps) out.pps = n.data;
    }
  }
  return out;
}

/** 写 16 位大端 */
function u16(v: number): number[] {
  return [(v >> 8) & 0xff, v & 0xff];
}

/**
 * 组装 H.264 的 avcC（AVCDecoderConfigurationRecord）。
 *
 * @param sps SPS
 * @param pps PPS
 * @returns avcC 字节
 */
export function buildAvcC(sps: Uint8Array, pps: Uint8Array): Uint8Array {
  if (sps.length < 4) throw new Error("SPS 过短，无法组装 avcC");
  const bytes = [
    1, // configurationVersion
    sps[1], // AVCProfileIndication
    sps[2], // profile_compatibility
    sps[3], // AVCLevelIndication
    0xff, // lengthSizeMinusOne = 3
    0xe1, // numOfSequenceParameterSets = 1
    ...u16(sps.length),
    ...Array.from(sps),
    1, // numOfPictureParameterSets
    ...u16(pps.length),
    ...Array.from(pps),
  ];
  return new Uint8Array(bytes);
}

/** 反转 32 位（HEVC codec string 的兼容位要求按位反转后输出） */
function reverseBits32(v: number): number {
  let r = 0;
  for (let i = 0; i < 32; i++) {
    r = (r << 1) | (v & 1);
    v >>>= 1;
  }
  return r >>> 0;
}

/**
 * 组装 H.265 的 hvcC（HEVCDecoderConfigurationRecord）。
 *
 * @param vps VPS
 * @param sps SPS
 * @param pps PPS
 * @returns hvcC 字节
 */
export function buildHvcC(vps: Uint8Array, sps: Uint8Array, pps: Uint8Array): Uint8Array {
  if (sps.length < 13) throw new Error("SPS 过短，无法组装 hvcC");
  const out: number[] = [
    1, // configurationVersion
    // general_profile_space(2) | tier(1) | profile_idc(5)
    sps[1],
    // general_profile_compatibility_flags (4)
    sps[2], sps[3], sps[4], sps[5],
    // general_constraint_indicator_flags (6)
    sps[6], sps[7], sps[8], sps[9], sps[10], sps[11],
    // general_level_idc
    sps[12],
  ];
  out.push(0xf0, 0x00); // min_spatial_segmentation_idc
  out.push(0xfc); // parallelismType
  out.push(0xfd); // chromaFormat = 1 (4:2:0)
  out.push(0xf8); // bitDepthLumaMinus8
  out.push(0xf8); // bitDepthChromaMinus8
  out.push(0x00, 0x00); // avgFrameRate
  out.push(0x0f); // lengthSizeMinusOne = 3（低 2 位）
  out.push(3); // numOfArrays

  const pushArray = (type: number, nal: Uint8Array): void => {
    out.push(type & 0x3f); // array_completeness=0 | NAL_unit_type
    out.push(...u16(1)); // numNalus
    out.push(...u16(nal.length));
    for (let i = 0; i < nal.length; i++) out.push(nal[i]);
  };
  pushArray(32, vps);
  pushArray(33, sps);
  pushArray(34, pps);

  return new Uint8Array(out);
}

/**
 * 把单个 NAL 包成 AVCC 长度前缀格式（4 字节大端长度 + NAL）。
 *
 * <p>WebCodecs 在配置里给了 {@code description}（avcC/hvcC）时，{@code EncodedVideoChunk}
 * 的数据必须是**长度前缀**而不是 Annex B 起始码；长度字段宽度由 avcC 的
 * {@code lengthSizeMinusOne} 决定，本实现统一用 4 字节（与 hvcC/avcC 里写的一致）。</p>
 *
 * @param nal        单个 NAL（不含起始码）
 * @param lengthSize 长度字段字节数（默认 4）
 * @returns 长度前缀后的字节
 */
export function toLengthPrefixed(nal: Uint8Array, lengthSize = 4): Uint8Array {
  const out = new Uint8Array(lengthSize + nal.length);
  const len = nal.length;
  if (lengthSize === 4) {
    out[0] = (len >>> 24) & 0xff;
    out[1] = (len >>> 16) & 0xff;
    out[2] = (len >>> 8) & 0xff;
    out[3] = len & 0xff;
  } else if (lengthSize === 2) {
    out[0] = (len >>> 8) & 0xff;
    out[1] = len & 0xff;
  } else {
    out[0] = len & 0xff;
  }
  out.set(nal, lengthSize);
  return out;
}

/**
 * 由参数集推导 WebCodecs 的 codec 字符串。
 *
 * @param family 编码族
 * @param sps    SPS
 * @returns 形如 {@code avc1.64001f} / {@code hvc1.1.6.L93.B0}
 */
export function codecString(family: CodecFamily, sps: Uint8Array): string {
  const hex2 = (v: number): string => v.toString(16).padStart(2, "0");
  if (family === "h264") {
    return `avc1.${hex2(sps[1])}${hex2(sps[2])}${hex2(sps[3])}`;
  }
  const space = (sps[1] >> 6) & 0x3;
  const tier = (sps[1] >> 5) & 0x1;
  const profile = sps[1] & 0x1f;
  const compat =
    ((sps[2] << 24) | (sps[3] << 16) | (sps[4] << 8) | sps[5]) >>> 0;
  const reversed = reverseBits32(compat).toString(16);
  const spaceCh = space === 0 ? "" : String.fromCharCode(64 + space);
  const level = sps[12];
  const constraints = [sps[6], sps[7], sps[8], sps[9], sps[10], sps[11]]
    .map(hex2)
    .join("")
    .replace(/(00)+$/, "");
  return `hvc1.${spaceCh}${profile}.${reversed}.${tier ? "H" : "L"}${level}${constraints ? "." + constraints : ""}`;
}
