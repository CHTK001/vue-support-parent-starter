import { describe, expect, it } from "vitest";
import {
  ACTIVE_THEME_KEYS,
  getThemeComponentName,
  getThemeLocalComponentConfig,
} from "../../../../packages/components/hooks/themeConfig";

describe("theme component registry", () => {
  it("keeps only the six active theme keys", () => {
    expect(ACTIVE_THEME_KEYS).toEqual([
      "default",
      "8bit",
      "future-tech",
      "halloween",
      "christmas",
      "spring-festival",
    ]);
  });

  it("keeps pixel-ui mappings in the shared useThemeComponent chain", () => {
    expect(getThemeComponentName("8bit", "ElButton")).toBe("PxButton");
    expect(getThemeComponentName("8bit", "ElCard")).toBe("PxCard");
    expect(getThemeLocalComponentConfig("8bit", "ElButton")).toBeNull();
    expect(getThemeLocalComponentConfig("8bit", "ElCard")).toBeNull();
  });

  it("registers festive and future-tech button/card wrappers as local theme components", () => {
    for (const themeKey of [
      "future-tech",
      "halloween",
      "christmas",
      "spring-festival",
    ] as const) {
      expect(getThemeComponentName(themeKey, "ElButton")).toBe("ElButton");
      expect(getThemeComponentName(themeKey, "ElCard")).toBe("ElCard");
      expect(getThemeLocalComponentConfig(themeKey, "ElButton")).not.toBeNull();
      expect(getThemeLocalComponentConfig(themeKey, "ElCard")).not.toBeNull();
    }
  });

  it("falls back to shared element-plus components when no local wrapper is registered", () => {
    expect(getThemeComponentName("default", "ElButton")).toBe("ElButton");
    expect(getThemeComponentName("default", "ElCard")).toBe("ElCard");
    expect(getThemeLocalComponentConfig("default", "ElButton")).toBeNull();
    expect(getThemeLocalComponentConfig("default", "ElCard")).toBeNull();
  });
});
