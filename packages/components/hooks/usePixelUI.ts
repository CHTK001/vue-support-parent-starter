/**
 * 像素主题（pixel-ui）条件导入管理
 * 提供统一的像素组件和 CSS 条件加载能力
 * 只在 8bit 主题下加载，其他主题不加载以优化性能
 */

import { watch, onBeforeUnmount, shallowRef, type Component } from "vue";
import { usePixelTheme } from "./usePixelTheme";
import {
  getPixelUiComponent,
  retainPixelUiThemeCss,
  releasePixelUiThemeCss,
} from "./pixelUiShared";

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
      const comp = getPixelUiComponent(componentName);

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
  let hasCssLease = false;

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
        if (!hasCssLease) {
          retainPixelUiThemeCss();
          hasCssLease = true;
        }
        // 如果提供了组件名，预加载组件
        if (componentName && pixelComponent) {
          await pixelComponent.loadComponent();
        }
      } else {
        if (hasCssLease) {
          releasePixelUiThemeCss();
          hasCssLease = false;
        }
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
    if (hasCssLease) {
      releasePixelUiThemeCss();
      hasCssLease = false;
    }
  });

  return {
    isPixelTheme,
    pixelComponent: pixelComponent?.component,
    loadComponent: pixelComponent?.loadComponent
  };
}

export default usePixelUI;
