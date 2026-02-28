/**
 * PixelUI 条件导入管理
 * 提供统一的 PixelUI 组件和 CSS 条件加载能力
 * 只在 8bit 主题下加载，其他主题不加载以优化性能
 */

import { computed, watch, onBeforeUnmount, shallowRef, type Component } from "vue";
import { usePixelTheme } from "./usePixelTheme";

/**
 * PixelUI CSS 样式链接引用（全局单例）
 */
let pixelUiStyleLink: HTMLLinkElement | null = null;

/**
 * PixelUI CSS URL 缓存
 */
let pixelUiCssUrl: string | null = null;

/**
 * PixelUI CSS 引用计数（用于多组件实例管理）
 */
let pixelUiCssRefCount = 0;

/**
 * 加载 PixelUI CSS
 */
const loadPixelUiCss = async (): Promise<void> => {
  // 检查是否已存在相同的样式链接
  const existingLink = document.getElementById("pixel-ui-style") as HTMLLinkElement;
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
      const cssModule = await import("@mmt817/pixel-ui/dist/index.css?url");
      pixelUiCssUrl = typeof cssModule === "string" ? cssModule : cssModule.default || cssModule;
    }

    // 创建 link 标签
    pixelUiStyleLink = document.createElement("link");
    pixelUiStyleLink.rel = "stylesheet";
    pixelUiStyleLink.href = pixelUiCssUrl;
    pixelUiStyleLink.id = "pixel-ui-style";
    document.head.appendChild(pixelUiStyleLink);
    pixelUiCssRefCount = 1;
  } catch (error) {
    console.error("[usePixelUI] 加载 PixelUI CSS 失败:", error);
  }
};

/**
 * 移除 PixelUI CSS（引用计数管理）
 */
const removePixelUiCss = (): void => {
  pixelUiCssRefCount--;
  if (pixelUiCssRefCount <= 0 && pixelUiStyleLink) {
    pixelUiStyleLink.remove();
    pixelUiStyleLink = null;
    pixelUiCssRefCount = 0;
  }
};

/**
 * PixelUI 组件缓存
 */
const pixelUIComponentCache = new Map<string, Component>();

/**
 * 条件导入 PixelUI 组件
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
   * 动态加载 PixelUI 组件
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
      // 动态导入 PixelUI 组件
      const pixelUIModule = await import("@mmt817/pixel-ui");
      const comp = (pixelUIModule as any)[componentName];

      if (!comp) {
        console.warn(`[usePixelUI] 在 PixelUI 中找不到组件 ${componentName}`);
        component.value = null;
        return null;
      }

      pixelUIComponentCache.set(componentName, comp);
      component.value = comp;

      return comp;
    } catch (error) {
      console.error(`[usePixelUI] 加载 PixelUI 组件 ${componentName} 失败:`, error);
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
