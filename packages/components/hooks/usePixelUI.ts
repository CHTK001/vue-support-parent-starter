/**
 * 像素主题（@mmt817/pixel-ui）条件导入管理
 * 提供统一的像素组件和 CSS 条件加载能力
 * 只在 8bit 主题下加载，其他主题不加载以优化性能
 */

import { computed, watch, onBeforeUnmount, shallowRef, type Component } from "vue";
import { usePixelTheme } from "./usePixelTheme";

/**
 * 像素主题 CSS 样式链接引用（全局单例）
 */
let pixelUiStyleLink: HTMLLinkElement | null = null;

/**
 * 像素主题 CSS URL 缓存
 */
let pixelUiCssUrl: string | null = null;
const pixeliumModuleSpecifier = "@mmt817/pixel-ui";
const pixeliumThemeCssSpecifier = "@mmt817/pixel-ui/dist/index.css?url";
const pixelUiStyleId = "pixel-ui-theme-style";
const pixelUiGlobalAttr = "data-pixel-ui-global";
const runtimeImport = new Function(
  "specifier",
  "return import(specifier);",
) as (specifier: string) => Promise<any>;

/**
 * 像素主题 CSS 引用计数（用于多组件实例管理）
 */
let pixelUiCssRefCount = 0;

async function importOptionalPixeliumModule(specifier: string): Promise<any | null> {
  try {
    return await runtimeImport(specifier);
  } catch (error) {
    return null;
  }
}

/**
 * 加载像素主题 CSS
 */
const loadPixelUiCss = async (): Promise<void> => {
  // 检查是否已存在相同的样式链接
  const existingLink = document.getElementById(pixelUiStyleId) as HTMLLinkElement;
  if (existingLink) {
    pixelUiStyleLink = existingLink;
    pixelUiCssRefCount++;
    return;
  }

  if (pixelUiStyleLink && document.head.contains(pixelUiStyleLink)) {
    pixelUiCssRefCount++;
    return; // 已加载则跳过
  }

  try {
    if (!pixelUiCssUrl) {
      const cssModule = await importOptionalPixeliumModule(pixeliumThemeCssSpecifier);
      if (!cssModule) {
        return;
      }
      pixelUiCssUrl = typeof cssModule === "string" ? cssModule : cssModule.default || cssModule;
    }

    // 创建 link 标签
    pixelUiStyleLink = document.createElement("link");
    pixelUiStyleLink.rel = "stylesheet";
    pixelUiStyleLink.href = pixelUiCssUrl;
    pixelUiStyleLink.id = pixelUiStyleId;
    document.head.appendChild(pixelUiStyleLink);
    pixelUiCssRefCount = 1;
  } catch (error) {
    console.error("[usePixelUI] 加载像素主题 CSS 失败:", error);
  }
};

/**
 * 移除像素主题 CSS（引用计数管理）
 */
const removePixelUiCss = (): void => {
  if (pixelUiCssRefCount > 0) {
    pixelUiCssRefCount--;
  }

  if (pixelUiCssRefCount <= 0 && pixelUiStyleLink) {
    const isGlobalStyle = pixelUiStyleLink.getAttribute(pixelUiGlobalAttr) === "true";
    if (!isGlobalStyle) {
      pixelUiStyleLink.remove();
    }
    pixelUiStyleLink = null;
    pixelUiCssRefCount = 0;
  }
};

/**
 * 像素主题组件缓存
 */
const pixelUIComponentCache = new Map<string, Component>();

/**
 * 条件导入像素主题组件
 * @param componentName 组件名称，如 'PxSlider'
 * @returns 返回组件的响应式引用
 */
const usePixelUIComponent = (componentName: string) => {
  const { isPixelTheme } = usePixelTheme();

  /**
   * 动态加载的组件（使用 ref 保持响应式）
   */
  const component = shallowRef<Component | null>(null);

  /**
   * 动态加载像素主题组件
   */
  const loadComponent = async (): Promise<Component | null> => {
    if (!isPixelTheme.value) {
      component.value = null;
      return null;
    }

    // 如果已缓存，直接返回
    if (pixelUIComponentCache.has(componentName)) {
      component.value = pixelUIComponentCache.get(componentName)!;
      return component.value;
    }

    try {
      // 动态导入像素主题组件
      const pixelUIModule = await importOptionalPixeliumModule(pixeliumModuleSpecifier);
      if (!pixelUIModule) {
        console.warn("[usePixelUI] 像素主题依赖未安装，跳过组件加载");
        component.value = null;
        return null;
      }
      const comp = (pixelUIModule as any)[componentName];

      if (!comp) {
        console.warn(`[usePixelUI] 在像素主题包中找不到组件 ${componentName}`);
        component.value = null;
        return null;
      }

      pixelUIComponentCache.set(componentName, comp);
      component.value = comp;

      return comp;
    } catch (error) {
      console.error(`[usePixelUI] 加载像素主题组件 ${componentName} 失败:`, error);
      component.value = null;
      return null;
    }
  };

  return {
    component,
    loadComponent
  };
};

/**
 * 使用 PixelUI 条件导入
 * 自动管理 CSS 加载/卸载，并提供组件条件导入能力
 *
 * @param componentName 可选，PixelUI 组件名称（如 'PxSlider'）
 * @returns 返回组件引用、CSS 加载状态等
 */
export function usePixelUI(componentName?: string) {
  const { isPixelTheme } = usePixelTheme();

  /**
   * 条件导入的组件（如果提供了 componentName）
   */
  const pixelComponent = componentName ? usePixelUIComponent(componentName) : null;

  /**
   * 监听主题变化，动态加载/卸载 CSS
   * immediate: true 确保组件挂载时立即检查主题
   */
  watch(
    isPixelTheme,
    async isPixel => {
      if (isPixel) {
        await loadPixelUiCss();
        // 如果提供了组件名，预加载组件
        if (componentName && pixelComponent) {
          await pixelComponent.loadComponent();
        }
      } else {
        removePixelUiCss();
        // 清空组件引用
        if (pixelComponent) {
          pixelComponent.component.value = null;
        }
      }
    },
    { immediate: true }
  );

  /**
   * 组件卸载时清理 CSS 引用
   */
  onBeforeUnmount(() => {
    removePixelUiCss();
  });

  return {
    isPixelTheme,
    pixelComponent: pixelComponent?.component,
    loadComponent: pixelComponent?.loadComponent
  };
}

export default usePixelUI;
