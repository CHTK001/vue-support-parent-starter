/**
 * 通用主题组件加载器
 * 根据 data-skin 自动加载对应主题的组件
 * 支持多主题扩展，新增主题只需修改 themeConfig.ts
 */

<<<<<<< HEAD
import { computed, watch, onBeforeUnmount, onMounted, shallowRef, ref, getCurrentInstance, type Component, type Ref } from "vue";
import { getThemeConfig, getThemeComponentName, getThemeLocalComponentConfig, THEME_CONFIGS, ensureThemePluginForCurrentSkin } from "./themeConfig";
=======
import { computed, watch, onBeforeUnmount, onMounted, shallowRef, ref, getCurrentInstance, type Component } from "vue";
import { getThemeConfig, getThemeComponentName, THEME_CONFIGS, ensureThemePluginForCurrentSkin } from "./themeConfig";
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
import * as ElementPlusModule from "element-plus";
import { storageLocal } from "@pureadmin/utils";
import { getLogger } from "@repo/utils";
import { emitter } from "@repo/core";

/**
 * Element Plus 组件映射表
 * 用于 default 主题的组件查找
 */
const ELEMENT_PLUS_COMPONENTS: Record<string, Component> = ElementPlusModule as any;

/**
 * 主题预加载状态
 */
const themePreloadStatus = new Map<string, boolean>();
let _logger: ReturnType<typeof getLogger> | null = null;
const getL = () => (_logger ??= getLogger("[useThemeComponent]"));
const logger = {
  warn: (msg: string, ...args: unknown[]) => getL().warn(msg, ...args),
  error: (msg: string, ...args: unknown[]) => getL().error(msg, ...args),
  info: (msg: string, ...args: unknown[]) => getL().info(msg, ...args),
  debug: (msg: string, ...args: unknown[]) => getL().debug(msg, ...args),
};

/**
 * 预加载指定主题的所有组件
 * @param themeName 主题名称
 */
export async function preloadTheme(themeName: string): Promise<void> {
  // 如果已经预加载过，直接返回
  if (themePreloadStatus.get(themeName)) {
    return;
  }

  const config = getThemeConfig(themeName);
  if (!config) {
    logger.warn(`[useThemeComponent] 主题 ${themeName} 不存在`);
    return;
  }

  // Element Plus 系主题不需要额外预加载（已经静态导入）
  if (themeName === "default" || config.packageName === "element-plus") {
    themePreloadStatus.set(themeName, true);
    return;
  }

  try {
    logger.info(`[useThemeComponent] 开始预加载主题: ${themeName}`);

    // 预加载主题组件库（按已知包名做静态导入，避免浏览器直接解析裸模块路径）
    if (config.packageName === "@mmt817/pixel-ui") {
      await import("@mmt817/pixel-ui");
    } else {
      console.warn(`[useThemeComponent] 预加载暂未适配主题包: ${config.packageName}`);
    }

    // 预加载主题 CSS：只提前拉取资源，不常驻样式，避免切回默认主题后像素字体残留
    if (config.cssPath) {
      await loadThemeCss(themeName);
      // 预加载完成后立刻释放引用，只保留浏览器缓存
      removeThemeCss(themeName);
    }

    themePreloadStatus.set(themeName, true);
    logger.info(`[useThemeComponent] 主题 ${themeName} 预加载完成`);
  } catch (error) {
    logger.error(`[useThemeComponent] 预加载主题 ${themeName} 失败:`, error);
  }
}

/**
 * 预加载所有启用的主题
 */
export async function preloadAllThemes(): Promise<void> {
  const themes = Object.values(THEME_CONFIGS).filter(config => config.enabled !== false);

  logger.info(`[useThemeComponent] 开始预加载 ${themes.length} 个主题`);

  await Promise.all(themes.map(theme => preloadTheme(theme.name)));

  logger.info("[useThemeComponent] 所有主题预加载完成");
}

/**
 * 切换主题（带预加载）
 * 先加载主题资源，加载完成后再切换 data-skin，避免闪烁
 * @param themeName 主题名称
 * @returns Promise，加载完成后 resolve
 */
export async function switchTheme(themeName: string): Promise<void> {
  const config = getThemeConfig(themeName);
  if (!config) {
    logger.warn(`[useThemeComponent] 主题 ${themeName} 不存在`);
    return;
  }

  // 先预加载主题资源
  await preloadTheme(themeName);

  // 加载完成后再切换 data-skin
  document.documentElement.setAttribute("data-skin", themeName);

  try {
    // 确保当前主题对应的插件已注册（例如 PixelUI）
    await ensureThemePluginForCurrentSkin();
  } catch (error) {
    logger.warn(`[useThemeComponent] 切换主题 ${themeName} 时注册主题插件失败:`, error);
  }

  logger.info(`[useThemeComponent] 主题已切换到: ${themeName}`);
}

/**
 * 当前激活的 data-skin 值
 */
const getCurrentSkin = (): string | undefined => {
  if (typeof document !== "undefined") {
    const skin = document.documentElement.dataset.skin;
    if (skin) {
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
      if (THEME_CONFIGS[theme] && THEME_CONFIGS[theme].enabled !== false) {
        return theme;
      }
    }
  } catch {
    // 忽略本地存储异常，回退到默认主题
  }

  return "default";
};

/**
 * 主题 CSS 样式链接引用（按主题名称存储）
 */
const themeStyleLinks = new Map<string, HTMLLinkElement>();

/**
 * 主题 CSS URL 缓存（按主题名称存储）
 */
const themeCssUrls = new Map<string, string>();

/**
 * 主题 CSS 引用计数（按主题名称存储）
 */
const themeCssRefCounts = new Map<string, number>();

/**
<<<<<<< HEAD
=======
 * Pixelium 可选 CSS 样式链接引用（normalize.css）
 */
const pixeliumOptionalStyleLinks = new Map<string, HTMLLinkElement>();

/**
 * Pixelium 可选 CSS URL 缓存
 */
const pixeliumOptionalCssUrls = new Map<string, string>();

/**
 * Pixelium 可选 CSS 引用计数
 */
const pixeliumOptionalCssRefCounts = new Map<string, number>();

/**
 * 加载 Pixelium 可选 CSS（normalize.css）
 * @param cssFileName CSS 文件名（normalize.css）
 */
const loadPixeliumOptionalCss = async (cssFileName: string): Promise<void> => {
  const linkId = `pixelium-${cssFileName.replace(".css", "")}-style`;
  const existingLink = document.getElementById(linkId) as HTMLLinkElement;

  if (existingLink) {
    pixeliumOptionalStyleLinks.set(cssFileName, existingLink);
    pixeliumOptionalCssRefCounts.set(cssFileName, (pixeliumOptionalCssRefCounts.get(cssFileName) || 0) + 1);
    return;
  }

  if (pixeliumOptionalStyleLinks.has(cssFileName)) {
    pixeliumOptionalCssRefCounts.set(cssFileName, (pixeliumOptionalCssRefCounts.get(cssFileName) || 0) + 1);
    return;
  }

  try {
    // 动态导入 CSS 文件获取 URL（使用静态路径，Vite 需要静态分析）
    if (!pixeliumOptionalCssUrls.has(cssFileName)) {
      try {
        let cssModule: any;
        // 使用静态导入路径，Vite 需要静态分析才能正确处理 ?url 后缀
        if (cssFileName === "normalize.css") {
          // @ts-ignore - Vite 支持 ?url 后缀，但 TypeScript 可能不识别
          cssModule = await import("@pixelium/web-vue/dist/normalize.css?url");
        } else {
          logger.warn(`[useThemeComponent] 不支持的 Pixelium CSS 文件: ${cssFileName}`);
          return;
        }
        const cssUrl = typeof cssModule === "string" ? cssModule : cssModule.default || cssModule;
        pixeliumOptionalCssUrls.set(cssFileName, cssUrl);
      } catch (error) {
        // 可选样式加载失败不影响主题使用，静默跳过
        return;
      }
    }

    // 创建 link 标签
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = pixeliumOptionalCssUrls.get(cssFileName)!;
    styleLink.id = linkId;
    document.head.appendChild(styleLink);

    pixeliumOptionalStyleLinks.set(cssFileName, styleLink);
    pixeliumOptionalCssRefCounts.set(cssFileName, 1);
  } catch (error) {
    // 可选样式加载失败不影响主题使用，静默跳过
  }
};

/**
 * 移除 Pixelium 可选 CSS（引用计数管理）
 * @param cssFileName CSS 文件名
 */
const removePixeliumOptionalCss = (cssFileName: string): void => {
  const refCount = pixeliumOptionalCssRefCounts.get(cssFileName) || 0;
  const newRefCount = refCount - 1;

  pixeliumOptionalCssRefCounts.set(cssFileName, newRefCount);

  if (newRefCount <= 0) {
    const styleLink = pixeliumOptionalStyleLinks.get(cssFileName);
    if (styleLink) {
      styleLink.remove();
      pixeliumOptionalStyleLinks.delete(cssFileName);
      pixeliumOptionalCssRefCounts.delete(cssFileName);
      pixeliumOptionalCssUrls.delete(cssFileName);
    }
  }
};

/**
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
 * 加载主题 CSS
 * @param themeName 主题名称
 */
const loadThemeCss = async (themeName: string): Promise<void> => {
  const config = getThemeConfig(themeName);

  if (!config || !config.cssPath) {
    return;
  }

  // 检查是否已存在相同的样式链接
  const linkId = `theme-${themeName}-style`;
  const existingLink = document.getElementById(linkId) as HTMLLinkElement;

  if (existingLink) {
    themeStyleLinks.set(themeName, existingLink);
    themeCssRefCounts.set(themeName, (themeCssRefCounts.get(themeName) || 0) + 1);
    return;
  }

  if (themeStyleLinks.has(themeName)) {
    themeCssRefCounts.set(themeName, (themeCssRefCounts.get(themeName) || 0) + 1);
    return;
  }

  try {
    // 动态导入 CSS 文件获取 URL
    if (!themeCssUrls.has(themeName)) {
      try {
        // 对 @mmt817/pixel-ui 做静态导入适配，其它主题直接走回退路径
        if (config.packageName === "@mmt817/pixel-ui" && config.cssPath === "dist/index.css") {
          // @ts-ignore - Vite 支持 ?url 后缀，但 TypeScript 可能不识别
          const cssModule = await import("@mmt817/pixel-ui/dist/index.css?url");
          const cssUrl = typeof cssModule === "string" ? cssModule : cssModule.default || cssModule;
          themeCssUrls.set(themeName, cssUrl);
        } else {
          throw new Error("unsupported theme css dynamic import");
        }
      } catch {
        console.warn(`[useThemeComponent] 无法动态导入 ${themeName} 主题 CSS，尝试直接使用路径`);
        // 如果动态导入失败，尝试直接使用相对路径
        themeCssUrls.set(themeName, `/${config.packageName}/${config.cssPath}`);
      }
    }

    // 创建 link 标签
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = themeCssUrls.get(themeName)!;
    styleLink.id = linkId;
    document.head.appendChild(styleLink);

    themeStyleLinks.set(themeName, styleLink);
    themeCssRefCounts.set(themeName, 1);
  } catch (error) {
    logger.error(`[useThemeComponent] 加载 ${themeName} 主题 CSS 失败:`, error);
  }
};

/**
 * 移除主题 CSS（引用计数管理）
 * @param themeName 主题名称
 */
const removeThemeCss = (themeName: string): void => {
  const refCount = themeCssRefCounts.get(themeName) || 0;
  const newRefCount = refCount - 1;

  themeCssRefCounts.set(themeName, newRefCount);

  if (newRefCount <= 0) {
    const styleLink = themeStyleLinks.get(themeName);
    if (styleLink) {
      styleLink.remove();
      themeStyleLinks.delete(themeName);
      themeCssRefCounts.delete(themeName);
    }
  }
};

/**
 * 主题组件缓存（按主题名称和组件名称存储）
 */
const themeComponentCache = new Map<string, Map<string, Component>>();

/**
 * 获取主题组件缓存
 * @param themeName 主题名称
 * @returns 该主题的组件缓存 Map
 */
const getThemeCache = (themeName: string): Map<string, Component> => {
  if (!themeComponentCache.has(themeName)) {
    themeComponentCache.set(themeName, new Map());
  }
  return themeComponentCache.get(themeName)!;
};

const resolveLocalThemeComponent = async (
  themeName: string,
  elementComponentName: string,
): Promise<Component | null> => {
  const localComponentConfig = getThemeLocalComponentConfig(
    themeName,
    elementComponentName,
  );

  if (!localComponentConfig) {
    return null;
  }

  const cache = getThemeCache(themeName);
  if (cache.has(elementComponentName)) {
    return cache.get(elementComponentName)!;
  }

  const module = await localComponentConfig.loader();
  const resolved = localComponentConfig.exportName
    ? module?.[localComponentConfig.exportName]
    : module?.default ?? module;

  if (!resolved) {
    return null;
  }

  cache.set(elementComponentName, resolved as Component);
  return resolved as Component;
};

/**
 * 动态加载主题组件
 * @param themeName 主题名称
 * @param themeComponentName 主题组件名称
 * @param instance 可选的组件实例（用于从全局注册表中查找组件）
 * @returns 组件或 null
 */
const loadThemeComponent = async (themeName: string, themeComponentName: string, instance?: any): Promise<Component | null> => {
  const config = getThemeConfig(themeName);

  if (!config) {
    return null;
  }

  // 检查缓存
  const cache = getThemeCache(themeName);
  if (cache.has(themeComponentName)) {
    return cache.get(themeComponentName)!;
  }

  try {
    // default 主题：从静态导入的 Element Plus 中获取组件
    if (themeName === "default") {
      const component = ELEMENT_PLUS_COMPONENTS[themeComponentName];

      if (component) {
        cache.set(themeComponentName, component);
        return component;
      }

      logger.warn(`[useThemeComponent] 在 element-plus 中找不到组件 ${themeComponentName}`);
      return null;
    }

    // 如果主题组件名称本身就是 Element Plus 组件名（如 ElDrawer），直接返回 Element Plus 组件
    // 避免在主题包中查找不存在的组件
    if (themeComponentName.startsWith("El") && ELEMENT_PLUS_COMPONENTS[themeComponentName]) {
      const component = ELEMENT_PLUS_COMPONENTS[themeComponentName];
      cache.set(themeComponentName, component);
      return component;
    }

    // Element Plus 系主题：直接复用原生组件
    if (config.packageName === "element-plus") {
      const component = ELEMENT_PLUS_COMPONENTS[themeComponentName];
      if (component) {
        cache.set(themeComponentName, component);
        return component;
      }

      logger.warn(`[useThemeComponent] 在 element-plus 中找不到组件 ${themeComponentName}`);
      return null;
    }

    // 其他主题：按包名做静态导入映射，避免裸模块在浏览器环境直接解析
    let themeModule: any;
    if (config.packageName === "@mmt817/pixel-ui") {
      themeModule = await import("@mmt817/pixel-ui");
    } else {
      logger.warn(`[useThemeComponent] 动态导入暂未适配主题包: ${config.packageName}`);
      return null;
    }

    let component = (themeModule as any)[themeComponentName];

    // 像素主题组件多通过插件全局注册，根模块未必导出 PxXxx 组件
    // 尝试从模块的 default 导出中查找（插件可能通过 default 导出）
    if (!component && themeModule.default) {
      component = (themeModule.default as any)[themeComponentName];
    }

    // 尝试从模块的所有导出中查找组件（包括命名导出和 default 导出）
    if (!component && config.packageName === "@mmt817/pixel-ui") {
      // 检查模块的所有键，尝试找到匹配的组件
      const moduleKeys = Object.keys(themeModule);
      const matchingKey = moduleKeys.find(key => key === themeComponentName || key.toLowerCase() === themeComponentName.toLowerCase());
      if (matchingKey) {
        component = (themeModule as any)[matchingKey];
        logger.debug(`[useThemeComponent] 从模块导出中找到组件 ${themeComponentName} (导出名: ${matchingKey})`);
      }
    }

    if (!component) {
      // 如果组件是通过插件全局注册的，尝试从全局组件注册表中查找
      // PixelUI 组件通过插件注册后，会以 kebab-case 格式注册（如 px-button）
      if (config.packageName === "@mmt817/pixel-ui" && /^Px[A-Z]/.test(themeComponentName)) {
        try {
          // 转换为 kebab-case 格式（Vue 3 全局注册的组件名通常是 kebab-case）
          const withoutPrefix = themeComponentName.replace(/^Px/, "");
          const kebabName = `px-${withoutPrefix
            .replace(/([A-Z])/g, "-$1")
            .replace(/^-/, "")
            .toLowerCase()}`;

          // 尝试从当前组件实例的应用上下文中查找全局注册的组件
          // 优先使用传入的实例，如果没有则尝试获取当前实例
          const currentInstance = instance || getCurrentInstance();
          if (currentInstance) {
            const appContext = currentInstance.appContext;

            // 尝试多种可能的组件名格式
            // 1. kebab-case: px-dialog, px-text
            // 2. PascalCase: PxDialog, PxText
            // 3. 原始名称: themeComponentName
            // 4. 首字母大写的 kebab-case: Px-dialog, Px-text (某些插件可能使用)
            const possibleNames = [
              kebabName, // px-dialog
              themeComponentName, // PxDialog
              `Px${withoutPrefix}`, // PxDialog (重复，但保留以兼容)
              kebabName.charAt(0).toUpperCase() + kebabName.slice(1) // Px-dialog
            ];

            // 去重
            const uniqueNames = [...new Set(possibleNames)];

            for (const name of uniqueNames) {
              const globalComponent = appContext.components[name];
              if (globalComponent) {
                cache.set(themeComponentName, globalComponent as Component);
                return globalComponent as Component;
              }
            }

            // 调试信息：列出所有全局注册的组件
            const registeredComponents = Object.keys(appContext.components);
            const pixeliumComponents = registeredComponents.filter(name => name.toLowerCase().startsWith("px") || name.startsWith("Px") || name.toLowerCase().includes("pixel"));

            if (pixeliumComponents.length > 0) {
              logger.debug(`[useThemeComponent] 已全局注册的 PixelUI 相关组件:`, pixeliumComponents);
              logger.debug(`[useThemeComponent] 尝试查找组件 ${themeComponentName}，已尝试的名称:`, uniqueNames);
              logger.warn(`[useThemeComponent] 未找到组件 ${themeComponentName}，已注册的 PixelUI 组件:`, pixeliumComponents);
            } else {
              logger.warn(`[useThemeComponent] 未找到全局注册的 PixelUI 组件，可能插件尚未加载完成`);
              logger.debug(`[useThemeComponent] 尝试查找组件 ${themeComponentName}，已尝试的名称:`, uniqueNames);
              logger.debug(`[useThemeComponent] 所有已注册的组件（前30个）:`, registeredComponents.slice(0, 30));
              logger.debug(`[useThemeComponent] 组件总数: ${registeredComponents.length}`);
            }
          } else {
            logger.warn(`[useThemeComponent] 无法获取组件实例，无法检测全局注册的组件`);
          }
        } catch (error) {
          // 全局组件查找失败，继续后续回退逻辑
          logger.debug(`[useThemeComponent] 全局组件查找失败:`, error);
        }
      }

      // 优先尝试回退到 Element Plus 原生组件，避免功能缺失
      // 约定：PixelUI 组件名 PxXxx 与 Element Plus 组件名 ElXxx 一一对应
      const fallbackElementName = themeComponentName.replace(/^Px/, "El");
      const fallbackComponent = ELEMENT_PLUS_COMPONENTS[fallbackElementName];

      if (fallbackComponent) {
        logger.warn(`[useThemeComponent] 在 ${config.packageName} 中找不到组件 ${themeComponentName}，回退为 Element Plus 组件 ${fallbackElementName}`);
        cache.set(themeComponentName, fallbackComponent);
        return fallbackComponent;
      }

      // 如果找不到组件且无法回退到 Element Plus，返回 null
      // 组件应该处理 null 情况，回退到 Element Plus 组件
      logger.warn(`[useThemeComponent] 在 ${config.packageName} 中找不到组件 ${themeComponentName}，且无法回退到 Element Plus 组件`);
      return null;
    }

    cache.set(themeComponentName, component);
    return component;
  } catch (error) {
    logger.error(`[useThemeComponent] 加载主题组件 ${themeComponentName} 失败:`, error);
    return null;
  }
};

/**
 * 全局主题状态管理（单例模式）
 * 所有组件实例共享同一个 currentSkin ref 和 MutationObserver
 */
const globalThemeState = {
  /**
   * 全局 currentSkin ref（所有组件实例共享）
   */
  currentSkin: ref<string>(typeof document !== "undefined" ? getCurrentSkin() || "default" : "default"),

  /**
   * MutationObserver 实例（单例）
   */
  skinObserver: null as MutationObserver | null,

  /**
   * 引用计数（记录有多少个组件实例在使用）
   */
  refCount: 0,

  /**
   * 防抖定时器（使用 requestAnimationFrame）
   */
  rafId: null as number | null,

  /**
   * 待更新的皮肤值（用于防抖）
   */
  pendingSkin: null as string | null,

  /**
   * systemThemeChange 事件处理器（用于统一清理）
   */
  themeChangeHandler: null as ((themeKey: string) => void) | null
};

/**
 * 使用 requestAnimationFrame 更新皮肤（防抖）
 * 确保更新在下一帧执行，避免阻塞渲染
 */
const updateSkinWithRAF = () => {
  if (globalThemeState.pendingSkin === null) {
    return;
  }

  const newSkin = globalThemeState.pendingSkin;
  globalThemeState.pendingSkin = null;

  if (globalThemeState.currentSkin.value !== newSkin) {
    globalThemeState.currentSkin.value = newSkin;
  }
};

/**
 * 初始化全局 MutationObserver（单例模式）
 * 只创建一次，所有组件实例共享
 */
const initGlobalSkinObserver = () => {
  if (typeof document === "undefined") {
    return;
  }

  // 如果已经存在观察器，直接返回
  if (globalThemeState.skinObserver) {
    return;
  }

  // 创建 MutationObserver 监听 data-skin 属性变化
  globalThemeState.skinObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.attributeName === "data-skin") {
        const target = mutation.target as HTMLElement;
        // 运行时主题切换时只信任 DOM 上的 data-skin，未设置时一律视为 default
        const attrSkin = target.getAttribute("data-skin");
        const newSkin = (attrSkin && attrSkin.trim()) || "default";

        // 保存待更新的皮肤值
        globalThemeState.pendingSkin = newSkin;

        // 使用 requestAnimationFrame 防抖：确保更新在下一帧执行
        // 这样可以避免在 8bit 主题下频繁更新导致的性能问题
        if (globalThemeState.rafId === null) {
          globalThemeState.rafId = requestAnimationFrame(() => {
            updateSkinWithRAF();
            globalThemeState.rafId = null;
          });
        }
      }
    }
  });

  // 开始观察 documentElement 的 data-skin 属性变化
  globalThemeState.skinObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-skin"]
  });

  // 同步监听全局 systemThemeChange 事件，确保通过主题 store 切换时 currentSkin 也能即时更新
  if (!globalThemeState.themeChangeHandler) {
    globalThemeState.themeChangeHandler = (themeKey: string) => {
      const newSkin = themeKey && themeKey.trim() ? themeKey.trim() : "default";
      globalThemeState.pendingSkin = newSkin;

      if (globalThemeState.rafId === null) {
        globalThemeState.rafId = requestAnimationFrame(() => {
          updateSkinWithRAF();
          globalThemeState.rafId = null;
        });
      }
    };

    emitter.on("systemThemeChange", globalThemeState.themeChangeHandler);
  }
};

/**
 * 清理全局 MutationObserver
 * 当所有组件实例都卸载时才真正清理
 */
const cleanupGlobalSkinObserver = () => {
  if (globalThemeState.refCount <= 0 && globalThemeState.skinObserver) {
    globalThemeState.skinObserver.disconnect();
    globalThemeState.skinObserver = null;
  }

  // 注销全局主题事件监听
  if (globalThemeState.refCount <= 0 && globalThemeState.themeChangeHandler) {
    emitter.off("systemThemeChange", globalThemeState.themeChangeHandler);
    globalThemeState.themeChangeHandler = null;
  }

  // 清理 requestAnimationFrame
  if (globalThemeState.rafId !== null) {
    cancelAnimationFrame(globalThemeState.rafId);
    globalThemeState.rafId = null;
  }

  // 清空待更新的皮肤值
  globalThemeState.pendingSkin = null;
};

const acquireThemeSkinSubscription = () => {
  globalThemeState.refCount++;
  initGlobalSkinObserver();
};

const releaseThemeSkinSubscription = () => {
  globalThemeState.refCount--;
  cleanupGlobalSkinObserver();
};

export function useCurrentThemeSkin(): Ref<string> {
  const currentSkin = globalThemeState.currentSkin;

  onMounted(() => {
    acquireThemeSkinSubscription();
  });

  onBeforeUnmount(() => {
    releaseThemeSkinSubscription();
  });

  return currentSkin;
}

/**
 * 使用主题组件
 * 自动根据 data-skin 加载对应主题的组件
 *
 * @param elementComponentName Element Plus 组件名称（如 'ElSlider'）
 * @returns 主题组件引用和相关状态
 *
 * @example
 * ```ts
 * // 在组件中使用
 * import { useThemeComponent } from '@/hooks/useThemeComponent';
 *
 * const { currentComponent } = useThemeComponent('ElSlider');
 *
 * // 在模板中使用（currentComponent 始终有值）
 * <component :is="currentComponent" ... />
 * ```
 */
export function useThemeComponent(elementComponentName: string) {
  /**
   * 保存组件实例（在 setup 阶段获取，用于后续从全局注册表中查找组件）
   */
  const instance = getCurrentInstance();

  /**
   * 使用全局共享的 currentSkin ref
   */
  const currentSkin = useCurrentThemeSkin();

  /**
   * 当前主题配置
   */
  const themeConfig = computed(() => getThemeConfig(currentSkin.value));

  /**
   * 是否启用了主题
   */
  const hasTheme = computed(() => !!themeConfig.value);

  /**
   * 主题组件名称
   */
  const themeComponentName = computed(() => getThemeComponentName(currentSkin.value, elementComponentName));

  /**
   * 动态加载的主题组件
   * 初始化时同步检查缓存，避免首次渲染时因 watch 异步回调导致 null 回退
   */
  const initThemeComponent = (): Component | null => {
    const skin = currentSkin.value;
    if (skin === "default") return null;
    const cache = getThemeCache(skin);
    if (cache.has(elementComponentName)) {
      return cache.get(elementComponentName) ?? null;
    }
    const componentName = getThemeComponentName(skin, elementComponentName);
    if (!componentName) return null;
    return cache.get(componentName) ?? null;
  };

  const themeComponent = shallowRef<Component | null>(initThemeComponent());

  /**
   * 当前实际使用的组件（始终有值）
   * - default 主题：同步返回 Element Plus 组件
   * - 8bit 主题特殊处理：ElTable 和 ElTableColumn 始终使用 Element Plus 组件
   * - 其他主题：异步加载后返回对应的主题组件，如果加载失败则返回 kebab-case 字符串让 Vue 自动解析
   */
  const currentComponent = computed(() => {
    const skin = currentSkin.value;
    const componentName = themeComponentName.value;
    const localComponentConfig = getThemeLocalComponentConfig(
      skin,
      elementComponentName,
    );

    // 8bit 主题特殊处理：ElTable、ElTableColumn 和 ElDrawer 始终使用 Element Plus 组件
    if (skin === "8bit" && (elementComponentName === "ElTable" || elementComponentName === "ElTableColumn" || elementComponentName === "ElDrawer")) {
      const component = ELEMENT_PLUS_COMPONENTS[elementComponentName];
      if (component) {
        return component;
      }
    }

    if (localComponentConfig) {
      return themeComponent.value;
    }

    // default 主题：直接同步返回 Element Plus 组件
    if (skin === "default" && componentName) {
      const component = ELEMENT_PLUS_COMPONENTS[componentName];
      const isDev = (import.meta as any).env?.DEV === true;
      if (!component && isDev) {
        logger.warn(`[useThemeComponent] 在 Element Plus 中找不到组件: ${componentName}`);
      }
      return component || null;
    }

    // 非 default 但仍基于 Element Plus 的主题，保持同步组件返回，避免首次渲染闪烁
    if (themeConfig.value?.packageName === "element-plus" && componentName) {
      const component = ELEMENT_PLUS_COMPONENTS[componentName];
      return component || null;
    }

    // 其他主题：返回异步加载的组件
    // 如果组件还未加载完成（themeComponent.value 为 null），不返回字符串
    // 让组件等待加载完成，避免显示未注册的组件名
    // 组件加载完成后，loadThemeComponent 会返回组件对象或字符串
    return themeComponent.value;
  });

  /**
   * 加载主题组件（仅用于非 default 主题）
   */
  const loadComponent = async (): Promise<void> => {
    const skin = currentSkin.value;
    const componentName = themeComponentName.value;

    // default 主题不需要异步加载
    if (skin === "default") {
      return;
    }

    if (!skin || !componentName) {
      const localComponent = skin
        ? await resolveLocalThemeComponent(skin, elementComponentName)
        : null;
      themeComponent.value = localComponent;
      if (!localComponent) {
        themeComponent.value = null;
      }
      return;
    }

    try {
      const localComponent = await resolveLocalThemeComponent(
        skin,
        elementComponentName,
      );
      if (localComponent) {
        themeComponent.value = localComponent;
        return;
      }

      const component = await loadThemeComponent(skin, componentName, instance);
      themeComponent.value = component;
    } catch (error) {
      logger.error(`[useThemeComponent] 加载组件失败:`, error);
      themeComponent.value = null;
    }
  };

  /**
   * 监听 data-skin 变化
   */
  watch(
    [currentSkin, themeComponentName],
    async ([newSkin, newComponentName], [oldSkin]) => {
      // 移除旧主题的 CSS（如果旧主题存在且不是 default）
      if (oldSkin && oldSkin !== "default" && oldSkin !== newSkin) {
        removeThemeCss(oldSkin);
      }

      // 加载主题组件（仅非 default 主题需要异步加载）
      if (newSkin && newComponentName) {
        // default 主题不需要加载 CSS 和异步加载组件
        if (newSkin !== "default") {
          await loadThemeCss(newSkin);
          // 确保主题插件已注册（例如切换到 8bit 主题时需要注册 PixelUI 插件）
          try {
            await ensureThemePluginForCurrentSkin();
          } catch (error) {
            logger.warn(`[useThemeComponent] 确保主题插件注册失败:`, error);
          }
          await loadComponent();
        }
      } else {
        // 配置不存在，清空组件
        themeComponent.value = null;
      }
    },
    { immediate: true }
  );

<<<<<<< HEAD
=======
  /**
   * 组件卸载时清理
   */
  onBeforeUnmount(() => {
    // 减少引用计数
    globalThemeState.refCount--;

    // 当所有组件实例都卸载时才清理观察器
    cleanupGlobalSkinObserver();

    // 清理主题 CSS（注意：这里不清理，因为其他组件可能还在使用）
    // 主题 CSS 的清理由 watch 中的逻辑处理
  });

>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
  return {
    /**
     * 当前 data-skin 值
     */
    currentSkin,

    /**
     * 是否启用了主题
     */
    hasTheme,

    /**
     * 当前主题配置
     */
    themeConfig,

    /**
     * 主题组件名称
     */
    themeComponentName,

    /**
     * 当前实际使用的组件（始终有值）
     * - default: Element Plus 组件
     * - 8bit: Pixel UI 组件
     * - 其他: 对应主题组件
     */
    currentComponent,

    /**
     * 手动重新加载组件
     */
    reload: loadComponent
  };
}

export default useThemeComponent;

/**
 * 初始化主题系统
 * 在应用启动时调用，预加载当前主题
 */
export async function initThemeSystem(): Promise<void> {
  const currentSkin = getCurrentSkin();
  if (currentSkin) {
    logger.info(`[useThemeComponent] 初始化主题系统，当前主题: ${currentSkin}`);
    await preloadTheme(currentSkin);
  }
}
