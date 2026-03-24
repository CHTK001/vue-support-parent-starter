/**
 * 通用主题组件加载器
 * 根据 data-skin 自动加载对应主题的组件
 * 支持多主题扩展，新增主题只需修改 themeConfig.ts
 */

import { computed, watch, onBeforeUnmount, shallowRef, type Component } from "vue";
import { getThemeConfig, getThemeComponentName, THEME_CONFIGS } from "./themeConfig";
import * as ElementPlusModule from "element-plus";

/**
 * Element Plus 组件映射表
 * 用于 default 主题的组件查找
 */
const ELEMENT_PLUS_COMPONENTS: Record<string, Component> = ElementPlusModule as any;

/**
 * 主题预加载状态
 */
const themePreloadStatus = new Map<string, boolean>();

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
    console.warn(`[useThemeComponent] 主题 ${themeName} 不存在`);
    return;
  }

  // default 主题不需要预加载（已经静态导入）
  if (themeName === "default") {
    themePreloadStatus.set(themeName, true);
    return;
  }

  try {
    console.log(`[useThemeComponent] 开始预加载主题: ${themeName}`);

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
    console.log(`[useThemeComponent] 主题 ${themeName} 预加载完成`);
  } catch (error) {
    console.error(`[useThemeComponent] 预加载主题 ${themeName} 失败:`, error);
  }
}

/**
 * 预加载所有启用的主题
 */
export async function preloadAllThemes(): Promise<void> {
  const themes = Object.values(THEME_CONFIGS).filter(config => config.enabled !== false);

  console.log(`[useThemeComponent] 开始预加载 ${themes.length} 个主题`);

  await Promise.all(themes.map(theme => preloadTheme(theme.name)));

  console.log(`[useThemeComponent] 所有主题预加载完成`);
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
    console.warn(`[useThemeComponent] 主题 ${themeName} 不存在`);
    return;
  }

  // 先预加载主题资源
  await preloadTheme(themeName);

  // 加载完成后再切换 data-skin
  document.documentElement.setAttribute("data-skin", themeName);

  console.log(`[useThemeComponent] 主题已切换到: ${themeName}`);
}

/**
 * 当前激活的 data-skin 值
 */
const getCurrentSkin = (): string | undefined => {
  if (typeof document === "undefined") {
    return undefined;
  }
  const skin = document.documentElement.dataset.skin;
  // 如果没有设置 skin，返回 "default"
  return skin || "default";
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
        // 目前只对 PixelUI 做静态导入适配，其它主题直接走回退路径
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
    console.error(`[useThemeComponent] 加载 ${themeName} 主题 CSS 失败:`, error);
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

/**
 * 动态加载主题组件
 * @param themeName 主题名称
 * @param themeComponentName 主题组件名称
 * @returns 组件或 null
 */
const loadThemeComponent = async (themeName: string, themeComponentName: string): Promise<Component | null> => {
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

      console.warn(`[useThemeComponent] 在 element-plus 中找不到组件 ${themeComponentName}`);
      return null;
    }

    // 其他主题：按包名做静态导入映射，避免裸模块在浏览器环境直接解析
    let themeModule: any;
    if (config.packageName === "@mmt817/pixel-ui") {
      themeModule = await import("@mmt817/pixel-ui");
    } else {
      console.warn(
        `[useThemeComponent] 动态导入暂未适配主题包: ${config.packageName}`
      );
      return null;
    }

    let component = (themeModule as any)[themeComponentName];

    // Pixel UI 的组件多通过插件全局注册，根模块未必导出 PxXxx 组件
    // 这里在找不到命名导出的情况下，回退为 kebab-case 标签名（例如 PxSwitch -> px-switch）
    if (!component && config.packageName === "@mmt817/pixel-ui" && /^Px[A-Z]/.test(themeComponentName)) {
      const withoutPrefix = themeComponentName.replace(/^Px/, "");
      const kebabName = `px-${withoutPrefix.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
      component = kebabName as unknown as Component;
    }

    if (!component) {
      // 优先尝试回退到 Element Plus 原生组件，避免功能缺失
      // 约定：PixelUI 组件名 PxXxx 与 Element Plus 组件名 ElXxx 一一对应
      const fallbackElementName = themeComponentName.replace(/^Px/, "El");
      const fallbackComponent = ELEMENT_PLUS_COMPONENTS[fallbackElementName];

      if (fallbackComponent) {
        console.warn(
          `[useThemeComponent] 在 ${config.packageName} 中找不到组件 ${themeComponentName}，回退为 Element Plus 组件 ${fallbackElementName}`
        );
        cache.set(themeComponentName, fallbackComponent);
        return fallbackComponent;
      }

      console.warn(
        `[useThemeComponent] 在 ${config.packageName} 中找不到组件 ${themeComponentName}`
      );
      return null;
    }

    cache.set(themeComponentName, component);
    return component;
  } catch (error) {
    console.error(`[useThemeComponent] 加载主题组件 ${themeComponentName} 失败:`, error);
    return null;
  }
};

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
   * 当前 data-skin 值（响应式）
   */
  const currentSkin = computed(() => getCurrentSkin());

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
   */
  const themeComponent = shallowRef<Component | null>(null);

  /**
   * 当前实际使用的组件（始终有值）
   * - default 主题：同步返回 Element Plus 组件
   * - 其他主题：异步加载后返回对应的主题组件
   */
  const currentComponent = computed(() => {
    const skin = currentSkin.value;
    const componentName = themeComponentName.value;

    // default 主题：直接同步返回 Element Plus 组件
    if (skin === "default" && componentName) {
      const component = ELEMENT_PLUS_COMPONENTS[componentName];
      const isDev = (import.meta as any).env?.DEV === true;
      if (!component && isDev) {
        console.warn(`[useThemeComponent] 在 Element Plus 中找不到组件: ${componentName}`);
      }
      return component || null;
    }

    // 其他主题：返回异步加载的组件
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
      themeComponent.value = null;
      return;
    }

    try {
      const component = await loadThemeComponent(skin, componentName);
      themeComponent.value = component;
    } catch (error) {
      console.error(`[useThemeComponent] 加载组件失败:`, error);
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
          await loadComponent();
        }
      } else {
        // 配置不存在，清空组件
        themeComponent.value = null;
      }
    },
    { immediate: true }
  );

  /**
   * 组件卸载时清理
   */
  onBeforeUnmount(() => {
    const skin = currentSkin.value;
    if (skin && skin !== "default") {
      removeThemeCss(skin);
    }
  });

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
    console.log(`[useThemeComponent] 初始化主题系统，当前主题: ${currentSkin}`);
    await preloadTheme(currentSkin);
  }
}
