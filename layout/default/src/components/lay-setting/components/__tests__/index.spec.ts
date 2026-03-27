import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const registrySource = readFileSync(resolve(currentDir, "../index.ts"), "utf-8");

describe("lay-setting theme registry source", () => {
  it("keeps only the 6 active themes in the supported registry", () => {
    expect(registrySource).toContain('"default"');
    expect(registrySource).toContain('"8bit"');
    expect(registrySource).toContain('"spring-festival"');
    expect(registrySource).toContain('"halloween"');
    expect(registrySource).toContain('"christmas"');
    expect(registrySource).toContain('"future-tech"');
  });

  it("maps real theme section components for all setting areas", () => {
    expect(registrySource).toContain("./sections/default/SettingTheme.vue");
    expect(registrySource).toContain("./sections/default/SettingTabs.vue");
    expect(registrySource).toContain("./sections/default/SettingDisplay.vue");
    expect(registrySource).toContain("./sections/default/SettingMessage.vue");
    expect(registrySource).toContain("./sections/default/SettingAiChat.vue");
    expect(registrySource).toContain("./sections/default/SettingAdvanced.vue");
    expect(registrySource).toContain('./sections/8bit/SettingLayout.vue');
    expect(registrySource).toContain('./sections/8bit/SettingTabs.vue');
    expect(registrySource).toContain('./sections/8bit/SettingDisplay.vue');
    expect(registrySource).toContain('./sections/8bit/SettingMessage.vue');
    expect(registrySource).toContain('./sections/8bit/SettingAiChat.vue');
    expect(registrySource).toContain('./sections/8bit/SettingAdvanced.vue');
    expect(registrySource).toContain('./sections/spring-festival/SettingToolbar.vue');
    expect(registrySource).toContain('./sections/spring-festival/SettingTabs.vue');
    expect(registrySource).toContain('./sections/spring-festival/SettingDisplay.vue');
    expect(registrySource).toContain('./sections/spring-festival/SettingMessage.vue');
    expect(registrySource).toContain('./sections/spring-festival/SettingAiChat.vue');
    expect(registrySource).toContain('./sections/spring-festival/SettingAdvanced.vue');
    expect(registrySource).toContain("./sections/halloween/SettingMenu.vue");
    expect(registrySource).toContain("./sections/halloween/SettingTabs.vue");
    expect(registrySource).toContain("./sections/halloween/SettingDisplay.vue");
    expect(registrySource).toContain("./sections/halloween/SettingMessage.vue");
    expect(registrySource).toContain("./sections/halloween/SettingAiChat.vue");
    expect(registrySource).toContain("./sections/halloween/SettingAdvanced.vue");
    expect(registrySource).toContain("./sections/christmas/SettingTheme.vue");
    expect(registrySource).toContain("./sections/christmas/SettingTabs.vue");
    expect(registrySource).toContain("./sections/christmas/SettingDisplay.vue");
    expect(registrySource).toContain("./sections/christmas/SettingMessage.vue");
    expect(registrySource).toContain("./sections/christmas/SettingAiChat.vue");
    expect(registrySource).toContain("./sections/christmas/SettingAdvanced.vue");
    expect(registrySource).toContain('./sections/future-tech/SettingToolbar.vue');
    expect(registrySource).toContain('./sections/future-tech/SettingTabs.vue');
    expect(registrySource).toContain('./sections/future-tech/SettingDisplay.vue');
    expect(registrySource).toContain('./sections/future-tech/SettingMessage.vue');
    expect(registrySource).toContain('./sections/future-tech/SettingAiChat.vue');
    expect(registrySource).toContain('./sections/future-tech/SettingAdvanced.vue');
    expect(registrySource).toContain("themeSectionOverrides");
  });

  it("registers all nine section keys in the component map", () => {
    expect(registrySource).toContain("SettingTheme");
    expect(registrySource).toContain("SettingLayout");
    expect(registrySource).toContain("SettingTabs");
    expect(registrySource).toContain("SettingToolbar");
    expect(registrySource).toContain("SettingDisplay");
    expect(registrySource).toContain("SettingMenu");
    expect(registrySource).toContain("SettingMessage");
    expect(registrySource).toContain("SettingAiChat");
    expect(registrySource).toContain("SettingAdvanced");
  });

  it("falls back to the default section map for unsupported themes", () => {
    expect(registrySource).toContain("isSupportedSettingTheme");
    expect(registrySource).toContain("themeComponentMaps.default");
  });
});
