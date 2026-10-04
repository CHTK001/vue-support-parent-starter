/**
 * ServerFilter 配置组件注册表 —— 分派逻辑单元测试。
 *
 * 规格：每个 ServerFilter 在前端有对应的特定组件；未注册专用实现的走通用 schema 表单。
 * 这里锁住「按类型分派」这个决策本身（组件选择），不覆盖渲染细节。
 *
 * 只导入不挂载，因此用 node 环境即可，不必引入 jsdom / @vue/test-utils。
 */
import { describe, expect, it, vi } from "vitest";

// ScDiscoveryFilterPanel 只用到 message，避免为此拉起整个 @repo/core
vi.mock("@repo/core", () => ({
  message: { info: () => {}, warning: () => {}, error: () => {} },
}));

import {
  ScDiscoveryFilterPanel,
  ScFileStorageFilterPanel,
  ScGenericFilterPanel,
  hasDedicatedFilterPanel,
  normalizeFilterType,
  resolveFilterPanel,
} from "@pages/server/src/components/filters";
import ScFilterConfigPanel from "@pages/server/src/components/ScFilterConfigPanel.vue";

describe("ServerFilter 配置组件注册表", () => {
  it("类型别名归一到规范名（连字符形式）", () => {
    expect(normalizeFilterType("fileStorage")).toBe("file-storage");
    expect(normalizeFilterType("file_storage")).toBe("file-storage");
    expect(normalizeFilterType("serviceDiscovery")).toBe("service-discovery");
    expect(normalizeFilterType("service_discovery")).toBe("service-discovery");
  });

  it("未登记的类型保持原样（去首尾空格）", () => {
    expect(normalizeFilterType("  URL-MAPPING  ")).toBe("URL-MAPPING");
    expect(normalizeFilterType("任意自定义实现")).toBe("任意自定义实现");
    expect(normalizeFilterType("")).toBe("");
    expect(normalizeFilterType(null)).toBe("");
    expect(normalizeFilterType(undefined)).toBe("");
  });

  it("file-storage 与 service-discovery 解析到各自的专用组件", () => {
    expect(hasDedicatedFilterPanel("file-storage")).toBe(true);
    expect(hasDedicatedFilterPanel("service-discovery")).toBe(true);
    expect(resolveFilterPanel("file-storage")).toBe(ScFileStorageFilterPanel);
    expect(resolveFilterPanel("fileStorage")).toBe(ScFileStorageFilterPanel);
    expect(resolveFilterPanel("service-discovery")).toBe(ScDiscoveryFilterPanel);
    expect(resolveFilterPanel("serviceDiscovery")).toBe(ScDiscoveryFilterPanel);
  });

  it("未注册专用实现的过滤器（含 SPI 插件与自定义 FQCN）回退通用表单", () => {
    for (const t of ["URL-MAPPING", "SHELL-URL-MAPPING", "ServerFilter", "", null, undefined]) {
      expect(hasDedicatedFilterPanel(t)).toBe(false);
      expect(resolveFilterPanel(t)).toBe(ScGenericFilterPanel);
    }
  });

  it("三个面板组件互不相同（避免注册表把多个类型指向同一组件）", () => {
    expect(ScFileStorageFilterPanel).not.toBe(ScDiscoveryFilterPanel);
    expect(ScFileStorageFilterPanel).not.toBe(ScGenericFilterPanel);
    expect(ScDiscoveryFilterPanel).not.toBe(ScGenericFilterPanel);
  });
});

describe("分派器对外契约（两个调用点依赖它保持不变）", () => {
  it("props 保持 meta / filterType / modelValue / live / applying", () => {
    const c = ScFilterConfigPanel as unknown as { props: Record<string, unknown> };
    expect(Object.keys(c.props).sort()).toEqual(
      ["applying", "filterType", "live", "meta", "modelValue"].sort(),
    );
  });

  it("emits 保持 update:modelValue / apply / open-detail-page", () => {
    const c = ScFilterConfigPanel as unknown as { emits: string[] };
    expect([...c.emits].sort()).toEqual(["apply", "open-detail-page", "update:modelValue"]);
  });
});
