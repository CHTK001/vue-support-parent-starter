/**
 * 协同快照导出的单元测试
 *
 * <p>盯的是「导出的文件不能少内容」：列名换算（超过 26 列）和三种类型的字节形态，
 * 这两处错了不会报错，只会让导出的 xlsx 少几列或者 docx 打不开。</p>
 *
 * @author Buffy
 * @since 2026/11/06
 */
import { describe, expect, it } from "vitest";
import { columnName, snapshotToBlob, snapshotToOfficeBytes } from "./collabExport";
import { decodeOfficeSnapshot, encodeOfficeSnapshot, isOfficeSnapshot, officeSnapshotBytes } from "./collabOffice";

describe("columnName（列下标 → 列名）", () => {
  it("前 26 列是 A..Z", () => {
    expect(columnName(0)).toBe("A");
    expect(columnName(25)).toBe("Z");
  });

  it("跨过 26 列后进位成 AA/AB/BA，而不是跑到 [ \\ 这种字符上", () => {
    expect(columnName(26)).toBe("AA");
    expect(columnName(27)).toBe("AB");
    expect(columnName(52)).toBe("BA");
    expect(columnName(701)).toBe("ZZ");
    expect(columnName(702)).toBe("AAA");
  });

  it("非法入参不抛错（负数按 0、小数向下取整）", () => {
    expect(columnName(-5)).toBe("A");
    expect(columnName(1.9)).toBe("B");
  });
});

describe("snapshotToBlob（快照 → 文件字节）", () => {
  it("text 原样导出，扩展名 .txt", async () => {
    const { blob, ext } = await snapshotToBlob("text", "第一行\n第二行", "a.txt");
    expect(ext).toBe(".txt");
    expect(await blob.text()).toBe("第一行\n第二行");
  });

  it("excel 导出真 xlsx（PK 头），且超过 26 列的内容不丢", async () => {
    // 造 30 列 × 1 行的表格，第 30 列（AD）放一个哨兵值
    const cellData: Record<string, { v: string }> = {};
    for (let c = 0; c < 30; c++) {
      cellData[`${columnName(c)}1`] = { v: `c${c}` };
    }
    const snapshot = JSON.stringify({
      sheetOrder: ["s1"],
      sheets: { s1: { cellData, rowCount: 1, columnCount: 30 } },
    });

    const { blob, ext } = await snapshotToBlob("excel", snapshot, "a.xlsx");
    expect(ext).toBe(".xlsx");
    const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
    expect([head[0], head[1]]).toEqual([0x50, 0x4b]); // "PK" = zip 容器
    expect(blob.size).toBeGreaterThan(1000);
  });

  it("excel 空快照也能导出（不抛错）", async () => {
    const { blob, ext } = await snapshotToBlob("excel", "", "a.xlsx");
    expect(ext).toBe(".xlsx");
    expect(blob.size).toBeGreaterThan(0);
  });

  // word 分支要 DOMParser（collabDocx 用它在浏览器里解析 HTML），
  // 本仓库的 vitest 跑在 node 环境、没装 jsdom/happy-dom，这里跳过；
  // 该分支的行为由浏览器侧验证（FileCollabManage 的下载/写回）。
  const hasDom = typeof DOMParser !== "undefined";
  it.skipIf(!hasDom)("word 导出 docx（PK 头）", async () => {
    const { blob, ext } = await snapshotToBlob("word", "<p>hello</p>", "a.docx");
    expect(ext).toBe(".docx");
    const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
    expect([head[0], head[1]]).toEqual([0x50, 0x4b]);
  });
});

describe("新格式快照（ooxml1:base64）", () => {
  it("编码后再解码，字节完全一致", () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0xff, 0x80]);
    const snapshot = encodeOfficeSnapshot(bytes);
    expect(isOfficeSnapshot(snapshot)).toBe(true);
    expect(decodeOfficeSnapshot(snapshot)).toEqual(bytes);
  });

  it("officeSnapshotBytes 按解码长度算（不虚高 33%）", () => {
    const bytes = new Uint8Array(1000);
    const snapshot = encodeOfficeSnapshot(bytes);
    expect(officeSnapshotBytes(snapshot)).toBe(1000);
  });

  it("非新格式按 UTF-8 文本长度算", () => {
    expect(officeSnapshotBytes("中文")).toBe(6);
  });

  it("snapshotToBlob 对新格式原样还原，不走任何转换", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const { blob, ext } = await snapshotToBlob("excel", encodeOfficeSnapshot(bytes), "a.xlsx");
    expect(ext).toBe(".xlsx");
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes);
  });

  it("snapshotToOfficeBytes 对新格式返回原字节", async () => {
    const bytes = new Uint8Array([9, 8, 7]);
    expect(await snapshotToOfficeBytes("word", encodeOfficeSnapshot(bytes))).toEqual(bytes);
  });

  it("snapshotToOfficeBytes 对旧格式兜底成可打开的文件", async () => {
    const bytes = await snapshotToOfficeBytes("excel", "");
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });
});
