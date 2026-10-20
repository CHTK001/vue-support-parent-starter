import { describe, expect, it } from "vitest";
import {
  buildAvcC,
  buildHvcC,
  codecString,
  collectParameterSets,
  detectFamily,
  splitAnnexB,
  stripEmulationPrevention,
} from "./annexb";

/** 拼一段 Annex B：4 字节起始码 + 负载 */
function nal(payload: number[]): number[] {
  return [0, 0, 0, 1, ...payload];
}

describe("splitAnnexB / stripEmulationPrevention", () => {
  it("切出多个 NAL，并同时识别 3 字节与 4 字节起始码", () => {
    const buf = new Uint8Array([
      ...nal([0x67, 0x42, 0x00, 0x1f]), // SPS
      0, 0, 1, 0x68, 0xce, // PPS（3 字节起始码）
      ...nal([0x65, 0x88, 0x84]), // IDR 片
    ]);
    const nals = splitAnnexB(buf);
    expect(nals).toHaveLength(3);
    expect(nals.map((n) => n.type)).toEqual([7, 8, 5]);
  });

  it("剔除 00 00 03 防竞争字节", () => {
    const raw = new Uint8Array([0x00, 0x00, 0x03, 0x01, 0x02]);
    expect(Array.from(stripEmulationPrevention(raw))).toEqual([0, 0, 1, 2]);
  });

  it("没有起始码时返回空数组", () => {
    expect(splitAnnexB(new Uint8Array([1, 2, 3, 4]))).toEqual([]);
  });
});

describe("参数集与解码配置", () => {
  // 一段最小的 H.264 SPS（profile=0x64 level=0x1f）与 PPS
  const sps = new Uint8Array([0x67, 0x64, 0x00, 0x1f, 0xac, 0xd9]);
  const pps = new Uint8Array([0x68, 0xce, 0x3c, 0x80]);

  it("收集 H.264 的 SPS/PPS", () => {
    const nals = splitAnnexB(new Uint8Array([...nal(Array.from(sps)), ...nal(Array.from(pps))]));
    const ps = collectParameterSets(nals, "h264");
    expect(ps.sps?.length).toBe(sps.length);
    expect(ps.pps?.length).toBe(pps.length);
  });

  it("识别 H.264 族", () => {
    const nals = splitAnnexB(new Uint8Array([...nal(Array.from(sps))]));
    expect(detectFamily(nals)).toBe("h264");
  });

  it("avcC 头字段符合规范", () => {
    const avcC = buildAvcC(sps, pps);
    expect(avcC[0]).toBe(1); // configurationVersion
    expect(avcC[1]).toBe(0x64); // profile
    expect(avcC[2]).toBe(0x00);
    expect(avcC[3]).toBe(0x1f); // level
    expect(avcC[4]).toBe(0xff); // lengthSizeMinusOne = 3
    expect(avcC[5]).toBe(0xe1); // 1 个 SPS
    expect((avcC[6] << 8) | avcC[7]).toBe(sps.length);
  });

  it("H.264 codec 字符串为 avc1.PPCCLL", () => {
    expect(codecString("h264", sps)).toBe("avc1.64001f");
  });

  it("H.265 的 hvcC 至少包含 3 个参数集数组", () => {
    const vps = new Uint8Array([0x40, 0x01, 0x0c, 0x01]);
    const hevcSps = new Uint8Array([
      0x42, 0x01, 0x01, 0x01, 0x60, 0x00, 0x00, 0x03, 0x00, 0x90, 0x00, 0x00, 0x03, 0x00,
    ]);
    const hevcPps = new Uint8Array([0x44, 0x01, 0xc0]);
    const hvcC = buildHvcC(vps, hevcSps, hevcPps);
    expect(hvcC[0]).toBe(1);
    // 最后一个字节之前应能找到 numOfArrays = 3
    expect(hvcC[22]).toBe(3);
    expect(hvcC.length).toBeGreaterThan(30);
  });
});
