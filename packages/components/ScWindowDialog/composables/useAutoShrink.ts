/**
 * 自动收缩功能 Composable
 * @author CH
 * @version 2.0.0
 * @description 处理对话框的自动收缩功能，适配draggable-resizable-vue3
 */

import { nextTick, ref } from "vue";
import { dialogManager } from "../manager";

/**
 * 自动收缩配置
 */
export interface AutoShrinkOptions {
  /** 是否启用自动收缩 */
  enabled: boolean;
  /** 收缩尺寸 */
  shrinkSize: number;
  /** 边缘检测阈值 */
  edgeThreshold: number;
}

/**
 * 使用自动收缩功能
 * @param dialogId 对话框ID
 * @param options 配置选项
 */
export function useAutoShrink(dialogId: string, options: AutoShrinkOptions) {
  const dialogElement = ref<HTMLElement>();
  const isDragging = ref(false);
  const isShrunk = ref(false);

  // 原始状态
  const originalState = ref<{
    width: string;
    height: string;
    top: string;
    left: string;
    transform: string;
  }>();

  /**
   * 初始化自动收缩功能
   */
  const initAutoShrink = async () => {
    if (!options.enabled) return;

    await nextTick();

    // 查找对话框元素
    const dialog = document.querySelector(`[data-dialog-id="${dialogId}"]`) as HTMLElement;
    if (!dialog) return;

    dialogElement.value = dialog;
    dialogManager.setElement(dialogId, dialog);

    // 监听拖拽事件
    setupDragListeners(dialog);

    // 监听点击事件（用于恢复）
    setupClickListeners(dialog);
  };

  /**
   * 设置拖拽监听器
   */
  const setupDragListeners = (dialog: HTMLElement) => {
    // 监听draggable-resizable-vue3的拖拽事件
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    mouseDownHandler = (e: MouseEvent) => {
      // 只处理左键点击
      if (e.button !== 0) return;

      // 如果点击的是关闭按钮，不处理拖拽
      if ((e.target as HTMLElement).closest(".sc-window-dialog__close")) return;

      isDragging.value = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = dialog.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      // 保存原始状态
      if (!originalState.value && !isShrunk.value) {
        saveOriginalState(dialog);
      }

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.value) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newLeft = startLeft + deltaX;
      const newTop = startTop + deltaY;

      // 更新位置
      dialog.style.left = `${newLeft}px`;
      dialog.style.top = `${newTop}px`;
      dialog.style.transform = "none";
      dialog.style.margin = "0";

      // 检查是否需要收缩
      checkShrinkCondition(dialog, newLeft, newTop);
    };

    const handleMouseUp = () => {
      isDragging.value = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    // 监听拖拽手柄
    const header = dialog.querySelector(".sc-window-dialog__header") as HTMLElement;
    if (header) {
      header.addEventListener("mousedown", mouseDownHandler);
    }
  };

  /**
   * 设置点击监听器
   */
  const setupClickListeners = (dialog: HTMLElement) => {
    clickHandler = (e: MouseEvent) => {
      // 如果是收缩状态，点击恢复
      if (isShrunk.value) {
        restoreDialog(dialog);
        e.stopPropagation();
      }
    };

    dialog.addEventListener("click", clickHandler);
  };

  /**
   * 保存原始状态
   */
  const saveOriginalState = (dialog: HTMLElement) => {
    const computedStyle = window.getComputedStyle(dialog);
    originalState.value = {
      width: computedStyle.width,
      height: computedStyle.height,
      top: computedStyle.top,
      left: computedStyle.left,
      transform: computedStyle.transform
    };

    // 保存到管理器
    dialogManager.setShrunk(dialogId, false, {
      width: computedStyle.width,
      height: computedStyle.height,
      top: computedStyle.top,
      left: computedStyle.left
    });
  };

  /**
   * 检查收缩条件
   */
  const checkShrinkCondition = (dialog: HTMLElement, left: number, top: number) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const threshold = options.edgeThreshold;
    
    // 获取对话框当前尺寸
    const dialogWidth = dialog.offsetWidth;
    const dialogHeight = dialog.offsetHeight;

    // 检查是否接近边缘（使用实际的left和top位置）
    const nearLeftEdge = left <= threshold;
    const nearRightEdge = left + dialogWidth >= windowWidth - threshold;
    const nearTopEdge = top <= threshold;
    const nearBottomEdge = top + dialogHeight >= windowHeight - threshold;

    if ((nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge) && !isShrunk.value) {
      shrinkDialog(dialog, left, top, nearLeftEdge, nearRightEdge, nearTopEdge, nearBottomEdge);
    } else if (!nearLeftEdge && !nearRightEdge && !nearTopEdge && !nearBottomEdge && isShrunk.value) {
      // 如果拖离边缘，恢复原状
      restoreDialog(dialog);
    }
  };

  /**
   * 收缩对话框
   */
  const shrinkDialog = (dialog: HTMLElement, left: number, top: number, nearLeft: boolean, nearRight: boolean, nearTop: boolean, nearBottom: boolean) => {
    if (isShrunk.value) return;

    isShrunk.value = true;

    // 计算收缩位置
    let shrunkLeft = left;
    let shrunkTop = top;

    if (nearLeft) {
      shrunkLeft = -options.shrinkSize / 2;
    } else if (nearRight) {
      shrunkLeft = window.innerWidth - options.shrinkSize / 2;
    }

    if (nearTop) {
      shrunkTop = -options.shrinkSize / 2;
    } else if (nearBottom) {
      shrunkTop = window.innerHeight - options.shrinkSize / 2;
    }

    // 应用收缩样式
    dialog.style.width = `${options.shrinkSize}px`;
    dialog.style.height = `${options.shrinkSize}px`;
    dialog.style.left = `${shrunkLeft}px`;
    dialog.style.top = `${shrunkTop}px`;
    dialog.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

    // 添加收缩状态类
    dialog.classList.add("sc-window-dialog--shrunk");

    // 更新管理器状态
    dialogManager.setShrunk(dialogId, true, undefined, {
      top: `${shrunkTop}px`,
      left: `${shrunkLeft}px`
    });

    // 移除过渡效果
    setTimeout(() => {
      dialog.style.transition = "";
    }, 300);
  };

  /**
   * 恢复对话框
   */
  const restoreDialog = (dialog: HTMLElement) => {
    if (!isShrunk.value || !originalState.value) return;

    isShrunk.value = false;

    // 恢复原始样式
    dialog.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    dialog.style.width = originalState.value.width;
    dialog.style.height = originalState.value.height;
    dialog.style.top = originalState.value.top;
    dialog.style.left = originalState.value.left;
    dialog.style.transform = originalState.value.transform;

    // 移除收缩状态类
    dialog.classList.remove("sc-window-dialog--shrunk");

    // 更新管理器状态
    dialogManager.setShrunk(dialogId, false);

    // 移除过渡效果
    setTimeout(() => {
      dialog.style.transition = "";
    }, 300);
  };

  // 存储事件处理函数引用，用于正确移除事件监听器
  let mouseDownHandler: ((e: MouseEvent) => void) | null = null;
  let clickHandler: ((e: MouseEvent) => void) | null = null;

  /**
   * 销毁自动收缩功能
   */
  const destroyAutoShrink = () => {
    if (dialogElement.value) {
      // 移除事件监听器
      const header = dialogElement.value.querySelector(".sc-window-dialog__header") as HTMLElement;
      if (header && mouseDownHandler) {
        header.removeEventListener("mousedown", mouseDownHandler);
      }
      if (clickHandler) {
        dialogElement.value.removeEventListener("click", clickHandler);
      }
    }
    // 清理引用
    mouseDownHandler = null;
    clickHandler = null;
  };

  return {
    initAutoShrink,
    destroyAutoShrink,
    isShrunk,
    restoreDialog: () => dialogElement.value && restoreDialog(dialogElement.value)
  };
}
