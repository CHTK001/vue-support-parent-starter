/**
 * 过滤器配置组件注册表门禁。
 *
 * 钉住的是「重构 ScFilterConfigPanel 时最容易丢的三件事」：
 *   1. 后端历史上给过 fileStorage / file_storage 这类别名，若不归一到 file-storage，
 *      同一个插件会出现两套配置页——而且其中一套是「加了参数却渲染不出来」的那种，
 *      编译和构建都是绿的，只有页面不对。
 *   2. 未注册的过滤器必须回退到通用 schema 表单，否则新增插件在 UI 上直接打不开面板。
 *   3. hasDedicatedFilterPanel 与 resolveFilterPanel 必须同源判断，
 *      否则按钮显隐与实际渲染的组件会不一致（显示「深度查看」但渲染通用表单）。
 */
import { describe, expect, it } from "vitest";
import {
  hasDedicatedFilterPanel,
  normalizeFilterType,
  resolveFilterPanel,
  ScDiscoveryFilterPanel,
  ScFileStorageFilterPanel,
  ScGenericFilterPanel,
} from "../components/filters/index";

describe("normalizeFilterType 别名归一", () => {
  it("驼峰别名归一到连字符规范名", () => {
    expect(normalizeFilterType("fileStorage")).toBe("file-storage");
    expect(normalizeFilterType("serviceDiscovery")).toBe("service-discovery");
  });

  it("下划线别名归一到连字符规范名", () => {
    expect(normalizeFilterType("file_storage")).toBe("file-storage");
    expect(normalizeFilterType("service_discovery")).toBe("service-discovery");
  });

  it("规范名原样返回（归一是幂等的）", () => {
    expect(normalizeFilterType("file-storage")).toBe("file-storage");
    expect(normalizeFilterType("file-storage")).toBe(
      normalizeFilterType(normalizeFilterType("file-storage")),
    );
  });

  it("先 trim 再归一，避免后端带空白时静默落到通用表单", () => {
    expect(normalizeFilterType("  fileStorage  ")).toBe("file-storage");
  });

  it("空值归一为空字符串而不是抛错", () => {
    expect(normalizeFilterType(undefined)).toBe("");
    expect(normalizeFilterType(null)).toBe("");
    expect(normalizeFilterType("")).toBe("");
  });

  it("未知类型保留原值（交给注册表回退，不做猜测映射）", () => {
    expect(normalizeFilterType("brand-new-filter")).toBe("brand-new-filter");
  });
});

describe("resolveFilterPanel 分派", () => {
  it("已注册类型拿到专用面板", () => {
    expect(resolveFilterPanel("file-storage")).toBe(ScFileStorageFilterPanel);
    expect(resolveFilterPanel("service-discovery")).toBe(ScDiscoveryFilterPanel);
  });

  it("别名与规范名解析到同一个组件（这是别名归一存在的全部理由）", () => {
    const canonical = resolveFilterPanel("file-storage");
    expect(resolveFilterPanel("fileStorage")).toBe(canonical);
    expect(resolveFilterPanel("file_storage")).toBe(canonical);
    expect(resolveFilterPanel("  fileStorage ")).toBe(canonical);
  });

  it("未注册类型回退到通用 schema 表单（新增插件零前端改动的前提）", () => {
    expect(resolveFilterPanel("brand-new-filter")).toBe(ScGenericFilterPanel);
  });

  it("空类型回退到通用表单而不是抛错", () => {
    expect(resolveFilterPanel(undefined)).toBe(ScGenericFilterPanel);
    expect(resolveFilterPanel(null)).toBe(ScGenericFilterPanel);
    expect(resolveFilterPanel("")).toBe(ScGenericFilterPanel);
  });
});

describe("hasDedicatedFilterPanel 与 resolveFilterPanel 同源", () => {
  it("判定结果与实际分派结果一致（否则按钮显隐会与渲染结果矛盾）", () => {
    const samples = [
      "file-storage",
      "fileStorage",
      "file_storage",
      "service-discovery",
      "serviceDiscovery",
      "brand-new-filter",
      "",
      undefined,
      null,
    ];
    for (const s of samples) {
      const dedicated = hasDedicatedFilterPanel(s);
      const actual = resolveFilterPanel(s);
      expect(actual === ScGenericFilterPanel).toBe(!dedicated);
    }
  });

  it("专用类型为 true，未知类型为 false", () => {
    expect(hasDedicatedFilterPanel("file-storage")).toBe(true);
    expect(hasDedicatedFilterPanel("fileStorage")).toBe(true);
    expect(hasDedicatedFilterPanel("brand-new-filter")).toBe(false);
    expect(hasDedicatedFilterPanel(null)).toBe(false);
  });
});