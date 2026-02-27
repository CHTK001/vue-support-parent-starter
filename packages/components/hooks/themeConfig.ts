/**
 * 主题配置文件
 * 集中管理所有 data-skin 主题和对应的组件库映射
 *
 * 新增主题时只需要在这里添加配置即可，无需修改每个组件
 */

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
    enabled: true,
    componentMap: {
      // 表单输入组件
      ElButton: "PxButton",
      ElInput: "PxInput",
      ElSelect: "PxSelect",
      ElCheckbox: "PxCheckbox",
      ElRadio: "PxRadio",
      ElSlider: "PxSlider",
      ElInputNumber: "PxInputNumber",
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
      ElDialog: "PxDialog",
      ElDrawer: "PxDrawer",

      // 高级组件
      ElCard: "PxCard",
      ElTable: "PxTable",

      // 其他组件
      ElUpload: "PxUpload",
      ElImage: "PxImage",
      ElTree: "PxTree",
      ElIcon: "PxIcon",
      ElEmpty: "PxEmpty",
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
 * 检查主题是否存在
 * @param skinValue data-skin 属性值
 * @returns 是否存在该主题
 */
export function hasTheme(skinValue: string): boolean {
  return skinValue in THEME_CONFIGS && THEME_CONFIGS[skinValue].enabled !== false;
}
