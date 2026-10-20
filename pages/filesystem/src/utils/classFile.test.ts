import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseClassInfo } from "./classFile";

const HERE = dirname(fileURLToPath(import.meta.url));
const SAMPLE = join(
  HERE,
  "../../../../apps/vue-support-system-starter/tests/e2e/samples274/sample.class",
);

function loadClass(): Uint8Array {
  expect(existsSync(SAMPLE), "sample.class 必须存在").toBe(true);
  return new Uint8Array(readFileSync(SAMPLE));
}

interface CfrModule {
  decompile: (
    names: string | string[],
    config?: {
      source?: (name: string) => Promise<Uint8Array | null>;
      options?: Record<string, string>;
    },
  ) => Promise<Record<string, string>>;
}

describe("parseClassInfo（class 头解析）", () => {
  it("从 this_class 读出内部名、版本与访问标志", () => {
    const buf = loadClass();
    const info = parseClassInfo(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
    expect(info.internalName).toBe("Sample274");
    expect(info.name).toBe("Sample274");
    expect(info.major).toBeGreaterThanOrEqual(45);
    expect(info.constantPoolCount).toBeGreaterThan(10);
    expect(info.accessFlags).toBeGreaterThan(0);
  });

  it("非 class 文件给出可读错误", () => {
    const junk = new Uint8Array(64).fill(0x41);
    expect(() => parseClassInfo(junk.buffer)).toThrow(/0xCAFEBABE/);
  });
});

describe("前端反编译（@run-slicer/cfr，vendored）", () => {
  it("还原出可读 Java 源码", async () => {
    const bytes = loadClass();
    const meta = parseClassInfo(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    );

    const mod = (await import("../vendor/cfr/cfr.js")) as unknown as CfrModule;
    const out = await mod.decompile(meta.internalName, {
      source: async (name) => (name === meta.internalName ? bytes : null),
      options: {},
    });

    const src = out[meta.internalName] ?? "";
    expect(src).toContain("class Sample274");
    expect(src).toContain("public static void main");
    expect(src).toContain('System.out.println("sample274")');
  }, 60_000);
});
