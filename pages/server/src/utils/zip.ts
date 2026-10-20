/**
 * 极简 ZIP 打包（STORE，不压缩）。
 *
 * <p><b>为什么不引第三方库</b>：本应用并没有 zip 依赖（{@code jszip} 只在 {@code pages/filesystem}），
 * 为了「把证书三件套打成一个 zip」而给监控台引入依赖/装包不划算。证书都是几 KB 的 PEM 文本，
 * 用 STORE（不压缩）方式即可，格式完全符合 ZIP 规范（PKZIP APPNOTE），Windows/macOS/Linux
 * 均能正常解压。</p>
 *
 * @author CH
 * @since 2026-10-17
 */

/** 一个待打包条目 */
export interface ZipEntry {
  /** 压缩包内文件名 */
  name: string;
  /** 文件内容（原始字节） */
  data: Uint8Array<ArrayBuffer>;
}

/** CRC32 查表（ZIP 每个条目都需要校验值） */
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

/**
 * 计算 CRC32（ZIP 条目校验值）。
 *
 * @param buf 字节内容
 * @returns 无符号 32 位 CRC
 */
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * 把若干条目打成 zip。
 *
 * @param entries 条目列表（名称 + 内容）
 * @returns application/zip 的 Blob
 */
export function createZip(entries: ZipEntry[]): Blob {
  const enc = new TextEncoder();
  const now = new Date();
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
  const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

  const parts: Uint8Array<ArrayBuffer>[] = [];
  const central: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = enc.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    // 本地文件头：30 字节固定头 + 文件名
    const local = new Uint8Array(new ArrayBuffer(30 + nameBytes.length));
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // 签名 PK\x03\x04
    lv.setUint16(4, 20, true); // 解压所需版本
    lv.setUint16(6, 0, true); // 通用标志
    lv.setUint16(8, 0, true); // 压缩方法：0 = STORE
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true); // 压缩后大小
    lv.setUint32(22, size, true); // 原始大小
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // 扩展字段长度
    local.set(nameBytes, 30);

    parts.push(local, entry.data);

    // 中央目录项：46 字节固定头 + 文件名
    const cd = new Uint8Array(new ArrayBuffer(46 + nameBytes.length));
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true); // 签名 PK\x01\x02
    cv.setUint16(4, 20, true); // 创建版本
    cv.setUint16(6, 20, true); // 解压所需版本
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true); // STORE
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // 扩展字段
    cv.setUint16(32, 0, true); // 注释
    cv.setUint16(34, 0, true); // 起始磁盘号
    cv.setUint16(36, 0, true); // 内部属性
    cv.setUint32(38, 0, true); // 外部属性
    cv.setUint32(42, offset, true); // 本地头偏移
    cd.set(nameBytes, 46);
    central.push(cd);

    offset += local.length + size;
  }

  const centralSize = central.reduce((sum, c) => sum + c.length, 0);

  // 中央目录结束记录（EOCD）：22 字节
  const eocd = new Uint8Array(new ArrayBuffer(22));
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // 签名 PK\x05\x06
  ev.setUint16(4, 0, true); // 当前磁盘
  ev.setUint16(6, 0, true); // 中央目录所在磁盘
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true); // 中央目录偏移
  ev.setUint16(20, 0, true); // 注释长度

  return new Blob([...parts, ...central, eocd], { type: "application/zip" });
}
