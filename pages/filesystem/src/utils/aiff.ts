/**
 * AIFF / AIFF-C 音频转 WAV（PCM）工具。
 *
 * <p>浏览器原生 {@code <audio>} 只能解 WAV / MP3 / AAC / OGG 等容器，
 * 对 AIFF（.aiff / .aif）与 AIFF-C（.aifc）一律报「不支持」。媒体预览面板
 * 对这两类扩展名取回字节后调用 {@link aiffToWavBlob} 转成 WAV，再交给
 * {@code <audio>} 播放，避免「能下载不能播」。</p>
 *
 * <p>AIFF 全部按<b>大端</b>存储；WAV 按<b>小端</b>。COMM 里的采样率是
 * 80-bit IEEE 754 扩展精度（explicit integer bit，偏移 16383），
 * {@link readExtendedFloat} 负责换算成普通 number。</p>
 *
 * <p>仅支持未压缩 PCM：AIFF 的 {@code twos}（有符号 8/16/24/32 位）与
 * AIFF-C 的 {@code NONE}（大端）/ {@code sowt}（小端，无需换序）。
 * 其它压缩（ima4 / ulaw / alaw / float…）无法无损转成 PCM，直接抛错，
 * 由面板走「无法预览」提示，不产出坏音频。</p>
 */

/** AIFF 块头（4 字节 ID + 4 字节大端长度） */
const CHUNK_HEADER = 8;

/**
 * 读取 80-bit IEEE 754 扩展精度浮点（AIFF 采样率）。
 *
 * <p>布局：1 符号位 + 15 指数位（偏移 16383）+ 64 位尾数（含显式整数位）。
 * 值 = (-1)^sign * 2^(exp-16383) * (mantissa / 2^63)。</p>
 *
 * @param view 以 AIFF 起始偏移定位的 DataView
 * @param offset 采样率字段起始偏移
 * @returns 采样率（Hz）；非规格化 / 全零返回 0
 */
function readExtendedFloat(view: DataView, offset: number): number {
  const sign = view.getUint8(offset) & 0x80 ? -1 : 1;
  const exponent = view.getUint16(offset, false) & 0x7fff;
  let mantissa = 0n;
  for (let i = 0; i < 8; i++) {
    mantissa = (mantissa << 8n) | BigInt(view.getUint8(offset + 2 + i));
  }
  if (exponent === 0 && mantissa === 0n) return 0;
  if (exponent === 0x7fff) return sign * Infinity;
  const value = sign * 2 ** (exponent - 16383) * Number(mantissa) / 2 ** 63;
  return value;
}

/** 小端 16 位 */
function writeU16LE(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

/** 小端 32 位 */
function writeU32LE(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value, true);
}

/** 四字符 ASCII 标签 */
function tag(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

/**
 * 把 AIFF / AIFF-C PCM 音频字节转成 WAV（PCM）Blob。
 *
 * @param bytes AIFF 文件字节
 * @param fileName 文件名（仅用于错误提示）
 * @returns WAV Blob（MIME {@code audio/wav}）
 * @throws 文件结构非法、采样率非法或压缩格式不支持时抛错
 */
export function aiffToWavBlob(bytes: Uint8Array, fileName: string): Blob {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < 12 || tag(view, 0) !== "FORM") {
    throw new Error(`${fileName}：不是有效的 AIFF 文件`);
  }
  const form = tag(view, 8);
  if (form !== "AIFF" && form !== "AIFC") {
    throw new Error(`${fileName}：不是 AIFF / AIFF-C 容器`);
  }

  let channels = 0;
  let bitsPerSample = 0;
  let sampleRate = 0;
  let compression = "NONE";
  let pcm: Uint8Array | null = null;

  // 从 12 起按大端块遍历；每块长度对齐到偶数
  let pos = 12;
  while (pos + CHUNK_HEADER <= bytes.byteLength) {
    const id = tag(view, pos);
    const size = view.getUint32(pos + 4, false);
    const body = pos + CHUNK_HEADER;
    if (id === "COMM") {
      channels = view.getInt32(body, false);
      // numSampleFrames 占 4 字节，此处不用
      bitsPerSample = view.getInt16(body + 8, false);
      sampleRate = readExtendedFloat(view, body + 10);
      if (form === "AIFC" && size >= 18) {
        compression = tag(view, body + 18);
      }
    } else if (id === "SSND") {
      const blockOffset = view.getUint32(body, false);
      const blockSize = view.getUint32(body + 4, false);
      // 数据起点 = 块体 + offset；实际样本长度 = size - 8 - blockSize
      const dataStart = body + CHUNK_HEADER + blockOffset;
      const dataLen = Math.max(0, size - CHUNK_HEADER - blockSize);
      pcm = bytes.subarray(dataStart, dataStart + dataLen);
    }
    pos = body + size + (size & 1);
  }

  if (!pcm || channels <= 0 || sampleRate <= 0 || bitsPerSample <= 0) {
    throw new Error(`${fileName}：AIFF 缺少 COMM / SSND 或参数非法`);
  }
  const bytesPerSample = bitsPerSample >> 3;
  if (bytesPerSample * 8 !== bitsPerSample || ![1, 2, 3, 4].includes(bytesPerSample)) {
    throw new Error(`${fileName}：不支持的位深 ${bitsPerSample}`);
  }

  // sowt 是小端 PCM，其余（AIFF / NONE / twos）是大端，需要按位深换序
  const needSwap = compression !== "sowt";
  const out = new Uint8Array(pcm.length);
  if (needSwap && bytesPerSample > 1) {
    for (let i = 0; i < pcm.length; i += bytesPerSample) {
      for (let b = 0; b < bytesPerSample; b++) {
        out[i + b] = pcm[i + bytesPerSample - 1 - b];
      }
    }
  } else {
    out.set(pcm);
  }

  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataLen = out.length;
  const riffSize = 36 + dataLen;
  const wav = new Uint8Array(8 + riffSize);
  const wv = new DataView(wav.buffer);

  // RIFF / WAVE
  wav.set([0x52, 0x49, 0x46, 0x46], 0); // 'RIFF'
  writeU32LE(wv, 4, riffSize);
  wav.set([0x57, 0x41, 0x56, 0x45], 8); // 'WAVE'
  // fmt
  wav.set([0x66, 0x6d, 0x74, 0x20], 12); // 'fmt '
  writeU32LE(wv, 16, 16);
  writeU16LE(wv, 20, 1); // PCM
  writeU16LE(wv, 22, channels);
  writeU32LE(wv, 24, Math.round(sampleRate));
  writeU32LE(wv, 28, Math.round(byteRate));
  writeU16LE(wv, 32, blockAlign);
  writeU16LE(wv, 34, bitsPerSample);
  // data
  wav.set([0x64, 0x61, 0x74, 0x61], 36); // 'data'
  writeU32LE(wv, 40, dataLen);
  wav.set(out, 44);

  return new Blob([wav], { type: "audio/wav" });
}
