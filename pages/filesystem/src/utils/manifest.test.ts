import { describe, expect, it } from "vitest";
import { parseManifest } from "./manifest";

describe("parseManifest（Java MANIFEST）", () => {
  it("解析主属性段与 Name: 条目段", () => {
    const text = [
      "Manifest-Version: 1.0",
      "Created-By: Test",
      "",
      "Name: com/foo/Bar.class",
      "SHA-256-Digest: AAAA",
      "",
      "Name: com/foo/Baz.class",
      "SHA-256-Digest: BBBB",
      "",
    ].join("\n");
    const s = parseManifest(text);
    expect(s).toHaveLength(3);
    expect(s[0].title).toBe("");
    expect(s[0].attrs).toEqual([
      { name: "Manifest-Version", value: "1.0" },
      { name: "Created-By", value: "Test" },
    ]);
    expect(s[1].title).toBe("com/foo/Bar.class");
    expect(s[2].title).toBe("com/foo/Baz.class");
  });

  it("续行（以单个空格开头）接回上一行", () => {
    const text = ["Name: a/b.txt", "X-Long: part1", " part2", " part3"].join("\n");
    const s = parseManifest(text);
    expect(s[0].attrs.find((a) => a.name === "X-Long")?.value).toBe("part1part2part3");
  });

  it("兼容 CRLF 且容忍结尾无换行", () => {
    const s = parseManifest("Manifest-Version: 1.0\r\nMain-Class: M");
    expect(s).toHaveLength(1);
    expect(s[0].attrs).toHaveLength(2);
  });

  it("空文本返回空数组", () => {
    expect(parseManifest("")).toEqual([]);
  });
});
