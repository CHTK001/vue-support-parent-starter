/**
 * 系统设置主题组件注册中心
 * 按主题装配真实分区组件，缺失部分回退基础实现。
 *
 * 当前实现按需异步加载分区组件，避免 6 套主题配置在首次打开设置面板前全部进入主链。
 */
import { defineAsyncComponent, type Component } from "vue";

type SettingComponentKey =
  | "SettingTheme"
  | "SettingLayout"
  | "SettingTabs"
  | "SettingToolbar"
  | "SettingDisplay"
  | "SettingMenu"
  | "SettingMessage"
  | "SettingAiChat"
  | "SettingAdvanced";

export interface ComponentMap {
  SettingTheme: Component;
  SettingLayout: Component;
  SettingTabs: Component;
  SettingToolbar: Component;
  SettingDisplay: Component;
  SettingMenu: Component;
  SettingMessage: Component;
  SettingAiChat: Component;
  SettingAdvanced: Component;
}

export const supportedSettingThemes = [
  "default",
  "tech",
] as const;

type SupportedSettingTheme = (typeof supportedSettingThemes)[number];
type VueModule = { default: Component };
type VueLoader = () => Promise<VueModule>;

const baseSectionModules = import.meta.glob(
  "../themes/components/*.vue",
) as Record<string, VueLoader>;
const themeSectionModules = import.meta.glob(
  "./sections/*/*.vue",
) as Record<string, VueLoader>;

const baseComponentPaths: Record<SettingComponentKey, string> = {
  SettingTheme: "../themes/components/SettingTheme.vue",
  SettingLayout: "../themes/components/SettingLayout.vue",
  SettingTabs: "../themes/components/SettingTabs.vue",
  SettingToolbar: "../themes/components/SettingToolbar.vue",
  SettingDisplay: "../themes/components/SettingDisplay.vue",
  SettingMenu: "../themes/components/SettingMenu.vue",
  SettingMessage: "../themes/components/SettingMessage.vue",
  SettingAiChat: "../themes/components/SettingAiChat.vue",
  SettingAdvanced: "../themes/components/SettingAdvanced.vue",
};

const themeSectionOverrides: Record<
  SupportedSettingTheme,
  Partial<Record<SettingComponentKey, string>>
> = {
  default: {
    SettingTheme: "./sections/default/SettingTheme.vue",
    SettingLayout: "./sections/default/SettingLayout.vue",
    SettingTabs: "./sections/default/SettingTabs.vue",
    SettingToolbar: "./sections/default/SettingToolbar.vue",
    SettingDisplay: "./sections/default/SettingDisplay.vue",
    SettingMenu: "./sections/default/SettingMenu.vue",
    SettingMessage: "./sections/default/SettingMessage.vue",
    SettingAiChat: "./sections/default/SettingAiChat.vue",
    SettingAdvanced: "./sections/default/SettingAdvanced.vue",
  },
  "tech": {
    SettingTheme: "./sections/tech/SettingTheme.vue",
    SettingLayout: "./sections/tech/SettingLayout.vue",
    SettingTabs: "./sections/tech/SettingTabs.vue",
    SettingToolbar: "./sections/tech/SettingToolbar.vue",
    SettingDisplay: "./sections/tech/SettingDisplay.vue",
    SettingMenu: "./sections/tech/SettingMenu.vue",
    SettingMessage: "./sections/tech/SettingMessage.vue",
    SettingAiChat: "./sections/tech/SettingAiChat.vue",
    SettingAdvanced: "./sections/tech/SettingAdvanced.vue",
  },
};

const lazyComponentCache = new Map<string, Component>();

const resolveModuleLoader = (modulePath: string): VueLoader | undefined =>
  themeSectionModules[modulePath] ?? baseSectionModules[modulePath];

const createLazyComponent = (
  modulePath: string,
  fallbackPath?: string,
): Component => {
  const cacheKey = `${modulePath}::${fallbackPath ?? ""}`;
  const cached = lazyComponentCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const asyncComponent = defineAsyncComponent({
    loader: async () => {
      const loader =
        resolveModuleLoader(modulePath) ??
        (fallbackPath ? resolveModuleLoader(fallbackPath) : undefined);
      if (!loader) {
        throw new Error(
          `[lay-setting] Missing section component loader: ${modulePath}`,
        );
      }
      const module = await loader();
      return module.default;
    },
    delay: 0,
    suspensible: false,
  });

  lazyComponentCache.set(cacheKey, asyncComponent);
  return asyncComponent;
};

const buildComponentMap = (
  overrides: Partial<Record<SettingComponentKey, string>> = {},
): ComponentMap => ({
  SettingTheme: createLazyComponent(
    overrides.SettingTheme ?? baseComponentPaths.SettingTheme,
    baseComponentPaths.SettingTheme,
  ),
  SettingLayout: createLazyComponent(
    overrides.SettingLayout ?? baseComponentPaths.SettingLayout,
    baseComponentPaths.SettingLayout,
  ),
  SettingTabs: createLazyComponent(
    overrides.SettingTabs ?? baseComponentPaths.SettingTabs,
    baseComponentPaths.SettingTabs,
  ),
  SettingToolbar: createLazyComponent(
    overrides.SettingToolbar ?? baseComponentPaths.SettingToolbar,
    baseComponentPaths.SettingToolbar,
  ),
  SettingDisplay: createLazyComponent(
    overrides.SettingDisplay ?? baseComponentPaths.SettingDisplay,
    baseComponentPaths.SettingDisplay,
  ),
  SettingMenu: createLazyComponent(
    overrides.SettingMenu ?? baseComponentPaths.SettingMenu,
    baseComponentPaths.SettingMenu,
  ),
  SettingMessage: createLazyComponent(
    overrides.SettingMessage ?? baseComponentPaths.SettingMessage,
    baseComponentPaths.SettingMessage,
  ),
  SettingAiChat: createLazyComponent(
    overrides.SettingAiChat ?? baseComponentPaths.SettingAiChat,
    baseComponentPaths.SettingAiChat,
  ),
  SettingAdvanced: createLazyComponent(
    overrides.SettingAdvanced ?? baseComponentPaths.SettingAdvanced,
    baseComponentPaths.SettingAdvanced,
  ),
});

const defaultComponentMap = buildComponentMap();

export const SettingTheme = defaultComponentMap.SettingTheme;
export const SettingLayout = defaultComponentMap.SettingLayout;
export const SettingTabs = defaultComponentMap.SettingTabs;
export const SettingToolbar = defaultComponentMap.SettingToolbar;
export const SettingDisplay = defaultComponentMap.SettingDisplay;
export const SettingMenu = defaultComponentMap.SettingMenu;
export const SettingMessage = defaultComponentMap.SettingMessage;
export const SettingAiChat = defaultComponentMap.SettingAiChat;
export const SettingAdvanced = defaultComponentMap.SettingAdvanced;

const themeComponentMaps: Record<SupportedSettingTheme, ComponentMap> = {
  default: buildComponentMap(themeSectionOverrides.default),
  "tech": buildComponentMap(themeSectionOverrides["tech"]),
};

function isSupportedSettingTheme(
  theme: string,
): theme is SupportedSettingTheme {
  return supportedSettingThemes.includes(theme as SupportedSettingTheme);
}

export function getThemeComponents(theme: string): ComponentMap {
  return isSupportedSettingTheme(theme)
    ? themeComponentMaps[theme]
    : themeComponentMaps.default;
}
