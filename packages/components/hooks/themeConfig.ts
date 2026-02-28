/**
 * 主题配置文件
 * 集中管理所有 data-skin 主题和对应的组件库映射
 *
 * 新增主题时只需要在这里添加配置即可，无需修改每个组件
 */

import type { App } from "vue";

/**
 * 主题组件映射类型
 */
export interface ThemeComponentMap {
  [componentName: string]: string; // Element Plus 组件名 -> 主题组件名
}

/**
 * 主题配置类型
 */
export interface ThemeConfig {
  /**
   * 主题名称（对应 data-skin 的值）
   */
  name: string;

  /**
   * 主题显示名称
   */
  displayName: string;

  /**
   * 组件库包名
   */
  packageName: string;

  /**
   * 需要通过 app.use 注册的主题插件包名
   * 不配置时默认使用 packageName
   */
  pluginPackageName?: string;

  /**
   * CSS 文件路径（相对于包）
   */
  cssPath?: string;

  /**
   * 组件名称映射
   * key: Element Plus 组件名（如 'ElSlider'）
   * value: 主题组件名（如 'PxSlider'）
   */
  componentMap: ThemeComponentMap;

  /**
   * 是否启用
   */
  enabled?: boolean;

  /**
   * 是否在应用启动时自动尝试注册插件（app.use）
   */
  autoInstallPlugin?: boolean;

  /**
   * 主题分组（用于分类显示）
   */
  group?: "stable" | "beta" | "experimental";

  /**
   * 主题描述
   */
  description?: string;
}

/**
 * 所有主题配置
 * 新增主题时在这里添加配置
 */
export const THEME_CONFIGS: Record<string, ThemeConfig> = {
  /**
   * default 默认主题（Element Plus 原生组件）
   */
  default: {
    name: "default",
    displayName: "默认主题",
    packageName: "element-plus",
    enabled: true,
    group: "stable",
    description: "使用 Element Plus 原生组件",
    componentMap: {
      // 表单输入组件
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

      // 基础组件
      ElTag: "ElTag",
      ElBadge: "ElBadge",
      ElAlert: "ElAlert",
      ElLink: "ElLink",
      ElDivider: "ElDivider",
      ElAvatar: "ElAvatar",
      ElProgress: "ElProgress",

      // 弹出层组件
      ElTooltip: "ElTooltip",
      ElPopover: "ElPopover",
      ElPopconfirm: "ElPopconfirm",

      // 表单容器
      ElForm: "ElForm",
      ElFormItem: "ElFormItem",

      // 布局组件
      ElRow: "ElRow",
      ElCol: "ElCol",
      ElTabs: "ElTabs",

      // 导航组件
      ElMenu: "ElMenu",
      ElBreadcrumb: "ElBreadcrumb",
      ElSteps: "ElSteps",

      // 对话框组件
      ElDialog: "ElDialog",
      ElDrawer: "ElDrawer",

      // 高级组件
      ElCard: "ElCard",
      ElTable: "ElTable",

      // 其他组件
      ElUpload: "ElUpload",
      ElImage: "ElImage",
      ElTree: "ElTree",
      ElIcon: "ElIcon",
      ElEmpty: "ElEmpty",
      ElTableColumn: "ElTableColumn",
      ElOption: "ElOption"
    }
  },

  /**
   * 8bit 像素风格主题
   */
  "8bit": {
    name: "8bit",
    displayName: "8bit 像素风格",
    packageName: "@mmt817/pixel-ui",
    cssPath: "dist/index.css",
    // 默认由配置系统自动判断是否可用
    enabled: true,
    // 自动尝试按需注册 PixelUI 插件
    autoInstallPlugin: true,
    pluginPackageName: "@mmt817/pixel-ui",
    group: "beta",
    description: "像素风格，复古游戏风",
    componentMap: {
      // 表单输入组件
      ElButton: "PxButton",
      ElInput: "PxInput",
      ElSelect: "PxSelect",
      ElCheckbox: "PxCheckbox",
      // 当前 PixelUI 未提供 Radio 组件，保持使用 Element Plus 原生组件
      ElRadio: "ElRadio",
      // 当前 PixelUI 未提供 Slider 组件，保持使用 Element Plus 原生组件
      ElSlider: "ElSlider",
      // 当前 PixelUI 未提供 InputNumber 组件，保持使用 Element Plus 原生组件
      ElInputNumber: "ElInputNumber",
      ElRate: "PxRate",
      ElColorPicker: "PxColorPicker",
      ElTimePicker: "PxTimePicker",
      ElDatePicker: "PxDatePicker",
      ElCascader: "PxCascader",
      ElAutocomplete: "PxAutocomplete",
      ElSwitch: "PxSwitch",

      // 基础组件
      ElTag: "PxTag",
      ElBadge: "PxBadge",
      ElAlert: "PxAlert",
      ElLink: "PxLink",
      ElDivider: "PxDivider",
      ElAvatar: "PxAvatar",
      ElProgress: "PxProgress",

      // 弹出层组件
      ElTooltip: "PxTooltip",
      ElPopover: "ElPopover",
      ElPopconfirm: "PxPopconfirm",

      // 表单容器
      ElForm: "PxForm",
      ElFormItem: "PxFormItem",

      // 布局组件
      ElRow: "PxRow",
      ElCol: "PxCol",
      ElTabs: "PxTabs",

      // 导航组件
      ElMenu: "PxMenu",
      ElBreadcrumb: "PxBreadcrumb",
      ElSteps: "PxSteps",

      // 对话框组件
      // 当前 PixelUI 未提供 Dialog / Drawer 组件，保持使用 Element Plus 原生组件
      ElDialog: "ElDialog",
      ElDrawer: "ElDrawer",

      // 高级组件
      ElCard: "PxCard",
      ElTable: "PxTable",

      // 其他组件
      ElUpload: "PxUpload",
      ElImage: "PxImage",
      ElTree: "PxTree",
      ElIcon: "PxIcon",
      // 当前 PixelUI 未提供 Empty 组件，保持使用 Element Plus 原生组件
      ElEmpty: "ElEmpty",
      ElTableColumn: "PxTableColumn",
      ElOption: "PxOption"
    }
  }

  // 未来可以在这里添加更多主题，例如：
  // "material": {
  //   name: "material",
  //   displayName: "Material Design",
  //   packageName: "@your-org/material-ui",
  //   cssPath: "dist/index.css",
  //   enabled: true,
  //   componentMap: {
  //     ElButton: "MdButton",
  //     ElInput: "MdInput",
  //     // ... 其他组件映射
  //   }
  // },
  // "fluent": {
  //   name: "fluent",
  //   displayName: "Fluent Design",
  //   packageName: "@your-org/fluent-ui",
  //   cssPath: "dist/index.css",
  //   enabled: true,
  //   componentMap: {
  //     ElButton: "FlButton",
  //     ElInput: "FlInput",
  //     // ... 其他组件映射
  //   }
  // }
};

/**
 * 获取当前激活的主题配置
 * @param skinValue data-skin 属性值
 * @returns 主题配置或 null
 */
export function getThemeConfig(skinValue: string | undefined): ThemeConfig | null {
  if (!skinValue) {
    return null;
  }

  const config = THEME_CONFIGS[skinValue];

  if (!config || config.enabled === false) {
    return null;
  }

  return config;
}

/**
 * 获取主题组件名称
 * @param skinValue data-skin 属性值
 * @param elementComponentName Element Plus 组件名
 * @returns 主题组件名称或 null
 */
export function getThemeComponentName(skinValue: string | undefined, elementComponentName: string): string | null {
  const config = getThemeConfig(skinValue);

  if (!config) {
    return null;
  }

  return config.componentMap[elementComponentName] || null;
}

/**
 * 获取所有启用的主题列表
 * @returns 启用的主题配置数组
 */
export function getEnabledThemes(): ThemeConfig[] {
  return Object.values(THEME_CONFIGS).filter(config => config.enabled !== false);
}

/**
 * 按分组获取主题列表
 * @returns 按分组分类的主题配置对象
 */
export function getThemesByGroup(): Record<string, ThemeConfig[]> {
  const themes = getEnabledThemes();
  const grouped: Record<string, ThemeConfig[]> = {
    stable: [],
    beta: [],
    experimental: []
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

/**
 * 检查主题是否存在
 * @param skinValue data-skin 属性值
 * @returns 是否存在该主题
 */
export function hasTheme(skinValue: string): boolean {
  return skinValue in THEME_CONFIGS && THEME_CONFIGS[skinValue].enabled !== false;
}

/**
 * 根据主题配置自动注册需要的 Vue 插件
 * - 只处理 autoInstallPlugin = true 的主题
 * - 插件加载失败时自动禁用对应主题，避免出现在系统设置中
 */
export async function autoRegisterThemePlugins(app: App): Promise<void> {
  const themes = Object.values(THEME_CONFIGS);

  for (const theme of themes) {
    if (theme.enabled === false || theme.autoInstallPlugin !== true) {
      continue;
    }

    const packageName = theme.pluginPackageName || theme.packageName;

    if (!packageName) {
      continue;
    }

    try {
      // 动态按包名加载插件，避免对未安装包的硬依赖
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const module: any = await import(
        /* @vite-ignore */ packageName
      );
      const plugin = module?.default ?? module;

      if (plugin) {
        app.use(plugin);
      }
    } catch (error) {
      // 插件未安装或加载失败时，禁用该主题，避免在设置中展示不可用的选项
      // eslint-disable-next-line no-console
      console.warn(
        `[ThemePlugin] 主题 ${theme.name} 插件加载失败，已禁用该主题:`,
        error,
      );
      theme.enabled = false;
    }
  }
}
