import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseMetafile } from "./metafile";

/** 真实样本：由 Windows GDI 录制/绘制生成（非手拼字节） */
const HERE = dirname(fileURLToPath(import.meta.url));
const SAMPLES = join(
  HERE,
  "../../../../apps/vue-support-system-starter/tests/e2e/samples-new",
);

function load(name: string): ArrayBuffer {
  const p = join(SAMPLES, name);
  expect(existsSync(p), `样本 ${name} 必须存在（真实 GDI 输出）`).toBe(true);
  return new Uint8Array(readFileSync(p)).buffer as ArrayBuffer;
}

describe("parseMetafile（WMF/EMF → SVG）", () => {
  it("解析真实 WMF：识别容器、出图元与 SVG", () => {
    const r = parseMetafile(load("sample.wmf"));
    expect(r.kind).toBe("wmf");
    expect(r.recordCount).toBeGreaterThan(5);
    expect(r.shapeCount).toBeGreaterThanOrEqual(5);
    expect(r.svg).toContain("<svg");
    expect(r.svg).toContain("<rect");
    expect(r.svg).toContain("<ellipse");
    expect(r.svg).toContain("<path");
    expect(r.bounds.maxX).toBeGreaterThan(r.bounds.minX);
  });

  it("解析真实 EMF：识别容器、出图元与 SVG", () => {
    const r = parseMetafile(load("sample.emf"));
    expect(r.kind).toBe("emf");
    expect(r.recordCount).toBeGreaterThan(5);
    expect(r.shapeCount).toBeGreaterThanOrEqual(3);
    // GDI+ 把矩形/椭圆都录成 PATH/POLYGON16 系列，落成 path 是正常的
    expect(r.svg).toContain("<path");
    expect(r.svg).toContain("<svg");
    expect(r.bounds.maxY).toBeGreaterThan(r.bounds.minY);
  });

  it("非图元文件给出可读错误", () => {
    const junk = new Uint8Array(64).fill(0x41).buffer;
    expect(() => parseMetafile(junk)).toThrow(/不是有效的 WMF\/EMF/);
  });

  it("空/过小文件给出可读错误", () => {
    expect(() => parseMetafile(new ArrayBuffer(4))).toThrow(/文件过小/);
  });
});
