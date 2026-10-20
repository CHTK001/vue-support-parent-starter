import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { decodeNetpbm } from "./netpbm";
import { decodeHdr } from "./hdr";
import { decodeDds } from "./dds";

const HERE = dirname(fileURLToPath(import.meta.url));
const SAMPLES = join(HERE, "../../../../apps/vue-support-system-starter/tests/e2e/samples-new");

function load(name: string): ArrayBuffer {
  const p = join(SAMPLES, name);
  expect(existsSync(p), `样本 ${name} 必须存在`).toBe(true);
  return new Uint8Array(readFileSync(p)).buffer as ArrayBuffer;
}

/** 统计不同颜色数，用来判断「不是一片纯色」 */
function distinctColors(r: { data: Uint8ClampedArray }): number {
  const seen = new Set<number>();
  for (let i = 0; i < r.data.length; i += 4) {
    seen.add((r.data[i] << 16) | (r.data[i + 1] << 8) | r.data[i + 2]);
  }
  return seen.size;
}

describe("decodeNetpbm（pbm/pgm/ppm/pnm）", () => {
  it("真实 P1 位图：尺寸正确且黑白都有", () => {
    const r = decodeNetpbm(load("sample.pbm"));
    expect(r.width).toBe(24);
    expect(r.height).toBe(16);
    expect(r.data.length).toBe(24 * 16 * 4);
    expect(distinctColors(r)).toBe(2);
  });

  it("真实 P6 二进制 RGB：渐变非纯色", () => {
    const r = decodeNetpbm(load("sample.ppm"));
    expect(r.width).toBe(48);
    expect(r.height).toBe(32);
    expect(distinctColors(r)).toBeGreaterThan(100);
  });

  it("P3 ASCII 支持注释与 maxval 归一化", () => {
    const buf = new TextEncoder().encode("P3\n# c\n2 1\n15\n15 0 0  0 15 0\n").buffer;
    const r = decodeNetpbm(buf);
    expect(r.width).toBe(2);
    expect(Array.from(r.data)).toEqual([255, 0, 0, 255, 0, 255, 0, 255]);
  });

  it("P2 ASCII 灰度与 P4 二进制位图", () => {
    const p2 = decodeNetpbm(new TextEncoder().encode("P2\n2 1\n255\n0 255\n").buffer);
    expect(Array.from(p2.data)).toEqual([0, 0, 0, 255, 255, 255, 255, 255]);

    // P4：宽度 4 → 每行 1 字节；0b1000 = 黑 白白白
    const p4 = new Uint8Array([0x50, 0x34, 0x0a, 0x34, 0x20, 0x31, 0x0a, 0x80]);
    const r4 = decodeNetpbm(p4.buffer);
    expect(r4.width).toBe(4);
    expect(r4.data[0]).toBe(0);
    expect(r4.data[4]).toBe(255);
  });

  it("非 Netpbm 给出可读错误", () => {
    expect(() => decodeNetpbm(new TextEncoder().encode("XXXX").buffer)).toThrow(/P 魔数|不支持/);
  });
});

describe("decodeHdr（Radiance RGBE）", () => {
  it("真实 HDR：解析头 + 平坦扫描线并色调映射", () => {
    const r = decodeHdr(load("sample.hdr"));
    expect(r.width).toBe(48);
    expect(r.height).toBe(32);
    expect(distinctColors(r)).toBeGreaterThan(20);
  });

  it("缺少 #?RADIANCE 头时报错", () => {
    expect(() => decodeHdr(new TextEncoder().encode("not a hdr file at all").buffer)).toThrow(
      /Radiance HDR/,
    );
  });
});

describe("decodeDds（DDS/BC1-3）", () => {
  it("真实未压缩 DDS：宽高与渐变正确", () => {
    const r = decodeDds(load("sample.dds"));
    expect(r.width).toBe(64);
    expect(r.height).toBe(48);
    expect(distinctColors(r)).toBeGreaterThan(100);
  });

  it("DXT1 单块解码（4x4）", () => {
    const head = new Uint8Array(128);
    const dv = new DataView(head.buffer);
    dv.setUint32(0, 0x20534444, true);
    dv.setUint32(12, 4, true); // height
    dv.setUint32(16, 4, true); // width
    dv.setUint32(84, 0x31545844, true); // 'DXT1'
    // c0 = 纯红(0xF800), c1 = 纯蓝(0x001F)，索引全 0 → 红
    const block = new Uint8Array(8);
    const bv = new DataView(block.buffer);
    bv.setUint16(0, 0xf800, true);
    bv.setUint16(2, 0x001f, true);
    bv.setUint32(4, 0, true);
    const all = new Uint8Array(136);
    all.set(head, 0);
    all.set(block, 128);
    const r = decodeDds(all.buffer);
    expect(r.width).toBe(4);
    expect(Array.from(r.data.slice(0, 4))).toEqual([255, 0, 0, 255]);
  });

  it("魔数不符时报错", () => {
    expect(() => decodeDds(new Uint8Array(200).buffer)).toThrow(/DDS 魔数/);
  });
});
