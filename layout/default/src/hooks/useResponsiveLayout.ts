/**
 * 响应式布局 composable
 * @description 处理响应式断点、侧边栏自动折叠等逻辑
 */
import { type Ref } from "vue";
import {
  useResizeObserver,
  deviceDetection,
  useGlobal,
} from "@pureadmin/utils";
import { useAppStoreHook } from "@repo/core";
import type { LayoutType, StorageLayout } from "../types/theme";
import { isValidLayout } from "./useLayout";

export function useResponsiveLayout(
  appWrapperRef: Ref<HTMLElement | undefined>,
  sidebarState: { isClickCollapse?: boolean },
) {
  const isMobile = deviceDetection();
  const { $storage } = useGlobal<GlobalPropertiesApi>();
  const appStore = useAppStoreHook();

  // 判断是否可自动关闭菜单栏
  let isAutoCloseSidebar = true;

  /**
   * 设置布局主题
   * 处理非法或未初始化的布局值，统一回退到 vertical
   */
  function setTheme(layoutModel: string) {
    const fallbackLayout: LayoutType = "vertical";
    const storedLayout = $storage.layout?.layout as string | undefined;
    const targetLayout: LayoutType = isValidLayout(layoutModel)
      ? layoutModel
      : isValidLayout(storedLayout)
        ? storedLayout
        : fallbackLayout;
    const currentLayout = $storage.layout as StorageLayout | undefined;

    window.document.body.setAttribute("layout", targetLayout);
    $storage.layout = {
      layout: targetLayout,
      theme: currentLayout?.theme,
      darkMode: currentLayout?.darkMode,
      sidebarStatus: currentLayout?.sidebarStatus,
      epThemeColor: currentLayout?.epThemeColor,
      themeColor: currentLayout?.themeColor,
      overallStyle: currentLayout?.overallStyle,
    };
  }

  /**
   * 切换设备和侧边栏状态
   */
  function toggle(device: string, bool: boolean) {
    appStore.toggleDevice(device);
    appStore.toggleSideBar(bool, "resize");
  }

  /**
   * 初始化响应式监听
   */
  function initResponsiveObserver() {
    useResizeObserver(appWrapperRef as Ref<HTMLDivElement | undefined>, (entries) => {
      if (isMobile) return;

      const entry = entries[0];
      const [{ inlineSize: width, blockSize: height }] = entry.borderBoxSize;

      appStore.setViewportSize({ width, height });
      width <= 760 ? setTheme("vertical") : setTheme(appStore.layout);

      /**
       * width app-wrapper类容器宽度
       * 0 < width <= 760 隐藏侧边栏
       * 760 < width <= 990 折叠侧边栏
       * width > 990 展开侧边栏
       */
      if (width > 0 && width <= 760) {
        toggle("mobile", false);
        isAutoCloseSidebar = true;
      } else if (width > 760 && width <= 990) {
        if (isAutoCloseSidebar) {
          toggle("desktop", false);
          isAutoCloseSidebar = false;
        }
      } else if (width > 990 && !sidebarState.isClickCollapse) {
        toggle("desktop", true);
        isAutoCloseSidebar = true;
      } else {
        toggle("desktop", false);
        isAutoCloseSidebar = false;
      }
    });
  }

  /**
   * 初始化移动端
   */
  function initMobile() {
    if (isMobile) {
      toggle("mobile", false);
    }
  }

  return {
    isMobile,
    setTheme,
    toggle,
    initResponsiveObserver,
    initMobile,
  };
}
