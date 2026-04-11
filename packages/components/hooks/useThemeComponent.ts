/**
 * 通用主题组件加载器
 * 根据 data-skin 自动加载对应主题的组件
 * 支持多主题扩展，新增主题只需修改 themeConfig.ts
 */

import { computed, watch, onBeforeUnmount, onMounted, shallowRef, ref, type Component, type Ref } from "vue";
import { getThemeConfig, getThemeComponentName, getThemeLocalComponentConfig, THEME_CONFIGS } from "./themeConfig";
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
  debug: (msg: string, ...args: unknown[]) => getL().debug(msg, ...args)
};

/**
 * 预加载指定主题的所有组件
 * @param themeName 主题名称
 */
export async function preloadTheme(themeName: string): Promise<void> {
  if (themePreloadStatus.get(themeName)) {
    return;
  }

  const config = getThemeConfig(themeName);
  if (!config) {
    return;
  }

  try {
    if (config.cssPath) {
      await loadThemeCss(themeName);
      removeThemeCss(themeName);
    }
    themePreloadStatus.set(themeName, true);
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
    return;
  }

  await preloadTheme(themeName);
  document.documentElement.setAttribute("data-skin", themeName);
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
    if (!themeCssUrls.has(themeName)) {
      themeCssUrls.set(themeName, `/${config.packageName}/${config.cssPath}`);
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

const resolveLocalThemeComponent = async (themeName: string, elementComponentName: string): Promise<Component | null> => {
  const localComponentConfig = getThemeLocalComponentConfig(themeName, elementComponentName);

  if (!localComponentConfig) {
    return null;
  }

  const cache = getThemeCache(themeName);
  if (cache.has(elementComponentName)) {
    return cache.get(elementComponentName)!;
  }

  const module = await localComponentConfig.loader();
  const resolved = localComponentConfig.exportName ? module?.[localComponentConfig.exportName] : (module?.default ?? module);

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
 * @returns 组件或 null
 */
const loadThemeComponent = async (
  themeName: string,
  themeComponentName: string,
): Promise<Component | null> => {
  const config = getThemeConfig(themeName);
  if (!config) {
    return null;
  }

  const cache = getThemeCache(themeName);
  if (cache.has(themeComponentName)) {
    return cache.get(themeComponentName)!;
  }

  try {
    if (config.packageName !== "element-plus") {
      return null;
    }

    const component = ELEMENT_PLUS_COMPONENTS[themeComponentName];
    if (!component) {
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
   * 使用全局共享的 currentSkin ref
   */
  const currentSkin = useCurrentThemeSkin();

  /**
   * 当前主题配置
   */
  const themeConfig = computed(() => getThemeConfig(currentSkin.value));

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
  let activeThemeCssSkin: string | null = null;

  /**
   * 加载状态和错误信息
   */
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 当前实际使用的组件（始终有值）
   * - default 主题：同步返回 Element Plus 组件
   * - 其他主题：异步加载后返回对应的主题组件
   */
  const currentComponent = computed(() => {
    const skin = currentSkin.value;
    const componentName = themeComponentName.value;
    const localComponentConfig = getThemeLocalComponentConfig(skin, elementComponentName);

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
      const localComponent = skin ? await resolveLocalThemeComponent(skin, elementComponentName) : null;
      themeComponent.value = localComponent;
      if (!localComponent) {
        themeComponent.value = null;
      }
      return;
    }

    try {
      const localComponent = await resolveLocalThemeComponent(skin, elementComponentName);
      if (localComponent) {
        themeComponent.value = localComponent;
        return;
      }

      const component = await loadThemeComponent(skin, componentName);
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
      if (activeThemeCssSkin && activeThemeCssSkin !== newSkin) {
        removeThemeCss(activeThemeCssSkin);
        activeThemeCssSkin = null;
      } else if (!activeThemeCssSkin && oldSkin && oldSkin !== "default" && oldSkin !== newSkin) {
        removeThemeCss(oldSkin);
      }

      // 加载主题组件（仅非 default 主题需要异步加载）
      if (newSkin && newComponentName) {
        // default 主题不需要加载 CSS 和异步加载组件
        if (newSkin !== "default") {
          if (activeThemeCssSkin !== newSkin) {
            await loadThemeCss(newSkin);
            activeThemeCssSkin = newSkin;
          }
          await loadComponent();
        }
      } else {
        if (activeThemeCssSkin) {
          removeThemeCss(activeThemeCssSkin);
          activeThemeCssSkin = null;
        }
        // 配置不存在，清空组件
        themeComponent.value = null;
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    if (activeThemeCssSkin) {
      removeThemeCss(activeThemeCssSkin);
      activeThemeCssSkin = null;
    }
  });

  /**
   * 返回组合式函数的公共 API
   */
  return {
    /**
     * 当前主题皮肤
     */
    currentSkin,
    /**
     * 当前实际渲染的组件
     */
    currentComponent,
    /**
     * 当前主题组件实例
     */
    themeComponent,
    /**
     * 组件是否正在加载
     */
    loading,
    /**
     * 加载过程中的错误信息
     */
    error,
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
