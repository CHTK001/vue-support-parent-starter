import { ExtractPropTypes } from 'vue';

/**
 * 缩放尺寸限制
 */
export interface ResizeSizeLimit {
  /** 最小宽度 */
  width: number;
  /** 最小高度 */
  height: number;
}

/**
 * 缩放边缘配置
 */
export interface ResizeEdges {
  /** 左边缘 */
  left?: boolean;
  /** 右边缘 */
  right?: boolean;
  /** 上边缘 */
  top?: boolean;
  /** 下边缘 */
  bottom?: boolean;
}

/**
 * 边缘吸附位置类型
 */
export type EdgeDockPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * 最小化位置类型
 */
export type MinimizePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * 对话框状态
 */
export interface DialogState {
  /** 是否最小化 */
  isMinimized: boolean;
  /** 是否边缘吸附 */
  isEdgeDocked: boolean;
  /** 吸附边缘位置 */
  dockedEdge?: EdgeDockPosition;
  /** 最小化位置 */
  minimizePosition?: MinimizePosition;
  /** 当前位置 X */
  x: number;
  /** 当前位置 Y */
  y: number;
  /** 当前宽度 */
  width: number;
  /** 当前高度 */
  height: number;
}

/**
 * ScDialog 组件属性定义
 * @author CH
 * @version 3.0.0
 * @since 2025-12-01
 */
export interface ScDialogProps {
  // 对话框基本属性
  /** 控制对话框显示与隐藏 */
  modelValue?: boolean;
  /** 对话框唯一标识，用于多弹框管理 */
  dialogId?: string;
  /** 对话框标题 */
  title?: string;
  /** 对话框宽度 */
  width?: string;
  /** 对话框距离顶部的距离 */
  top?: string;
  /** 是否显示遮罩层 */
  modal?: boolean;
  /** 是否将对话框插入至 body 元素 */
  appendToBody?: boolean;
  /** 是否在对话框出现时将 body 滚动锁定 */
  lockScroll?: boolean;
  /** 是否可以通过点击遮罩层关闭对话框 */
  closeOnClickModal?: boolean;
  /** 是否可以通过按下 ESC 关闭对话框 */
  closeOnPressEscape?: boolean;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 关闭前的回调，会暂停对话框的关闭 */
  beforeClose?: (done: () => void) => void;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 是否居中布局 */
  center?: boolean;
  /** 关闭时是否销毁对话框内的元素 */
  destroyOnClose?: boolean;

  // 布局模式
  /** 对话框布局模式 */
  layout?: 'default' | 'simple' | 'headless';

  // 扩展属性
  /** 对话框类型 */
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** 对话框图标 */
  icon?: string;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 是否包含表单，用于启用表单项动画 */
  isForm?: boolean;

  // 缩放属性
  /** 是否可缩放 */
  resizable?: boolean;
  /** 可缩放的边缘 */
  resizeEdges?: ResizeEdges;
  /** 最小尺寸 */
  minSize?: ResizeSizeLimit;
  /** 最大尺寸 */
  maxSize?: ResizeSizeLimit;
  /** 是否保持宽高比 */
  preserveAspectRatio?: boolean;

  // 边缘吸附属性
  /** 是否启用边缘吸附 */
  enableEdgeDock?: boolean;
  /** 边缘吸附阈值（像素） */
  edgeDockThreshold?: number;

  // 最小化属性
  /** 是否启用最小化 */
  enableMinimize?: boolean;
  /** 是否显示最小化按钮 */
  showMinimizeButton?: boolean;
  /** 最小化图标 */
  minimizeIcon?: string;
  /** 最小化后的图标 */
  minimizedIcon?: string;
  /** 默认最小化位置 */
  defaultMinimizePosition?: MinimizePosition;

  // 底部按钮属性
  /** 是否显示底部 */
  showFooter?: boolean;
  /** 是否显示取消按钮 */
  showCancelButton?: boolean;
  /** 是否显示确认按钮 */
  showConfirmButton?: boolean;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消按钮图标 */
  cancelIcon?: string;
  /** 确认按钮图标 */
  confirmIcon?: string;
  /** 确认按钮类型 */
  confirmButtonType?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** 确认按钮加载状态 */
  loading?: boolean;
}

/**
 * ScDialog 组件事件定义
 * @author CH
 * @version 3.0.0
 * @since 2025-12-01
 */
export interface ScDialogEmits {
  /** 更新modelValue */
  (e: 'update:modelValue', value: boolean): void;
  /** 对话框打开时触发 */
  (e: 'open'): void;
  /** 对话框打开动画结束时触发 */
  (e: 'opened'): void;
  /** 对话框关闭时触发 */
  (e: 'close'): void;
  /** 对话框关闭动画结束时触发 */
  (e: 'closed'): void;
  /** 点击取消按钮时触发 */
  (e: 'cancel'): void;
  /** 点击确认按钮时触发 */
  (e: 'confirm'): void;
  /** 缩放时触发 */
  (e: 'resize', size: { width: number; height: number }): void;
  /** 最小化时触发 */
  (e: 'minimize', position: MinimizePosition): void;
  /** 从最小化恢复时触发 */
  (e: 'restore'): void;
  /** 边缘吸附时触发 */
  (e: 'edgeDock', edge: EdgeDockPosition): void;
  /** 取消边缘吸附时触发 */
  (e: 'edgeUndock'): void;
}

/**
 * ScDialog 组件实例类型
 * @author CH
 * @version 3.0.0
 * @since 2025-12-01
 */
export interface ScDialogInstance {
  /** 打开对话框 */
  open: () => void;
  /** 关闭对话框 */
  close: () => void;
  /** 最小化对话框 */
  minimize: (position?: MinimizePosition) => void;
  /** 从最小化恢复 */
  restore: () => void;
  /** 吸附到边缘 */
  dockToEdge: (edge: EdgeDockPosition) => void;
  /** 取消边缘吸附 */
  undockFromEdge: () => void;
  /** 获取对话框状态 */
  getState: () => DialogState;
}