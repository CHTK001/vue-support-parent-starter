/**
 * 像素主题（@pixelium/web-vue）条件导入管理
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

/**
 * 像素主题 CSS 引用计数（用于多组件实例管理）
 */
let pixelUiCssRefCount = 0;

/**
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
          console.warn(`[usePixelUI] 不支持的 Pixelium CSS 文件: ${cssFileName}`);
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
 * 加载像素主题 CSS
 */
const loadPixelUiCss = async (): Promise<void> => {
  // 检查是否已存在相同的样式链接
  const existingLink = document.getElementById("pixel-theme-style") as HTMLLinkElement;
  if (existingLink) {
    pixelUiStyleLink = existingLink;
    pixelUiCssRefCount++;
    return;
  }

  if (pixelUiStyleLink) {
    pixelUiCssRefCount++;
    return; // 已加载则跳过
  }

  try {
    // 动态导入 CSS 文件获取 URL（使用 ?url 后缀）
    if (!pixelUiCssUrl) {
      // @ts-ignore - Vite 支持 ?url 后缀，但 TypeScript 可能不识别
      const cssModule = await import("@pixelium/web-vue/dist/pixelium-vue.css?url");
      pixelUiCssUrl = typeof cssModule === "string" ? cssModule : cssModule.default || cssModule;
    }

    // 创建 link 标签
    pixelUiStyleLink = document.createElement("link");
    pixelUiStyleLink.rel = "stylesheet";
    pixelUiStyleLink.href = pixelUiCssUrl;
    pixelUiStyleLink.id = "pixel-theme-style";
    document.head.appendChild(pixelUiStyleLink);
    pixelUiCssRefCount = 1;

    // 同时加载可选 CSS（normalize.css）
    await loadPixeliumOptionalCss("normalize.css");
  } catch (error) {
    console.error("[usePixelUI] 加载像素主题 CSS 失败:", error);
  }
};

/**
 * 移除像素主题 CSS（引用计数管理）
 */
const removePixelUiCss = (): void => {
  pixelUiCssRefCount--;
  if (pixelUiCssRefCount <= 0 && pixelUiStyleLink) {
    pixelUiStyleLink.remove();
    pixelUiStyleLink = null;
    pixelUiCssRefCount = 0;

    // 同时移除可选 CSS
    removePixeliumOptionalCss("normalize.css");
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
      const pixelUIModule = await import("@pixelium/web-vue");
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
    if (!isPixelTheme.value) {
      removePixelUiCss();
    }
  });

  return {
    isPixelTheme,
    pixelComponent: pixelComponent?.component,
    loadComponent: pixelComponent?.loadComponent
  };
}

export default usePixelUI;
