/**
 * 主题配置文件
 * 集中管理 data-skin 主题、第三方组件映射和项目内主题组件映射
 */

import type { App } from "vue";

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
    packageName: "element-plus",
    enabled: true,
    group: "beta",
    description: "纯 SCSS 驱动的像素风格主题",
    componentMap: DEFAULT_COMPONENT_MAP,
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

export async function autoRegisterThemePlugins(_app: App): Promise<void> {
  return;
}

export async function ensureThemePluginForCurrentSkin(): Promise<void> {
  return;
}
