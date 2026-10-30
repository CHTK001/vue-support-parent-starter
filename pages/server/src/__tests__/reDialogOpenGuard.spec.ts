/**
 * 修复 #6 的回归：AssetsView.openAdd/openEdit 携带「弹窗已打开则跳过」的防重语句。
 *
 * 闪动两次的根因是「打开弹窗壳的请求发出了两次」，在弹窗壳层只能一次 open（reDialogOpenCycle
 * / reDialogDock 已验证），所以防护放在打开请求端。
 *
 * @author CH
 * @since 4.0.0
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** 页面源文件（测试进程启动于 page/server） */
function readSource(file: string): string {
  return readFileSync(join(process.cwd(), "src", "views", file), "utf8");
}

function findFn(src: string, name: string): string | undefined {
  const re = new RegExp(`function ${name}[^()]*\\([^)]*\\):\\s*void\\s*\\{[\\s\\S]*?^\\s*\\}\\n?`, "m");
  const m = src.match(re);
  return m?.[0];
}

describe("AssetsView 打开弹窗请求", () => {
  it("openAdd / openEdit 有 formVisible 防重", () => {
    const src = readSource("AssetsView.vue");
    expect(findFn(src, "openAdd")).toMatch(/formVisible\.value/);
    expect(findFn(src, "openEdit")).toMatch(/formVisible\.value/);
  });

  it("工具栏按键（rail-tool）在 Dock 之前", () => {
    const src = readSource("AssetsView.vue");
    const lines = src.split("\n");
    const rail = lines.findIndex((l) => l.includes("@click=\"openAdd\"") && l.includes("is-primary"));
    const dock = lines.findIndex((l) => l.includes("@click=\"openAdd\"") && l.includes("dock-quick__item"));
    expect(rail).toBeLessThan(dock);
    expect(dock).toBeGreaterThan(0);
  });
});
