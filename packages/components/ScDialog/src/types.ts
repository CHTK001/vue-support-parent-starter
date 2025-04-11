import { ExtractPropTypes } from 'vue';

/**
 * ScDialog 组件属性定义
 */
export interface ScDialogProps {
  // 对话框基本属性
  modelValue?: boolean;         // 控制对话框显示与隐藏
  title?: string;               // 对话框标题
  width?: string;               // 对话框宽度
  top?: string;                 // 对话框距离顶部的距离
  modal?: boolean;              // 是否显示遮罩层
  appendToBody?: boolean;       // 是否将对话框插入至 body 元素
  lockScroll?: boolean;         // 是否在对话框出现时将 body 滚动锁定
  closeOnClickModal?: boolean;  // 是否可以通过点击遮罩层关闭对话框
  closeOnPressEscape?: boolean; // 是否可以通过按下 ESC 关闭对话框
  showClose?: boolean;          // 是否显示关闭按钮
  beforeClose?: (done: () => void) => void; // 关闭前的回调，会暂停对话框的关闭
  draggable?: boolean;          // 是否可拖拽
  center?: boolean;             // 是否居中布局
  destroyOnClose?: boolean;     // 关闭时是否销毁对话框内的元素
  
  // 布局模式
  layout?: 'default' | 'simple' | 'headless'; // 对话框布局模式
  
  // 扩展属性
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'; // 对话框类型
  icon?: string;                // 对话框图标
  showIcon?: boolean;           // 是否显示图标
  isForm?: boolean;             // 是否包含表单，用于启用表单项动画
  
  // 底部按钮属性
  showFooter?: boolean;         // 是否显示底部
  showCancelButton?: boolean;   // 是否显示取消按钮
  showConfirmButton?: boolean;  // 是否显示确认按钮
  cancelText?: string;          // 取消按钮文本
  confirmText?: string;         // 确认按钮文本
  cancelIcon?: string;          // 取消按钮图标
  confirmIcon?: string;         // 确认按钮图标
  confirmButtonType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'; // 确认按钮类型
  loading?: boolean;            // 确认按钮加载状态
}

/**
 * ScDialog 组件事件定义
 */
export interface ScDialogEmits {
  (e: 'update:modelValue', value: boolean): void; // 更新modelValue
  (e: 'open'): void;                              // 对话框打开时触发
  (e: 'opened'): void;                            // 对话框打开动画结束时触发
  (e: 'close'): void;                             // 对话框关闭时触发
  (e: 'closed'): void;                            // 对话框关闭动画结束时触发
  (e: 'cancel'): void;                            // 点击取消按钮时触发
  (e: 'confirm'): void;                           // 点击确认按钮时触发
}

/**
 * ScDialog 组件实例类型
 */
export interface ScDialogInstance {
  open: () => void;  // 打开对话框
  close: () => void; // 关闭对话框
} 