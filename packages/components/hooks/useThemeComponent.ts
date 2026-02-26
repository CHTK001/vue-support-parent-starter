/**
 * 通用主题组件加载器
 * 根据 data-skin 自动加载对应主题的组件
 * 支持多主题扩展，新增主题只需修改 themeConfig.ts
 */

import { computed, watch, onBeforeUnmount, ref, type Component } from "vue";
import { getThemeConfig, getThemeComponentName } from "./themeConfig";

/**
 * 当前激活的 data-skin 值
 */
const getCurrentSkin = (): string | undefined => {
  if (typeof document === "undefined") {
    return undefined;
  }
  return document.documentElement.dataset.skin;
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
      // 构建 CSS 导入路径
      const cssImportPath = `${config.packageName}/${config.cssPath}?url`;

      try {
        // @ts-ignore - Vite 支持 ?url 后缀
        const cssModule = await import(/* @vite-ignore */ cssImportPath);
        const cssUrl = typeof cssModule === "string" ? cssModule : cssModule.default || cssModule;
        themeCssUrls.set(themeName, cssUrl);
      } catch {
        console.warn(`[useThemeComponent] 无法动态导入 ${themeName} 主题 CSS，尝试直接使用路径`);
        // 如果动态导入失败，尝试直接使用 CDN 或相对路径
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
    // 动态导入主题组件库
    const themeModule = await import(/* @vite-ignore */ config.packageName);
    const component = (themeModule as any)[themeComponentName] || themeModule.default;

    if (component) {
      cache.set(themeComponentName, component);
      return component;
    }

    console.warn(`[useThemeComponent] 在 ${config.packageName} 中找不到组件 ${themeComponentName}`);
    return null;
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
 * import { ElSlider } from 'element-plus';
 * import { useThemeComponent } from '@/hooks/useThemeComponent';
 *
 * const { currentComponent } = useThemeComponent('ElSlider');
 *
 * // 在模板中使用
 * <component :is="currentComponent || ElSlider" ... />
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
  const themeComponent = ref<Component | null>(null);

  /**
   * 当前实际使用的组件（主题组件或 null）
   */
  const currentComponent = computed(() => themeComponent.value);

  /**
   * 加载主题组件
   */
  const loadComponent = async (): Promise<void> => {
    const skin = currentSkin.value;
    const componentName = themeComponentName.value;

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
      // 移除旧主题的 CSS
      if (oldSkin && oldSkin !== newSkin) {
        removeThemeCss(oldSkin);
      }

      // 加载新主题
      if (newSkin && newComponentName) {
        await loadThemeCss(newSkin);
        await loadComponent();
      } else {
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
    if (skin) {
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
     * 当前实际使用的组件（主题组件或 null）
     * 如果为 null，应该使用默认的 Element Plus 组件
     */
    currentComponent,

    /**
     * 手动重新加载组件
     */
    reload: loadComponent
  };
}

export default useThemeComponent;
