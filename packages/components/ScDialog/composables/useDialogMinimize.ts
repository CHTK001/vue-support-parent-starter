/**
 * useDialogMinimize - 对话框最小化/最大化/边缘吸附 composable
 * 管理对话框的最小化、最大化和边缘吸附状态
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-12-29
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue';

/** 吸附位置类型 */
export type DockPosition = 'left' | 'right' | 'top' | 'bottom' | null;

/** 对话框状态 */
export interface DialogState {
  x: number;
  y: number;
  width: string;
  height: string;
}

/** 最小化配置选项 */
export interface DialogMinimizeOptions {
  /** 边缘吸附阈值（像素） */
  edgeThreshold?: number;
  /** 是否启用边缘吸附 */
  edgeDock?: boolean;
  /** 是否在最小化时显示标题 */
  minimizeShowTitle?: boolean;
}

/** 最小化返回值 */
export interface DialogMinimizeReturn {
  /** 是否已最小化 */
  isMinimized: Ref<boolean>;
  /** 是否已最大化 */
  isMaximized: Ref<boolean>;
  /** 吸附位置 */
  dockPosition: Ref<DockPosition>;
  /** 最小化图标位置 */
  minimizedIconPosition: Ref<{ x: number; y: number } | null>;
  /** 最小化前的对话框状态 */
  lastDialogState: Ref<DialogState | null>;
  /** 原始对话框状态（居中位置） */
  originalDialogState: Ref<DialogState | null>;
  /** 最大化前的状态 */
  preMaximizeState: Ref<DialogState | null>;
  /** 最小化过渡动画名称 */
  minimizeTransitionName: ComputedRef<string>;
  /** 最小化到边缘 */
  minimizeToEdge: (position: DockPosition, element: HTMLElement) => void;
  /** 从最小化恢复 */
  restoreFromMinimized: (element: HTMLElement | null, restorePosition?: { x: number; y: number }) => void;
  /** 最大化 */
  maximize: (element: HTMLElement) => void;
  /** 从最大化恢复 */
  restoreFromMaximize: (element: HTMLElement) => void;
  /** 切换最大化状态 */
  toggleMaximize: (element: HTMLElement) => void;
  /** 检测边缘吸附 */
  checkEdgeDock: (element: HTMLElement, clientX: number, clientY: number) => DockPosition;
  /** 保存对话框状态 */
  saveDialogState: (element: HTMLElement) => DialogState;
  /** 恢复对话框状态 */
  restoreDialogState: (element: HTMLElement, state: DialogState) => void;
  /** 重置状态 */
  resetState: () => void;
}

/**
 * 对话框最小化/最大化/边缘吸附 composable
 * @param options 配置选项
 * @returns DialogMinimizeReturn
 */
export function useDialogMinimize(options: DialogMinimizeOptions = {}): DialogMinimizeReturn {
  const {
    edgeThreshold = 50,
    edgeDock = true,
    minimizeShowTitle = true,
  } = options;

  // 状态
  const isMinimized = ref(false);
  const isMaximized = ref(false);
  const dockPosition = ref<DockPosition>(null);
  const minimizedIconPosition = ref<{ x: number; y: number } | null>(null);
  const lastDialogState = ref<DialogState | null>(null);
  const originalDialogState = ref<DialogState | null>(null);
  const preMaximizeState = ref<DialogState | null>(null);

  /**
   * 最小化过渡动画名称
   */
  const minimizeTransitionName = computed(() => {
    if (!dockPosition.value) return 'dialog-fade';
    return `dialog-minimize-${dockPosition.value}`;
  });

  /**
   * 保存对话框状态
   */
  const saveDialogState = (element: HTMLElement): DialogState => {
    return {
      x: parseFloat(element.getAttribute('data-x') || '0') || 0,
      y: parseFloat(element.getAttribute('data-y') || '0') || 0,
      width: element.style.width || '',
      height: element.style.height || '',
    };
  };

  /**
   * 恢复对话框状态
   */
  const restoreDialogState = (element: HTMLElement, state: DialogState): void => {
    element.style.transform = `translate(${state.x}px, ${state.y}px)`;
    element.setAttribute('data-x', String(state.x));
    element.setAttribute('data-y', String(state.y));
    if (state.width) {
      element.style.width = state.width;
    }
    if (state.height) {
      element.style.height = state.height;
    }
  };

  /**
   * 检测边缘吸附
   */
  const checkEdgeDock = (element: HTMLElement, clientX: number, clientY: number): DockPosition => {
    if (!edgeDock) return null;

    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 检测左边缘
    if (rect.left <= edgeThreshold) {
      return 'left';
    }
    // 检测右边缘
    if (rect.right >= viewportWidth - edgeThreshold) {
      return 'right';
    }
    // 检测顶部边缘
    if (rect.top <= edgeThreshold) {
      return 'top';
    }
    // 检测底部边缘
    if (rect.bottom >= viewportHeight - edgeThreshold) {
      return 'bottom';
    }

    return null;
  };

  /**
   * 最小化到边缘
   */
  const minimizeToEdge = (position: DockPosition, element: HTMLElement): void => {
    const rect = element.getBoundingClientRect();

    // 保存当前状态
    lastDialogState.value = saveDialogState(element);

    dockPosition.value = position;
    isMinimized.value = true;

    // 计算最小化图标位置
    const iconSize = 48;
    switch (position) {
      case 'left':
        minimizedIconPosition.value = { x: 0, y: rect.top };
        break;
      case 'right':
        minimizedIconPosition.value = { x: window.innerWidth - iconSize, y: rect.top };
        break;
      case 'top':
        minimizedIconPosition.value = { x: rect.left + rect.width / 2 - iconSize / 2, y: 0 };
        break;
      case 'bottom':
        minimizedIconPosition.value = { x: rect.left + rect.width / 2 - iconSize / 2, y: window.innerHeight - iconSize };
        break;
      default:
        minimizedIconPosition.value = null;
    }
  };

  /**
   * 从最小化恢复
   */
  const restoreFromMinimized = (
    element: HTMLElement | null,
    restorePosition?: { x: number; y: number }
  ): void => {
    isMinimized.value = false;
    dockPosition.value = null;
    minimizedIconPosition.value = null;

    if (!element) return;

    // 使用原始位置或保存的状态
    const stateToUse = originalDialogState.value || lastDialogState.value;
    
    if (stateToUse) {
      const x = restorePosition?.x ?? stateToUse.x;
      const y = restorePosition?.y ?? stateToUse.y;
      
      element.style.transform = `translate(${x}px, ${y}px)`;
      element.setAttribute('data-x', String(x));
      element.setAttribute('data-y', String(y));
      
      if (stateToUse.width) {
        element.style.width = stateToUse.width;
      }
      if (stateToUse.height) {
        element.style.height = stateToUse.height;
      }
    }
  };

  /**
   * 最大化
   */
  const maximize = (element: HTMLElement): void => {
    if (isMaximized.value) return;

    // 保存当前状态
    preMaximizeState.value = saveDialogState(element);
    isMaximized.value = true;
  };

  /**
   * 从最大化恢复
   */
  const restoreFromMaximize = (element: HTMLElement): void => {
    isMaximized.value = false;

    if (element && preMaximizeState.value) {
      restoreDialogState(element, preMaximizeState.value);
    }
  };

  /**
   * 切换最大化状态
   */
  const toggleMaximize = (element: HTMLElement): void => {
    if (isMaximized.value) {
      restoreFromMaximize(element);
    } else {
      maximize(element);
    }
  };

  /**
   * 重置状态
   */
  const resetState = (): void => {
    isMinimized.value = false;
    isMaximized.value = false;
    dockPosition.value = null;
    minimizedIconPosition.value = null;
    lastDialogState.value = null;
    originalDialogState.value = null;
    preMaximizeState.value = null;
  };

  return {
    isMinimized,
    isMaximized,
    dockPosition,
    minimizedIconPosition,
    lastDialogState,
    originalDialogState,
    preMaximizeState,
    minimizeTransitionName,
    minimizeToEdge,
    restoreFromMinimized,
    maximize,
    restoreFromMaximize,
    toggleMaximize,
    checkEdgeDock,
    saveDialogState,
    restoreDialogState,
    resetState,
  };
}

export default useDialogMinimize;
