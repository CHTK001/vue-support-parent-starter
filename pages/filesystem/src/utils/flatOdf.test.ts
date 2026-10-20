import { describe, expect, it } from "vitest";
import { parseFlatOdf } from "./flatOdf";

const FODT = `<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
    xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
    office:mimetype="application/vnd.oasis.opendocument.text">
  <office:body>
    <office:text>
      <text:h text:outline-level="1">Flat ODF 测试文档</text:h>
      <text:p>第一段：hello &amp; world</text:p>
      <text:p>实体：&#20844;&#21496; 与 <text:span>行内 span</text:span></text:p>
      <text:h text:outline-level="2">子标题</text:h>
      <text:p>空<text:s text:c="3"/>格<text:tab/>制表<text:line-break/>换行</text:p>
    </office:text>
  </office:body>
</office:document>`;

describe("parseFlatOdf（扁平 ODF 正文）", () => {
  it("按文档顺序取出标题与段落", () => {
    const blocks = parseFlatOdf(FODT);
    expect(blocks.map((b) => b.kind)).toEqual([
      "heading",
      "paragraph",
      "paragraph",
      "heading",
      "paragraph",
    ]);
    expect(blocks[0]).toEqual({ kind: "heading", level: 1, text: "Flat ODF 测试文档" });
    expect(blocks[3]).toEqual({ kind: "heading", level: 2, text: "子标题" });
  });

  it("解码实体并剥掉行内标签保留文字", () => {
    const blocks = parseFlatOdf(FODT);
    expect(blocks[1].text).toBe("第一段：hello & world");
    expect(blocks[2].text).toBe("实体：公司 与 行内 span");
  });

  it("处理 text:s / text:tab / text:line-break", () => {
    const blocks = parseFlatOdf(FODT);
    expect(blocks[4].text).toBe("空   格\t制表\n换行");
  });

  it("非 ODF 内容返回空数组", () => {
    expect(parseFlatOdf("not xml at all")).toEqual([]);
  });
});
