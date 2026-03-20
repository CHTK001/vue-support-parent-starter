/**
 * 主题配置文件
 * 集中管理 data-skin 主题、第三方组件映射和项目内主题组件映射
 */

import type { App, Component } from "vue";
import { storageLocal } from "@pureadmin/utils";

export interface ThemeComponentMap {
  [componentName: string]: string;
}

export interface ThemeLocalComponentConfig {
  loader: () => Promise<any>;
  exportName?: string;
}

export interface ThemeLocalComponentMap {
  [componentName: string]: ThemeLocalComponentConfig;
}

export interface ThemeConfig {
  name: string;
  displayName: string;
  packageName: string;
  pluginPackageName?: string;
  cssPath?: string;
  componentMap: ThemeComponentMap;
  localComponents?: ThemeLocalComponentMap;
  enabled?: boolean;
  autoInstallPlugin?: boolean;
  group?: "stable" | "beta" | "experimental";
  description?: string;
}

export const ACTIVE_THEME_KEYS = [
  "default",
  "8bit",
  "future-tech",
  "halloween",
  "christmas",
  "spring-festival",
] as const;

export type SupportedThemeKey = typeof ACTIVE_THEME_KEYS[number];

const DEFAULT_COMPONENT_MAP: ThemeComponentMap = {
  ElButton: "ElButton",
  ElInput: "ElInput",
  ElSelect: "ElSelect",
  ElCheckbox: "ElCheckbox",
  ElRadio: "ElRadio",
  ElSlider: "ElSlider",
  ElInputNumber: "ElInputNumber",
  ElRate: "ElRate",
  ElColorPicker: "ElColorPicker",
  ElTimePicker: "ElTimePicker",
  ElDatePicker: "ElDatePicker",
  ElCascader: "ElCascader",
  ElAutocomplete: "ElAutocomplete",
  ElSwitch: "ElSwitch",
  ElTag: "ElTag",
  ElBadge: "ElBadge",
  ElAlert: "ElAlert",
  ElLink: "ElLink",
  ElDivider: "ElDivider",
  ElAvatar: "ElAvatar",
  ElProgress: "ElProgress",
  ElText: "ElText",
  ElTooltip: "ElTooltip",
  ElPopover: "ElPopover",
  ElPopconfirm: "ElPopconfirm",
  ElForm: "ElForm",
  ElFormItem: "ElFormItem",
  ElRow: "ElRow",
  ElCol: "ElCol",
  ElTabs: "ElTabs",
  ElMenu: "ElMenu",
  ElBreadcrumb: "ElBreadcrumb",
  ElSteps: "ElSteps",
  ElDialog: "ElDialog",
  ElDrawer: "ElDrawer",
  ElCard: "ElCard",
  ElTable: "ElTable",
  ElUpload: "ElUpload",
  ElImage: "ElImage",
  ElTree: "ElTree",
  ElIcon: "ElIcon",
  ElEmpty: "ElEmpty",
  ElTableColumn: "ElTableColumn",
  ElOption: "ElOption",
};

const PIXEL_COMPONENT_MAP: ThemeComponentMap = {
  ...DEFAULT_COMPONENT_MAP,
  ElButton: "PxButton",
  ElInput: "PxInput",
  ElTag: "PxTag",
  ElBadge: "PxBadge",
  ElAlert: "PxAlert",
  ElProgress: "PxProgress",
  ElText: "PxText",
  ElImage: "PxImage",
  ElIcon: "PxIcon",
  ElTooltip: "PxTooltip",
  ElPopconfirm: "PxPopconfirm",
  ElCard: "PxCard",
};

const createLocalComponents = (
  buttonLoader: () => Promise<any>,
  cardLoader: () => Promise<any>,
): ThemeLocalComponentMap => ({
  ElButton: { loader: buttonLoader },
  ElCard: { loader: cardLoader },
});

const LOCAL_THEME_COMPONENTS: Record<SupportedThemeKey, ThemeLocalComponentMap> = {
  default: {},
  "8bit": {},
  "future-tech": createLocalComponents(
    () => import("../ScButton/src/theme-components/FutureTechButton.vue"),
    () => import("../ScCard/theme-components/FutureTechCard.vue"),
  ),
  halloween: createLocalComponents(
    () => import("../ScButton/src/theme-components/HalloweenButton.vue"),
    () => import("../ScCard/theme-components/HalloweenCard.vue"),
  ),
  christmas: createLocalComponents(
    () => import("../ScButton/src/theme-components/ChristmasButton.vue"),
    () => import("../ScCard/theme-components/ChristmasCard.vue"),
  ),
  "spring-festival": createLocalComponents(
    () => import("../ScButton/src/theme-components/SpringFestivalButton.vue"),
    () => import("../ScCard/theme-components/SpringFestivalCard.vue"),
  ),
};

const createElementPlusThemeConfig = (
  name: Exclude<SupportedThemeKey, "8bit">,
  displayName: string,
  description: string,
): ThemeConfig => ({
  name,
  displayName,
  packageName: "element-plus",
  enabled: true,
  group: "stable",
  description,
  componentMap: DEFAULT_COMPONENT_MAP,
  localComponents: LOCAL_THEME_COMPONENTS[name],
});

export const THEME_CONFIGS: Record<SupportedThemeKey, ThemeConfig> = {
  default: createElementPlusThemeConfig(
    "default",
    "默认主题",
    "使用 Element Plus 原生组件",
  ),
  "8bit": {
    name: "8bit",
    displayName: "8bit 像素风格",
    packageName: "@mmt817/pixel-ui",
    cssPath: "dist/index.css",
    enabled: true,
    autoInstallPlugin: true,
    pluginPackageName: "@mmt817/pixel-ui",
    group: "beta",
    description: "像素风格，复古游戏风",
    componentMap: PIXEL_COMPONENT_MAP,
    localComponents: LOCAL_THEME_COMPONENTS["8bit"],
  },
  "future-tech": createElementPlusThemeConfig(
    "future-tech",
    "未来科技",
    "赛博绿金科技主题",
  ),
  halloween: createElementPlusThemeConfig(
    "halloween",
    "万圣节",
    "万圣节氛围主题",
  ),
  christmas: createElementPlusThemeConfig(
    "christmas",
    "圣诞节",
    "圣诞松绿金色主题",
  ),
  "spring-festival": createElementPlusThemeConfig(
    "spring-festival",
    "春节",
    "红底金字节庆主题",
  ),
};

export function getThemeConfig(skinValue: string | undefined): ThemeConfig | null {
  if (!skinValue) {
    return null;
  }

  const config = THEME_CONFIGS[skinValue as SupportedThemeKey];
  if (!config || config.enabled === false) {
    return null;
  }

  return config;
}

export function getThemeComponentName(
  skinValue: string | undefined,
  elementComponentName: string,
): string | null {
  const config = getThemeConfig(skinValue);

  if (!config) {
    return null;
  }

  return config.componentMap[elementComponentName] || null;
}

export function getThemeLocalComponentConfig(
  skinValue: string | undefined,
  localComponentName: string,
): ThemeLocalComponentConfig | null {
  const config = getThemeConfig(skinValue);

  if (!config?.localComponents) {
    return null;
  }

  return config.localComponents[localComponentName] || null;
}

export function getEnabledThemes(): ThemeConfig[] {
  return Object.values(THEME_CONFIGS).filter(config => config.enabled !== false);
}

export function getThemesByGroup(): Record<string, ThemeConfig[]> {
  const themes = getEnabledThemes();
  const grouped: Record<string, ThemeConfig[]> = {
    stable: [],
    beta: [],
    experimental: [],
  };

  themes.forEach(theme => {
    const group = theme.group || "stable";
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(theme);
  });

  return grouped;
}

export function hasTheme(skinValue: string): boolean {
  return skinValue in THEME_CONFIGS && THEME_CONFIGS[skinValue as SupportedThemeKey].enabled !== false;
}

const PLUGIN_IMPORTERS: Record<string, () => Promise<any>> = {
  "@mmt817/pixel-ui": () => import("@mmt817/pixel-ui"),
};

const REGISTERED_THEME_PLUGINS_BY_APP = new WeakMap<App, Set<string>>();
const REGISTERING_PROMISES_BY_APP = new WeakMap<App, Map<string, Promise<void>>>();

let themePluginApp: App | null = null;
let ensuringPromise: Promise<void> | null = null;

function getCurrentThemeName(): SupportedThemeKey {
  if (typeof document !== "undefined") {
    const skin = document.documentElement.dataset.skin as SupportedThemeKey | undefined;
    if (skin && THEME_CONFIGS[skin]?.enabled !== false) {
      return skin;
    }
  }

  try {
    const configure = storageLocal().getItem<any>("responsive-configure") || {};
    let theme = configure.systemTheme as string | undefined;
    if (theme) {
      if (theme === "pixel-art" || theme === "8-bit") {
        theme = "8bit";
      }
      if (THEME_CONFIGS[theme as SupportedThemeKey]?.enabled !== false) {
        return theme as SupportedThemeKey;
      }
    }
  } catch {
    // ignore storage read errors and fall back to default
  }

  return "default";
}

async function registerThemePluginForSkin(app: App, skinValue: string): Promise<void> {
  const theme = THEME_CONFIGS[skinValue as SupportedThemeKey];

  if (!theme) {
    // eslint-disable-next-line no-console
    console.warn(`[ThemePlugin] 当前主题 ${skinValue} 未在配置中找到`);
    return;
  }

  if (theme.enabled === false || theme.autoInstallPlugin !== true) {
    return;
  }

  const packageName = theme.pluginPackageName || theme.packageName;
  if (!packageName) {
    return;
  }

  let registeredPlugins = REGISTERED_THEME_PLUGINS_BY_APP.get(app);
  if (!registeredPlugins) {
    registeredPlugins = new Set<string>();
    REGISTERED_THEME_PLUGINS_BY_APP.set(app, registeredPlugins);
  }

  if (registeredPlugins.has(packageName)) {
    return;
  }

  let registeringPromises = REGISTERING_PROMISES_BY_APP.get(app);
  if (!registeringPromises) {
    registeringPromises = new Map<string, Promise<void>>();
    REGISTERING_PROMISES_BY_APP.set(app, registeringPromises);
  }

  const existingPromise = registeringPromises.get(packageName);
  if (existingPromise) {
    await existingPromise;
    if (registeredPlugins.has(packageName)) {
      return;
    }
  }

  const registerPromise = (async () => {
    try {
      const importer = PLUGIN_IMPORTERS[packageName];
      if (!importer) {
        // eslint-disable-next-line no-console
        console.warn(`[ThemePlugin] 主题 ${theme.name} 的插件包 ${packageName} 未在 PLUGIN_IMPORTERS 中注册`);
        theme.enabled = false;
        return;
      }

      const module: any = await importer();
      const plugin = module?.default ?? module;

      if (!plugin) {
        console.warn(`[ThemePlugin] 插件 ${packageName} 加载后返回 null/undefined`);
        return;
      }

      const context = (app as any)._context;
      const plugins = context?.plugins;

=======
      // 检查是否已注册：通过比较插件对象引用或 install 方法
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
      let alreadyRegisteredInApp = false;
      if (Array.isArray(plugins) && plugins.length > 0) {
        const pluginInstall = typeof plugin === "function" ? plugin : plugin.install;

          const pluginName = pluginInstall?.name || plugin.name;
          const registeredName = registeredInstall?.name || registeredPlugin?.name;
          if (pluginName && registeredName && pluginName === registeredName && pluginName !== "") {
            return true;
          }

          return false;
        });
      }

      if (alreadyRegisteredInApp) {
        registeredPlugins.add(packageName);
        return;
      }

      registeredPlugins.add(packageName);
      // eslint-disable-next-line no-console
      console.warn(`[ThemePlugin] 主题 ${theme.name} 插件加载失败，已禁用该主题:`, error);
      theme.enabled = false;
      throw error;
    } finally {
      const registeringPromises = REGISTERING_PROMISES_BY_APP.get(app);
      if (registeringPromises) {
        registeringPromises.delete(packageName);
      }
    }
  })();

  registeringPromises.set(packageName, registerPromise);
  await registerPromise;
}

export async function autoRegisterThemePlugins(app: App): Promise<void> {
  themePluginApp = app;
  const currentThemeName = getCurrentThemeName();
  await registerThemePluginForSkin(app, currentThemeName);
}

export async function ensureThemePluginForCurrentSkin(): Promise<void> {
  if (!themePluginApp) {
    return;
  }

  ensuringPromise = (async () => {
    try {
      const currentThemeName = getCurrentThemeName();
      await registerThemePluginForSkin(themePluginApp!, currentThemeName);
    } finally {
      ensuringPromise = null;
    }
  })();

  await ensuringPromise;
}
