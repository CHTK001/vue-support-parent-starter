/**
 * MD5（RFC 1321）增量实现。
 *
 * <p>为什么不用现成库：`pages/filesystem` 的依赖里没有 md5 包，而 `ts-md5`
 * 只装在了宿主 app 上；为一个 90 行的算法去动 monorepo 依赖与 lockfile 不划算。
 * 这里按 RFC 逐块实现，支持分片 append，大文件可以按 4MB 边读边算，不会把
 * 整个文件读进内存。</p>
 *
 * <p>用途：上传前算本地 MD5、上传后与后端返回值比对，并把结果显示到队列行上。</p>
 */

/** 每轮左移位数 */
const S: readonly number[] = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

/** K[i] = floor(abs(sin(i + 1)) * 2^32) */
const K: readonly number[] = (() => {
  const table: number[] = [];
  for (let i = 0; i < 64; i += 1) {
    table.push(Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0);
  }
  return table;
})();

/**
 * 32 位循环左移
 *
 * @param x 值
 * @param c 位数
 * @returns 结果
 */
function rol(x: number, c: number): number {
  return ((x << c) | (x >>> (32 - c))) >>> 0;
}

/**
 * 增量 MD5
 *
 * <p>用法：{@code const m = new Md5(); m.append(bytes); m.hex();}，
 * 可分多次 append，最后一次性取 hex。</p>
 */
export class Md5 {
  /** 累计的字节（未满 64 字节的尾巴留到下次） */
  private pending: Uint8Array = new Uint8Array(0);

  /** 已处理的字节数（用于长度填充，单位字节） */
  private totalBytes = 0;

  /** A/B/C/D 四个寄存器 */
  private a = 0x67452301;

  private b = 0xefcdab89;

  private c = 0x98badcfe;

  private d = 0x10325476;

  /**
   * 追加一段字节
   *
   * @param data 字节
   * @returns this（便于链式调用）
   */
  append(data: Uint8Array): this {
    if (!data.length) {
      return this;
    }
    this.totalBytes += data.length;
    const merged = new Uint8Array(this.pending.length + data.length);
    merged.set(this.pending, 0);
    merged.set(data, this.pending.length);

    let offset = 0;
    while (merged.length - offset >= 64) {
      this.block(merged, offset);
      offset += 64;
    }
    this.pending = merged.slice(offset);
    return this;
  }

  /**
   * 结束并返回 32 位小写十六进制摘要
   *
   * @returns md5 hex
   */
  hex(): string {
    const bitLen = this.totalBytes * 8;
    const padLen = this.pending.length < 56 ? 56 - this.pending.length : 120 - this.pending.length;
    const tail = new Uint8Array(this.pending.length + padLen + 8);
    tail.set(this.pending, 0);
    tail[this.pending.length] = 0x80;
    // 长度用小端 64 位写入（JS 数字只有 53 位精度，超大文件按低 32 位 + 高位补齐）
    const low = bitLen >>> 0;
    const high = Math.floor(bitLen / 4294967296) >>> 0;
    const lenPos = tail.length - 8;
    tail[lenPos] = low & 0xff;
    tail[lenPos + 1] = (low >>> 8) & 0xff;
    tail[lenPos + 2] = (low >>> 16) & 0xff;
    tail[lenPos + 3] = (low >>> 24) & 0xff;
    tail[lenPos + 4] = high & 0xff;
    tail[lenPos + 5] = (high >>> 8) & 0xff;
    tail[lenPos + 6] = (high >>> 16) & 0xff;
    tail[lenPos + 7] = (high >>> 24) & 0xff;

    for (let i = 0; i < tail.length; i += 64) {
      this.block(tail, i);
    }
    this.pending = new Uint8Array(0);

    const words = [this.a, this.b, this.c, this.d];
    let out = "";
    for (const w of words) {
      for (let i = 0; i < 4; i += 1) {
        out += ((w >>> (i * 8)) & 0xff).toString(16).padStart(2, "0");
      }
    }
    return out;
  }

  /**
   * 处理一个 64 字节块
   *
   * @param buf 数据
   * @param offset 起始下标
   */
  private block(buf: Uint8Array, offset: number): void {
    const m: number[] = [];
    for (let i = 0; i < 16; i += 1) {
      const j = offset + i * 4;
      m.push((buf[j] | (buf[j + 1] << 8) | (buf[j + 2] << 16) | (buf[j + 3] << 24)) >>> 0);
    }
    let a = this.a;
    let b = this.b;
    let c = this.c;
    let d = this.d;

    for (let i = 0; i < 64; i += 1) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const tmp = d;
      d = c;
      c = b;
      const sum = (a + f + K[i] + m[g]) >>> 0;
      b = (b + rol(sum, S[i])) >>> 0;
      a = tmp;
    }

    this.a = (this.a + a) >>> 0;
    this.b = (this.b + b) >>> 0;
    this.c = (this.c + c) >>> 0;
    this.d = (this.d + d) >>> 0;
  }
}

/** 分片大小：4MB，兼顾内存与调用次数 */
const CHUNK_SIZE = 4 * 1024 * 1024;

/**
 * 计算 Blob / File 的 MD5（分片读取，不整包进内存）
 *
 * @param file 文件
 * @param onProgress 进度回调（0~100）
 * @returns 小写 hex
 */
export async function md5OfBlob(
  file: Blob,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const md5 = new Md5();
  let offset = 0;
  while (offset < file.size) {
    const end = Math.min(offset + CHUNK_SIZE, file.size);
    const buf = await file.slice(offset, end).arrayBuffer();
    md5.append(new Uint8Array(buf));
    offset = end;
    onProgress?.(file.size ? Math.round((offset / file.size) * 100) : 100);
  }
  onProgress?.(100);
  return md5.hex();
}

/**
 * 计算字节的 MD5（小数据用）
 *
 * @param data 字节
 * @returns 小写 hex
 */
export function md5OfBytes(data: Uint8Array): string {
  return new Md5().append(data).hex();
}
