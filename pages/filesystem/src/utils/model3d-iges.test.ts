/**
 * IGES 路由回归（台账 iges / igs 那条的钉子）
 *
 * <p>为什么值得单测：`FV_PANEL_BY_EXT` 曾把 iges/igs 派给 `FvBinaryPanel`，
 * 于是用户点开 IGES 只能看到十六进制。而面板层 `PreviewModel3dPanel` 一直支持
 * 这个格式（`EXT_TO_FORMAT` → OCCT `ReadIgesFile` → three 渲染）。这里把
 * 「扩展名识别」这层钉住；解析与渲染在真实浏览器里回放。</p>
 *
 * @author Buffy
 * @since 2026/11/04
 */
import { describe, expect, it } from "vitest";
import { FORMAT_ENGINE, FORMAT_LABEL, detectModel3dFormat } from "./model3d";

describe("IGES（台账 iges / igs 那条）", () => {
  it("igs / iges / 大写都能识别为 OCCT 的 iges 通道", () => {
    expect(detectModel3dFormat("a.igs")).toBe("iges");
    expect(detectModel3dFormat("a.iges")).toBe("iges");
    expect(detectModel3dFormat("a.IGES")).toBe("iges");
  });

  it("IGES 走 OCCT 引擎（不是 three 原生加载器）", () => {
    expect(FORMAT_LABEL.iges).toBe("IGES");
    expect(FORMAT_ENGINE.iges.engine).toBe("occt");
  });

  // 解析要 OCCT WASM + document/Blob URL（浏览器环境），由
  // test/filesystem-fix-1102/verify-iges-preview.cjs 在真实页面里回放。
});
