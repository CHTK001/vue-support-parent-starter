/**
 * useDialogZIndex - 对话框 z-index 管理 composable
 * 管理多对话框场景下的层级关系
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-12-29
 */
import { ref, type Ref } from 'vue';

/** 对话框实例信息 */
export interface DialogInstance {
  id: string;
  zIndex: number;
  rect: DOMRect | null;
  element: HTMLElement | null;
  isMinimized: boolean;
}

/** z-index 管理器选项 */
export interface ZIndexManagerOptions {
  /** 初始 z-index 值 */
  initialZIndex?: number;
}

/** z-index 管理器返回值 */
export interface ZIndexManagerReturn {
  /** 当前 z-index */
  currentZIndex: Ref<number>;
  /** 生成唯一对话框 ID */
  generateDialogId: () => string;
  /** 获取下一个 z-index */
  getNextZIndex: () => number;
  /** 激活对话框（置于顶层） */
  activateDialog: (id: string) => number;
  /** 注册对话框 */
  registerDialog: (id: string, element: HTMLElement | null) => void;
  /** 注销对话框 */
  unregisterDialog: (id: string) => void;
  /** 更新对话框位置信息 */
  updateDialogRect: (id: string, element: HTMLElement | null) => void;
  /** 获取所有其他对话框的位置信息（用于对齐辅助线） */
  getOtherDialogsRects: (excludeId: string) => DOMRect[];
  /** 设置对话框最小化状态 */
  setDialogMinimized: (id: string, isMinimized: boolean) => void;
  /** 获取对话框实例 */
  getDialogInstance: (id: string) => DialogInstance | undefined;
  /** 获取所有对话框数量 */
  getDialogCount: () => number;
}

// 全局对话框注册表（模块级别单例）
const dialogRegistry = new Map<string, DialogInstance>();
let globalZIndex = 2050;
let dialogIdCounter = 0;

/**
 * 对话框 z-index 管理 composable
 * @param options 配置选项
 * @returns ZIndexManagerReturn
 */
export function useDialogZIndex(options: ZIndexManagerOptions = {}): ZIndexManagerReturn {
  const { initialZIndex = 2050 } = options;
  
  // 初始化全局 z-index
  if (globalZIndex < initialZIndex) {
    globalZIndex = initialZIndex;
  }

  const currentZIndex = ref(globalZIndex);

  /**
   * 生成唯一对话框 ID
   */
  const generateDialogId = (): string => {
    return `sc-dialog-${++dialogIdCounter}-${Date.now()}`;
  };

  /**
   * 获取下一个 z-index
   */
  const getNextZIndex = (): number => {
    return ++globalZIndex;
  };

  /**
   * 激活对话框（置于顶层）
   */
  const activateDialog = (id: string): number => {
    const newZIndex = getNextZIndex();
    const instance = dialogRegistry.get(id);
    if (instance) {
      instance.zIndex = newZIndex;
    }
    currentZIndex.value = newZIndex;
    return newZIndex;
  };

  /**
   * 注册对话框
   */
  const registerDialog = (id: string, element: HTMLElement | null): void => {
    dialogRegistry.set(id, {
      id,
      zIndex: getNextZIndex(),
      rect: element?.getBoundingClientRect() || null,
      element,
      isMinimized: false,
    });
    currentZIndex.value = globalZIndex;
  };

  /**
   * 注销对话框
   */
  const unregisterDialog = (id: string): void => {
    dialogRegistry.delete(id);
  };

  /**
   * 更新对话框位置信息
   */
  const updateDialogRect = (id: string, element: HTMLElement | null): void => {
    const instance = dialogRegistry.get(id);
    if (instance && element) {
      instance.rect = element.getBoundingClientRect();
      instance.element = element;
    }
  };

  /**
   * 获取所有其他对话框的位置信息（用于对齐辅助线）
   */
  const getOtherDialogsRects = (excludeId: string): DOMRect[] => {
    const rects: DOMRect[] = [];
    dialogRegistry.forEach((instance, id) => {
      if (id !== excludeId && instance.rect && !instance.isMinimized) {
        rects.push(instance.rect);
      }
    });
    return rects;
  };

  /**
   * 设置对话框最小化状态
   */
  const setDialogMinimized = (id: string, isMinimized: boolean): void => {
    const instance = dialogRegistry.get(id);
    if (instance) {
      instance.isMinimized = isMinimized;
    }
  };

  /**
   * 获取对话框实例
   */
  const getDialogInstance = (id: string): DialogInstance | undefined => {
    return dialogRegistry.get(id);
  };

  /**
   * 获取所有对话框数量
   */
  const getDialogCount = (): number => {
    return dialogRegistry.size;
  };

  return {
    currentZIndex,
    generateDialogId,
    getNextZIndex,
    activateDialog,
    registerDialog,
    unregisterDialog,
    updateDialogRect,
    getOtherDialogsRects,
    setDialogMinimized,
    getDialogInstance,
    getDialogCount,
  };
}

// 导出类型别名以匹配 index.ts 的导出
export type DialogZIndexOptions = ZIndexManagerOptions;
export type DialogZIndexReturn = ZIndexManagerReturn;

// 导出全局单例管理器
export const dialogZIndexManager = useDialogZIndex();

export default useDialogZIndex;
