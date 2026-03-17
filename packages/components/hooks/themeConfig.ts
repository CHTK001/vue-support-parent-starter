/**
 * 主题配置文件
 * 集中管理所有 data-skin 主题和对应的组件库映射
 *
 * 新增主题时只需要在这里添加配置即可，无需修改每个组件
 */

import type { App } from "vue";
import { storageLocal } from "@pureadmin/utils";

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
      ElText: "ElText",

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
    // 使用 @mmt817/pixel-ui 作为像素主题组件库
    packageName: "@mmt817/pixel-ui",
    // CSS 入口：dist/index.css
    cssPath: "dist/index.css",
    enabled: true,
    autoInstallPlugin: true,
    pluginPackageName: "@mmt817/pixel-ui",
    group: "beta",
    description: "像素风格，复古游戏风",
    componentMap: {
      // 表单输入组件
      ElButton: "PxButton",
      ElInput: "PxInput",
      // 以下组件在 @mmt817/pixel-ui 中不存在，回退 Element Plus
      // ElSelect: "PxSelect",
      // ElCheckbox: "PxCheckbox",
      // ElRadio: "PxRadio",
      // ElSlider: "PxSlider",
      // ElAutocomplete: "PxAutocomplete",
      // ElSwitch: "PxSwitch",

      // 基础组件
      ElTag: "PxTag",
      ElBadge: "PxBadge",
      ElAlert: "PxAlert",
      ElProgress: "PxProgress",
      ElText: "PxText",
      ElImage: "PxImage",
      ElIcon: "PxIcon",
      // 以下组件在 @mmt817/pixel-ui 中不存在，回退 Element Plus
      // ElLink: "PxLink",
      // ElDivider: "PxDivider",
      // ElAvatar: "PxAvatar",

      // 弹出层组件
      ElTooltip: "PxTooltip",
      ElPopconfirm: "PxPopconfirm",
      // ElPopover 在 @mmt817/pixel-ui 中不存在，回退 Element Plus
      // ElPopover: "PxPopover",

      // 高级组件
      ElCard: "PxCard",
      ElTable: "ElTable",       // Table 仍使用 Element Plus
      ElTableColumn: "ElTableColumn",

      // 以下组件在 @mmt817/pixel-ui 中不存在，回退 Element Plus
      // ElForm: "PxForm",
      // ElFormItem: "PxFormItem",
      // ElRow: "PxRow",
      // ElMenu: "PxMenu",
      // ElBreadcrumb: "PxBreadcrumb",
      // ElDrawer: "ElDrawer",
      // ElOption: "PxOption",
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
 * 主题插件包名到导入函数的映射
 * 使用映射而非动态字符串，以便 Vite 能够静态分析并预构建这些依赖
 */
const PLUGIN_IMPORTERS: Record<string, () => Promise<any>> = {
  "@mmt817/pixel-ui": () => import("@mmt817/pixel-ui"),
};

/**
 * 已注册的主题插件包名集合（按 app 实例记录）
 * 使用 WeakMap 避免内存泄漏，key 是 app 实例，value 是已注册的插件包名 Set
 */
const REGISTERED_THEME_PLUGINS_BY_APP = new WeakMap<App, Set<string>>();

/**
 * 正在进行的插件注册 Promise 缓存（按 app 实例和包名记录）
 * 用于解决并发调用时的重复注册问题
 * key: app 实例，value: Map<packageName, Promise<void>>
 */
const REGISTERING_PROMISES_BY_APP = new WeakMap<App, Map<string, Promise<void>>>();

/**
 * 最近一次用于注册主题插件的应用实例
 * 用于在主题切换时按当前 data-skin 重新注册对应主题插件
 */
let themePluginApp: App | null = null;

/**
 * 正在进行的 ensureThemePluginForCurrentSkin 调用 Promise 缓存
 * 用于解决并发调用时的重复执行问题
 */
let ensuringPromise: Promise<void> | null = null;

/**
 * 获取当前激活的主题名称
 * @returns 当前主题名称，默认为 "default"
 */
function getCurrentThemeName(): string {
  // 浏览器环境优先
  if (typeof document !== "undefined") {
    const skin = document.documentElement.dataset.skin;
    if (skin) {
      return skin;
    }
  }

  // 如果 DOM 上还没有 data-skin（例如应用刚启动时），尝试从本地配置读取
  try {
    const configure = storageLocal().getItem<any>("responsive-configure") || {};
    let theme = configure.systemTheme as string | undefined;
    if (theme) {
      // 兼容旧值
      if (theme === "pixel-art" || theme === "8-bit") {
        theme = "8bit";
      }
      if (THEME_CONFIGS[theme] && THEME_CONFIGS[theme].enabled !== false) {
        return theme;
      }
    }
  } catch {
    // 本地存储异常时回退默认主题
  }

  return "default";
}

/**
 * 为指定 skin 注册主题插件（内部工具方法）
 * - 只处理 autoInstallPlugin = true 的主题
 * - 使用 REGISTERED_THEME_PLUGINS 避免重复注册
 * - 插件加载失败时自动禁用对应主题，避免出现在系统设置中
 */
async function registerThemePluginForSkin(app: App, skinValue: string): Promise<void> {
  const theme = THEME_CONFIGS[skinValue];

  // 只处理当前使用的主题
  if (!theme) {
    // eslint-disable-next-line no-console
    console.warn(
      `[ThemePlugin] 当前主题 ${skinValue} 未在配置中找到`,
    );
    return;
  }

  if (theme.enabled === false || theme.autoInstallPlugin !== true) {
    // 当前主题不需要注册插件
    return;
  }

  const packageName = theme.pluginPackageName || theme.packageName;

  if (!packageName) {
    return;
  }

  // 获取当前 app 实例已注册的插件集合
  let registeredPlugins = REGISTERED_THEME_PLUGINS_BY_APP.get(app);
  if (!registeredPlugins) {
    registeredPlugins = new Set<string>();
    REGISTERED_THEME_PLUGINS_BY_APP.set(app, registeredPlugins);
  }

  // 已经注册过的插件不再重复注册
  if (registeredPlugins.has(packageName)) {
    return;
  }

  // 检查是否有正在进行的注册 Promise
  let registeringPromises = REGISTERING_PROMISES_BY_APP.get(app);
  if (!registeringPromises) {
    registeringPromises = new Map<string, Promise<void>>();
    REGISTERING_PROMISES_BY_APP.set(app, registeringPromises);
  }

  // 如果有正在进行的注册，等待它完成
  const existingPromise = registeringPromises.get(packageName);
  if (existingPromise) {
    await existingPromise;
    // 等待完成后再次检查是否已注册
    if (registeredPlugins.has(packageName)) {
      return;
    }
  }

  // 创建新的注册 Promise 并缓存
  const registerPromise = (async () => {
    try {
      // 使用映射表加载插件，确保 Vite 能够静态分析并预构建依赖
      const importer = PLUGIN_IMPORTERS[packageName];
      if (!importer) {
        // eslint-disable-next-line no-console
        console.warn(
          `[ThemePlugin] 主题 ${theme.name} 的插件包 ${packageName} 未在 PLUGIN_IMPORTERS 中注册`,
        );
        theme.enabled = false;
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const module: any = await importer();
      const plugin = module?.default ?? module;

      if (!plugin) {
        console.warn(`[ThemePlugin] 插件 ${packageName} 加载后返回 null/undefined`);
        return;
      }

      // 在注册前再次检查 Vue 内部是否已注册
      // Vue 3 会在 app._context.plugins 中存储已注册的插件
      const context = (app as any)._context;
      const plugins = context?.plugins;
      
      // 检查是否已注册：通过比较插件对象引用或 install 方法
      let alreadyRegisteredInApp = false;
      if (Array.isArray(plugins) && plugins.length > 0) {
        const pluginInstall = typeof plugin === 'function' ? plugin : plugin.install;
        
        // 检查已注册的插件中是否有相同的插件对象或 install 方法
        alreadyRegisteredInApp = plugins.some((registeredPlugin: any) => {
          // 先检查对象引用是否相同
          if (registeredPlugin === plugin) {
            return true;
          }
          
          // 再检查 install 方法是否相同
          const registeredInstall = typeof registeredPlugin === 'function' 
            ? registeredPlugin 
            : registeredPlugin?.install;
          
          // 如果两个插件都有 install 方法，比较 install 方法的引用
          if (pluginInstall && registeredInstall && pluginInstall === registeredInstall) {
            return true;
          }
          
          // 如果插件有名称，通过名称比较（作为最后的检查手段）
          const pluginName = pluginInstall?.name || plugin.name;
          const registeredName = registeredInstall?.name || registeredPlugin?.name;
          if (pluginName && registeredName && pluginName === registeredName && pluginName !== '') {
            return true;
          }
          
          return false;
        });
      }

      if (alreadyRegisteredInApp) {
        // 即使 Vue 内部已注册，也记录到我们的集合中，避免后续重复检查
        registeredPlugins.add(packageName);
        return;
      }

      // 在调用 app.use 之前就记录包名，避免并发调用时重复注册
      registeredPlugins.add(packageName);
      
      app.use(plugin);
      // eslint-disable-next-line no-console
      console.log(`[ThemePlugin] 已注册主题 ${theme.name} 的插件 ${packageName}`);
    } catch (error) {
      // 插件注册失败时，从记录中移除，允许后续重试
      const registeredPlugins = REGISTERED_THEME_PLUGINS_BY_APP.get(app);
      if (registeredPlugins) {
        registeredPlugins.delete(packageName);
      }
      
      // 插件未安装或加载失败时，禁用该主题，避免在设置中展示不可用的选项
      // eslint-disable-next-line no-console
      console.warn(
        `[ThemePlugin] 主题 ${theme.name} 插件加载失败，已禁用该主题:`,
        error,
      );
      theme.enabled = false;
      throw error; // 重新抛出错误，让调用者知道注册失败
    } finally {
      // 注册完成（成功或失败）后，从缓存中移除 Promise
      const registeringPromises = REGISTERING_PROMISES_BY_APP.get(app);
      if (registeringPromises) {
        registeringPromises.delete(packageName);
      }
    }
  })();

  // 缓存 Promise
  registeringPromises.set(packageName, registerPromise);

  // 等待注册完成
  await registerPromise;
}

/**
 * 根据当前 data-skin 自动注册当前主题需要的 Vue 插件
 * - 只注册当前使用的主题插件（根据 data-skin 属性）
 * - 只处理 autoInstallPlugin = true 的主题
 * - 插件加载失败时自动禁用对应主题，避免出现在系统设置中
 */
export async function autoRegisterThemePlugins(app: App): Promise<void> {
  themePluginApp = app;
  const currentThemeName = getCurrentThemeName();
  await registerThemePluginForSkin(app, currentThemeName);
}

/**
 * 在主题切换后，基于当前 data-skin 确保对应主题插件已注册
 * 需要在应用启动时先调用一次 autoRegisterThemePlugins 以保存 app 实例
 * 使用 Promise 缓存避免并发调用时的重复执行
 */
export async function ensureThemePluginForCurrentSkin(): Promise<void> {
  if (!themePluginApp) {
    return;
  }
  
  // 如果有正在进行的调用，直接返回该 Promise，避免重复执行
  if (ensuringPromise) {
    await ensuringPromise;
    return;
  }
  
  // 创建新的调用 Promise
  ensuringPromise = (async () => {
    try {
      const currentThemeName = getCurrentThemeName();
      await registerThemePluginForSkin(themePluginApp!, currentThemeName);
    } finally {
      // 调用完成后清除缓存
      ensuringPromise = null;
    }
  })();
  
  await ensuringPromise;
}
