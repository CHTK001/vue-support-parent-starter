/**
 * 会话 ID 哈希：地址栏不再明文暴露真实会话 ID（用户口径 2026-11-13）。
 *
 * 这里 MD5 只做「不可读化」，不是安全边界：
 *  - 正向：导航时把真实会话 ID 映射成 32 位十六进制串放进 URL（/chat/<md5>）；
 *  - 反向：进入页面时用本地会话表反查真实 ID（见 ChatPage.resolveSessionId）。
 * 项目没有引入哈希库，这里自带一份 MD5（RFC 1321），已按标准测试向量校验。
 */

/** 32 位十六进制串 = 已是哈希后的形式（区别于明文会话 ID / 'new-session'） */
export function isSessionHash(value: string | null | undefined): boolean {
  return !!value && /^[0-9a-f]{32}$/i.test(value);
}

/** 真实会话 ID → 地址栏用的哈希串。null/undefined 落到空串，由调用方兜底。 */
export function sessionHash(id: string | number | null | undefined): string {
  return md5(String(id ?? ""));
}

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const K = new Int32Array(64);
for (let i = 0; i < 64; i++) {
  K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
}

function rotl(n: number, c: number): number {
  return ((n << c) | (n >>> (32 - c))) | 0;
}

function md5(input: string): string {
  // UTF-8 → 字节序列，再补位到 56 mod 64，最后接 64 位小端长度
  const bytes = Array.from(new TextEncoder().encode(input));
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  // 会话 ID 很短，长度高 32 位必为 0；仍按 64 位小端写全，保持算法标准
  for (let i = 0; i < 4; i++) bytes.push((bitLen >>> (i * 8)) & 0xff);
  for (let i = 4; i < 8; i++) bytes.push(0);

  let a0 = 0x67452301 | 0;
  let b0 = 0xefcdab89 | 0;
  let c0 = 0x98badcfe | 0;
  let d0 = 0x10325476 | 0;

  const m = new Int32Array(16);
  for (let off = 0; off < bytes.length; off += 64) {
    for (let j = 0; j < 16; j++) {
      const i = off + j * 4;
      m[j] = (bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24)) | 0;
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + m[g]) | 0;
      A = D; D = C; C = B; B = (B + rotl(F, S[i])) | 0;
    }
    a0 = (a0 + A) | 0;
    b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0;
    d0 = (d0 + D) | 0;
  }

  let hex = "";
  for (const v of [a0, b0, c0, d0]) {
    for (let j = 0; j < 4; j++) hex += ((v >>> (j * 8)) & 0xff).toString(16).padStart(2, "0");
  }
  return hex;
}
