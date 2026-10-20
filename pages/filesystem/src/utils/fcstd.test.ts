import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { extractFcstdShape } from "./fcstd";

/** 造一个最小 .fcstd（ZIP：Document.xml + 若干 *.brp） */
async function makeFcstd(files: Record<string, string>): Promise<ArrayBuffer> {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) zip.file(name, content);
  return (await zip.generateAsync({ type: "arraybuffer" })) as ArrayBuffer;
}

describe("extractFcstdShape（fcstd 解包取几何）", () => {
  it("取出体积最大的 *.brp，而不是第一个", async () => {
    const buf = await makeFcstd({
      "Document.xml": "<Document/>",
      "First.brp": "small",
      "PartShape.brp": "x".repeat(500),
      "Cut.brp": "y".repeat(120),
    });
    const shape = await extractFcstdShape(buf);
    expect(shape.name).toBe("PartShape.brp");
    expect(shape.bytes.byteLength).toBe(500);
  });

  it("也接受 .brep 扩展名", async () => {
    const buf = await makeFcstd({ "Document.xml": "<Document/>", "Shape.brep": "z".repeat(64) });
    const shape = await extractFcstdShape(buf);
    expect(shape.name).toBe("Shape.brep");
    expect(shape.bytes.byteLength).toBe(64);
  });

  it("没有几何条目时给出可读错误", async () => {
    const buf = await makeFcstd({ "Document.xml": "<Document/>" });
    await expect(extractFcstdShape(buf)).rejects.toThrow(/没有 \.brp 几何/);
  });
});
